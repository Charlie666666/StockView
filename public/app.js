/* 共享行情逻辑（港股/A股/韩股）— 通过 window.MARKET 提供市场配置:
   { key, prefixes, inputPrefix?, priceDigits?, indices?, defaults } */
const M = window.MARKET;
const REFRESH_MS = 2000;
const FETCH_TIMEOUT = 3500;
const STORAGE_KEY = 'watchlist_' + M.key;
const PDIG = M.priceDigits != null ? M.priceDigits : 2;   // 价格小数位（韩元=0）

/* ---------- 多语言 ---------- */
const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '简体中文' },
  { code: 'tw', label: '繁體中文' },
];
const I18N = {
  en: {
    nav: { us: 'US', kr: 'KR', hk: 'HK', a: 'CN-A' },
    mkt: { hk: 'HK Stocks', a: 'A-Shares', kr: 'KR Stocks' },
    docTitle: { hk: 'HK Markets · StockView', a: 'A-Shares · StockView', kr: 'KR Markets · StockView' },
    indices: 'Market Indices', indicesSrc: 'via Yahoo Finance',
    watchlist: 'Watchlist', add: '＋ Add',
    ph: { hk: 'Add HK ticker, e.g. 00700 / 09988', a: 'Add A-share code, e.g. 600519 / 000001', kr: 'Add KR ticker, e.g. 005930 / 000660' },
    hint: { hk: 'HK codes are 1-5 digits · Prices in HKD · Red up / green down', a: 'A-share 6-digit codes · Prices in CNY · Red up / green down', kr: 'KR 6-digit codes · Prices in KRW · Red up / green down' },
    th: { name: 'Name / Symbol', price: 'Price', chgP: 'Chg %', chg: 'Chg', open: 'Open', high: 'High', low: 'Low', prev: 'Prev Close', vol: 'Volume', amt: 'Turnover', turn: 'Turnover %' },
    empty: 'Watchlist is empty. Add a code above.',
    updated: 'Updated', noStock: 'No stocks', failed: 'Refresh failed, retrying',
    notFound: 'Symbol not found: ', wrongMkt: (n, m) => `"${n}" is not a ${m} listing`, exists: 'Already in watchlist', netErr: 'Query failed, check your network',
    volU: null, amtU: null,
  },
  zh: {
    nav: { us: '美股', kr: '韩股', hk: '港股', a: 'A股' },
    mkt: { hk: '港股', a: 'A股', kr: '韩股' },
    docTitle: { hk: '港股行情 · StockView', a: 'A股行情 · StockView', kr: '韩股行情 · StockView' },
    indices: '大盘指数', indicesSrc: '数据源 Yahoo Finance',
    watchlist: '自选股', add: '＋ 添加自选',
    ph: { hk: '输入港股代码添加自选，如 00700 / 09988', a: '输入A股代码添加自选，如 600519 / 000001', kr: '输入韩股代码添加自选，如 005930 / 000660' },
    hint: { hk: '港股代码 1-5 位数字 · 价格单位 HKD · 红涨绿跌', a: 'A股六位代码 · 价格单位 CNY · 红涨绿跌', kr: '韩股 6 位数字代码 · 价格单位 KRW · 红涨绿跌' },
    th: { name: '名称 / 代码', price: '最新价', chgP: '涨跌幅', chg: '涨跌额', open: '今开', high: '最高', low: '最低', prev: '昨收', vol: '成交量', amt: '成交额', turn: '换手率' },
    empty: '暂无自选股，在上方输入代码添加',
    updated: '已更新', noStock: '无自选股', failed: '刷新失败，将自动重试',
    notFound: '未找到该股票：', wrongMkt: (n, m) => `「${n}」不属于${m}，请切换到对应市场页面添加`, exists: '已在自选列表中', netErr: '查询失败，请检查网络',
    volU: ['亿', '万'], amtU: ['亿', '万'],
  },
  tw: {
    nav: { us: '美股', kr: '韓股', hk: '港股', a: 'A股' },
    mkt: { hk: '港股', a: 'A股', kr: '韓股' },
    docTitle: { hk: '港股行情 · StockView', a: 'A股行情 · StockView', kr: '韓股行情 · StockView' },
    indices: '大盤指數', indicesSrc: '數據源 Yahoo Finance',
    watchlist: '自選股', add: '＋ 加入自選',
    ph: { hk: '輸入港股代碼加入自選，如 00700 / 09988', a: '輸入A股代碼加入自選，如 600519 / 000001', kr: '輸入韓股代碼加入自選，如 005930 / 000660' },
    hint: { hk: '港股代碼 1-5 位數字 · 價格單位 HKD · 紅漲綠跌', a: 'A股六位代碼 · 價格單位 CNY · 紅漲綠跌', kr: '韓股 6 位數字代碼 · 價格單位 KRW · 紅漲綠跌' },
    th: { name: '名稱 / 代碼', price: '最新價', chgP: '漲跌幅', chg: '漲跌額', open: '今開', high: '最高', low: '最低', prev: '昨收', vol: '成交量', amt: '成交額', turn: '換手率' },
    empty: '暫無自選股，在上方輸入代碼加入',
    updated: '已更新', noStock: '無自選股', failed: '刷新失敗，將自動重試',
    notFound: '未找到該股票：', wrongMkt: (n, m) => `「${n}」不屬於${m}，請切換到對應市場頁面加入`, exists: '已在自選清單中', netErr: '查詢失敗，請檢查網路',
    volU: ['億', '萬'], amtU: ['億', '萬'],
  },
  ja: {
    nav: { us: '米国株', kr: '韓国株', hk: '香港株', a: '中国A株' },
    mkt: { hk: '香港株', a: '中国A株', kr: '韓国株' },
    docTitle: { hk: '香港株 · StockView', a: '中国A株 · StockView', kr: '韓国株 · StockView' },
    indices: '主要指数', indicesSrc: 'データ元 Yahoo Finance',
    watchlist: 'ウォッチリスト', add: '＋ 追加',
    ph: { hk: '香港株コードを入力（例: 00700 / 09988）', a: '中国A株コードを入力（例: 600519 / 000001）', kr: '韓国株コードを入力（例: 005930 / 000660）' },
    hint: { hk: '香港株コードは1-5桁 · 表示は HKD · 上昇=赤 / 下落=緑', a: '中国A株は6桁コード · 表示は CNY · 上昇=赤 / 下落=緑', kr: '韓国株は6桁コード · 表示は KRW · 上昇=赤 / 下落=緑' },
    th: { name: '銘柄', price: '現在値', chgP: '騰落率', chg: '前日比', open: '始値', high: '高値', low: '安値', prev: '前日終値', vol: '出来高', amt: '売買代金', turn: '回転率' },
    empty: 'ウォッチリストは空です。上でコードを追加してください。',
    updated: '更新', noStock: '銘柄なし', failed: '更新に失敗しました。再試行します',
    notFound: '銘柄が見つかりません: ', wrongMkt: (n, m) => `「${n}」は${m}の銘柄ではありません`, exists: '既にウォッチリストにあります', netErr: 'リクエストに失敗しました。ネットワークをご確認ください',
    volU: ['億', '万'], amtU: ['億', '万'],
  },
  ko: {
    nav: { us: '미국', kr: '한국', hk: '홍콩', a: '중국A' },
    mkt: { hk: '홍콩', a: '중국A', kr: '한국' },
    docTitle: { hk: '홍콩 증시 · StockView', a: '중국A 증시 · StockView', kr: '한국 증시 · StockView' },
    indices: '주요 지수', indicesSrc: '데이터 Yahoo Finance',
    watchlist: '관심종목', add: '＋ 추가',
    ph: { hk: '홍콩 종목코드 입력 (예: 00700 / 09988)', a: '중국A 종목코드 입력 (예: 600519 / 000001)', kr: '한국 종목코드 입력 (예: 005930 / 000660)' },
    hint: { hk: '홍콩 코드는 1-5자리 · HKD 표시 · 상승=빨강 / 하락=녹색', a: '중국A 6자리 코드 · CNY 표시 · 상승=빨강 / 하락=녹색', kr: '한국 6자리 코드 · KRW 표시 · 상승=빨강 / 하락=녹색' },
    th: { name: '종목', price: '현재가', chgP: '등락률', chg: '등락폭', open: '시가', high: '고가', low: '저가', prev: '전일종가', vol: '거래량', amt: '거래대금', turn: '회전율' },
    empty: '관심종목이 없습니다. 위에서 코드를 추가하세요.',
    updated: '업데이트', noStock: '종목 없음', failed: '새로고침 실패, 재시도 중',
    notFound: '종목을 찾을 수 없습니다: ', wrongMkt: (n, m) => `"${n}"은(는) ${m} 종목이 아닙니다`, exists: '이미 관심종목에 있습니다', netErr: '요청 실패. 네트워크를 확인하세요',
    volU: ['억', '만'], amtU: ['억', '만'],
  },
};
const VALID_LANGS = LANGS.map(l => l.code);
let lang = VALID_LANGS.includes(localStorage.getItem('lang')) ? localStorage.getItem('lang') : 'en';
const t = () => I18N[lang];
const LOCALES = { en: 'en-US', zh: 'zh-CN', tw: 'zh-TW', ja: 'ja-JP', ko: 'ko-KR' };
const VOL_SUFFIX = { zh: '股', tw: '股', ja: '株', ko: '주' };

