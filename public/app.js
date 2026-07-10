/* 共享行情逻辑 — 每个页面通过 window.MARKET 提供市场配置:
   { key, name, prefixes, placeholder, defaults } */
const M = window.MARKET;
const REFRESH_MS = 2000;
const FETCH_TIMEOUT = 3500;
const STORAGE_KEY = 'watchlist_' + M.key;

let watchlist = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || M.defaults;
let lastPrices = {};
let timer = null;

function saveList() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
  if (Auth.user) Auth.saveWatchlist(M.key, watchlist);
}

/* 登录状态变化：登录后加载账号自选（首次登录把本机列表迁移上去），退出回到本机列表 */
window.onAuthChange = async (user) => {
  if (user) {
    const saved = await Auth.getWatchlist(M.key);
    if (saved === null) {
      Auth.saveWatchlist(M.key, watchlist);
    } else {
      watchlist = saved.codes;
    }
  } else {
    watchlist = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || M.defaults;
  }
  refresh();
};

function inMarket(code) { return M.prefixes.some(p => code.startsWith(p)); }

function addStock() {
  const input = document.getElementById('codeInput');
  const code = input.value.trim();
  if (!code) return;
  input.value = '';
  fetchQuotes([code]).then(res => {
    const q = res.quotes && res.quotes[0];
    if (!q || q.error) { alert('未找到该股票：' + code); return; }
    if (!inMarket(q.code)) {
      alert(`「${q.name}」不属于${M.name}，请切换到对应市场页面添加`);
      return;
    }
    if (watchlist.includes(q.code)) { alert('已在自选列表中'); return; }
    watchlist.push(q.code);
    saveList();
    refresh();
  }).catch(() => alert('查询失败，请检查网络'));
}

function removeStock(code) {
  watchlist = watchlist.filter(c => c !== code);
  saveList();
  refresh();
}

async function fetchQuotes(codes) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const resp = await fetch('/api/quote?codes=' + encodeURIComponent(codes.join(',')),
                             { signal: ctrl.signal });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    return await resp.json();
  } finally {
    clearTimeout(to);
  }
}

function fmtNum(v, digits = 2) {
  if (v === null || v === undefined || isNaN(v)) return '--';
  return v.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function fmtVolume(shares) { // 股
  if (shares == null) return '--';
  if (shares >= 1e8) return (shares / 1e8).toFixed(2) + '亿股';
  if (shares >= 1e4) return (shares / 1e4).toFixed(2) + '万股';
  return fmtNum(shares, 0) + '股';
}
function fmtAmount(yuan) { // 元
  if (yuan == null) return '--';
  if (yuan >= 1e8) return (yuan / 1e8).toFixed(2) + '亿';
  if (yuan >= 1e4) return (yuan / 1e4).toFixed(2) + '万';
  return fmtNum(yuan, 0);
}
function cls(v) { return v > 0 ? 'up' : v < 0 ? 'down' : 'flat'; }
function sign(v) { return v > 0 ? '+' : ''; }

function render(quotes) {
  const tbody = document.getElementById('tbody');
  const empty = document.getElementById('empty');
  empty.style.display = quotes.length ? 'none' : 'block';

  tbody.innerHTML = quotes.map(q => {
    if (q.error) {
      return `<tr><td colspan="11" class="row-error">${q.code}：${q.error}</td>
        <td><button class="del-btn" onclick="removeStock('${q.code}')" title="删除">✕</button></td></tr>`;
    }
    const c = cls(q.change);
    const prev = lastPrices[q.code];
    let flash = '';
    if (prev !== undefined && q.price !== prev) flash = q.price > prev ? 'flash-up' : 'flash-down';
    lastPrices[q.code] = q.price;

    return `<tr class="${flash}">
      <td><div class="stock-name">${q.name}</div><div class="stock-code">${q.code.toUpperCase()}${q.currency && q.currency !== 'CNY' ? ' · ' + q.currency : ''}</div></td>
      <td class="price ${c}">${fmtNum(q.price)}</td>
      <td><span class="chg-badge ${c}">${sign(q.changePercent)}${fmtNum(q.changePercent)}%</span></td>
      <td class="num ${c}">${sign(q.change)}${fmtNum(q.change)}</td>
      <td class="num ${cls(q.open - q.prevClose)}">${fmtNum(q.open)}</td>
      <td class="num ${cls(q.high - q.prevClose)}">${fmtNum(q.high)}</td>
      <td class="num ${cls(q.low - q.prevClose)}">${fmtNum(q.low)}</td>
      <td class="num flat">${fmtNum(q.prevClose)}</td>
      <td class="num flat">${fmtVolume(q.volume)}</td>
      <td class="num flat">${fmtAmount(q.amount)}</td>
      <td class="num flat">${q.turnover != null ? fmtNum(q.turnover) + '%' : '--'}</td>
      <td><button class="del-btn" onclick="removeStock('${q.code}')" title="删除">✕</button></td>
    </tr>`;
  }).join('');
}

function setStatus(ok, text) {
  document.getElementById('statusDot').className = 'dot' + (ok ? '' : ' err');
  document.getElementById('statusText').textContent = text;
}

async function refresh() {
  if (!watchlist.length) { render([]); setStatus(true, '无自选股'); return; }
  try {
    const res = await fetchQuotes(watchlist);
    render(res.quotes || []);
    setStatus(true, '已更新 ' + new Date().toLocaleTimeString('zh-CN'));
  } catch (e) {
    setStatus(false, '刷新失败，将自动重试');
  }
}

document.getElementById('codeInput').placeholder = M.placeholder;

/* 自适应刷新循环：请求完成后再排下一次，慢请求不会堆积卡死 */
let refreshing = false;
const _refresh = refresh;
refresh = async function () {
  if (refreshing) return;
  refreshing = true;
  try { await _refresh(); } finally { refreshing = false; }
};

async function loop() {
  const started = Date.now();
  if (!document.hidden) await refresh();
  const wait = Math.max(REFRESH_MS - (Date.now() - started), 200);
  timer = setTimeout(loop, wait);
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refresh();
});
loop();