let watchlist = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || M.defaults;
let lastPrices = {};
let lastQuotes = [];
let timer = null;

function saveList() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
  if (Auth.user) Auth.saveWatchlist(M.key, watchlist);
}

window.onAuthChange = async (user) => {
  if (user) {
    const saved = await Auth.getWatchlist(M.key);
    if (saved === null) Auth.saveWatchlist(M.key, watchlist);
    else watchlist = saved.codes;
  } else {
    watchlist = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || M.defaults;
  }
  refresh();
};

function inMarket(code) { return M.prefixes.some(p => code.startsWith(p)); }

function addStock() {
  const input = document.getElementById('codeInput');
  let code = input.value.trim();
  if (!code) return;
  input.value = '';
  if (M.inputPrefix && /^\d+$/.test(code)) code = M.inputPrefix + code;   // 韩股与A股消歧
  fetchQuotes([code]).then(res => {
    const q = res.quotes && res.quotes[0];
    if (!q || q.error) { alert(t().notFound + code); return; }
    if (!inMarket(q.code)) { alert(t().wrongMkt(q.name, t().mkt[M.key])); return; }
    if (watchlist.includes(q.code)) { alert(t().exists); return; }
    watchlist.push(q.code);
    saveList();
    refresh();
  }).catch(() => alert(t().netErr));
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
    const resp = await fetch('/api/quote?codes=' + encodeURIComponent(codes.join(',')), { signal: ctrl.signal });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    return await resp.json();
  } finally { clearTimeout(to); }
}

function fmtNum(v, digits = 2) {
  if (v === null || v === undefined || isNaN(v)) return '--';
  return v.toLocaleString(LOCALES[lang], { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function fmtBig(v, unit) {
  if (v == null) return '--';
  if (!unit) {   // 英文 B/M/K
    if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(2) + 'K';
    return fmtNum(v, 0);
  }
  if (v >= 1e8) return (v / 1e8).toFixed(2) + unit[0];
  if (v >= 1e4) return (v / 1e4).toFixed(2) + unit[1];
  return fmtNum(v, 0);
}
const fmtVolume = (v) => v == null ? '--' : fmtBig(v, t().volU) + (t().volU ? (VOL_SUFFIX[lang] || '') : '');
const fmtAmount = (v) => fmtBig(v, t().amtU);
function cls(v) { return v > 0 ? 'up' : v < 0 ? 'down' : 'flat'; }
function sign(v) { return v > 0 ? '+' : ''; }

function render(quotes) {
  lastQuotes = quotes;
  const tbody = document.getElementById('tbody');
  const empty = document.getElementById('empty');
  empty.style.display = quotes.length ? 'none' : 'block';

  tbody.innerHTML = quotes.map(q => {
    if (q.error) {
      return `<tr><td colspan="11" class="row-error">${q.code}：${q.error}</td>
        <td><button class="del-btn" onclick="removeStock('${q.code}')">✕</button></td></tr>`;
    }
    const c = cls(q.change);
    const prev = lastPrices[q.code];
    let flash = '';
    if (prev !== undefined && q.price !== prev) flash = q.price > prev ? 'flash-up' : 'flash-down';
    lastPrices[q.code] = q.price;
    return `<tr class="${flash}">
      <td><div class="stock-name">${q.name}</div><div class="stock-code">${q.code.toUpperCase()}${q.currency && q.currency !== 'CNY' ? ' · ' + q.currency : ''}</div></td>
      <td class="price ${c}">${fmtNum(q.price, PDIG)}</td>
      <td><span class="chg-badge ${c}">${sign(q.changePercent)}${fmtNum(q.changePercent)}%</span></td>
      <td class="num ${c}">${sign(q.change)}${fmtNum(q.change, PDIG)}</td>
      <td class="num ${cls(q.open - q.prevClose)}">${fmtNum(q.open, PDIG)}</td>
      <td class="num ${cls(q.high - q.prevClose)}">${fmtNum(q.high, PDIG)}</td>
      <td class="num ${cls(q.low - q.prevClose)}">${fmtNum(q.low, PDIG)}</td>
      <td class="num flat">${fmtNum(q.prevClose, PDIG)}</td>
      <td class="num flat">${fmtVolume(q.volume)}</td>
      <td class="num flat">${fmtAmount(q.amount)}</td>
      <td class="num flat">${q.turnover != null ? fmtNum(q.turnover) + '%' : '--'}</td>
      <td><button class="del-btn" onclick="removeStock('${q.code}')">✕</button></td>
    </tr>`;
  }).join('');
}

function setStatus(ok, text) {
  document.getElementById('statusDot').className = 'dot' + (ok ? '' : ' err');
  document.getElementById('statusText').textContent = text;
}

/* ---------- 静态文案渲染（随语言切换） ---------- */
function setText(id, txt) { const el = document.getElementById(id); if (el) el.textContent = txt; }
function renderStatics() {
  const T = t();
  document.documentElement.lang = { en: 'en', zh: 'zh-CN', tw: 'zh-TW', ja: 'ja', ko: 'ko' }[lang];
  document.title = T.docTitle[M.key];
  setText('navUS', T.nav.us); setText('navKR', T.nav.kr);
  setText('navHK', T.nav.hk); setText('navA', T.nav.a);
  setText('idxTitle', T.indices); setText('idxNote', T.indicesSrc);
  setText('wlTitle', T.watchlist); setText('addBtn', T.add);
  setText('hintText', T.hint[M.key]);
  setText('empty', T.empty);
  const input = document.getElementById('codeInput');
  if (input) input.placeholder = T.ph[M.key];
  const thead = document.getElementById('thead');
  if (thead) {
    thead.innerHTML = `<tr><th>${T.th.name}</th><th>${T.th.price}</th><th>${T.th.chgP}</th><th>${T.th.chg}</th>
      <th>${T.th.open}</th><th>${T.th.high}</th><th>${T.th.low}</th><th>${T.th.prev}</th>
      <th>${T.th.vol}</th><th>${T.th.amt}</th><th>${T.th.turn}</th><th></th></tr>`;
  }
  buildLangMenu();
}

/* ---------- 语言菜单 ---------- */
function setLang(code) {
  lang = code;
  localStorage.setItem('lang', code);
  const menu = document.getElementById('langMenu');
  if (menu) menu.classList.add('hidden');
  renderStatics();
  if (window.Auth) Auth.rerender();
  render(lastQuotes);   // 用已有数据即时重绘表格
  refresh();
}
function buildLangMenu() {
  const menu = document.getElementById('langMenu');
  if (!menu) return;
  menu.innerHTML = LANGS.map(l =>
    `<button class="lang-item ${l.code === lang ? 'active' : ''}" data-lang="${l.code}">${l.label}</button>`).join('');
  menu.querySelectorAll('.lang-item').forEach(b => { b.onclick = () => setLang(b.dataset.lang); });
}
{
  const btn = document.getElementById('langBtn');
  if (btn) {
    btn.onclick = (e) => { e.stopPropagation(); document.getElementById('langMenu').classList.toggle('hidden'); };
    document.addEventListener('click', () => { const m = document.getElementById('langMenu'); if (m) m.classList.add('hidden'); });
  }
}

/* ---------- 大盘指数（market 配置 indices:true 时启用） ---------- */
let indicesAt = 0;
function renderIndices(list) {
  const el = document.getElementById('indexStrip');
  if (!el) return;
  el.innerHTML = (list || []).map(ix => {
    const c = cls(ix.changePercent);
    return `<div class="index-card">
      <div class="iname"><span>${ix.name}</span><span>${(ix.symbol || '').replace('^', '')}</span></div>
      <div class="ival ${c}">${fmtNum(ix.price, 2)}</div>
      <div class="ichg ${c}">${sign(ix.change)}${fmtNum(ix.change, 2)}&nbsp;&nbsp;${sign(ix.changePercent)}${fmtNum(ix.changePercent, 2)}%</div>
    </div>`;
  }).join('');
}
async function refreshIndices() {
  if (!M.indices || Date.now() - indicesAt < 12000) return;
  indicesAt = Date.now();
  try {
    const resp = await fetch('/api/indices?market=' + M.key);
    const d = await resp.json();
    renderIndices(d.indices);
  } catch (e) { /* 保持上次 */ }
}

async function refresh() {
  refreshIndices();
  if (!watchlist.length) { render([]); setStatus(true, t().noStock); return; }
  try {
    const res = await fetchQuotes(watchlist);
    render(res.quotes || []);
    setStatus(true, t().updated + ' ' + new Date().toLocaleTimeString(LOCALES[lang]));
  } catch (e) {
    setStatus(false, t().failed);
  }
}

renderStatics();

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
document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
loop();
