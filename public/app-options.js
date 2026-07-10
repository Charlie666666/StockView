/* 期权异动页：展示后台扫描出的当日异动合约（CBOE 延迟期权链，量/持仓比+权利金筛选） */

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '简体中文' },
  { code: 'tw', label: '繁體中文' },
];
const I18N = {
  en: {
    docTitle: 'Options Flow · StockView',
    navUS: 'US', navHK: 'HK', navA: 'CN-A', navOpt: 'Options Flow',
    updated: 'Updated', failed: 'Refresh failed, retrying',
    scanning: 'First scan in progress (about 1 minute)…',
    pageTitle: 'Unusual Options Activity',
    summary: (n, m) => `${n} contracts flagged across ${m} tickers`,
    fAll: 'All', fCalls: 'Calls', fPuts: 'Puts',
    thSym: 'Ticker', thType: 'Type', thExp: 'Expiry', thStrike: 'Strike',
    thSpot: 'Spot', thLast: 'Last', thVol: 'Volume', thOI: 'Open Int',
    thVolOi: 'Vol/OI', thPrem: 'Premium', thIV: 'IV',
    call: 'CALL', put: 'PUT',
    empty: 'No unusual contracts flagged today',
    pageNote: 'Screened from CBOE delayed option chains (15-min delay) over 30 active tickers: volume ≥ 500, premium ≥ $500K, volume ≥ 1.5× open interest (likely new positioning). This is a chain-snapshot heuristic, not tick-level sweep/block detection. Rescans every 10 minutes. Not investment advice.',
    marketLabel: 'US', et: 'ET',
    sess_pre: 'Pre-Market', sess_regular: 'Regular', sess_after: 'After-Hours',
    sess_overnight: 'Overnight', sess_closed: 'Closed',
  },
  zh: {
    docTitle: '期权异动 · StockView',
    navUS: '美股', navHK: '港股', navA: 'A股', navOpt: '期权异动',
    updated: '已更新', failed: '刷新失败，将自动重试',
    scanning: '首轮扫描进行中（约 1 分钟）…',
    pageTitle: '个股期权异动大单',
    summary: (n, m) => `已从 ${m} 个热门标的中筛出 ${n} 份异动合约`,
    fAll: '全部', fCalls: '看涨 Calls', fPuts: '看跌 Puts',
    thSym: '标的', thType: '类型', thExp: '到期日', thStrike: '行权价',
    thSpot: '标的现价', thLast: '合约价', thVol: '成交量', thOI: '持仓量',
    thVolOi: '量/持仓', thPrem: '权利金', thIV: '隐波',
    call: '看涨', put: '看跌',
    empty: '今日暂无符合条件的异动合约',
    pageNote: '数据来自 CBOE 官方延迟期权链（15分钟延迟），覆盖 30 个热门标的。筛选条件：成交量≥500 且 权利金≥$50万 且 成交量≥持仓量1.5倍（疑似新开仓）。此为链上快照启发式筛选，非逐笔大单（sweep/block）明细。每 10 分钟重扫。不构成投资建议。',
    marketLabel: '美股', et: '美东',
    sess_pre: '盘前', sess_regular: '盘中', sess_after: '盘后',
    sess_overnight: '夜盘', sess_closed: '休市',
  },
  tw: {
    docTitle: '期權異動 · StockView',
    navUS: '美股', navHK: '港股', navA: 'A股', navOpt: '期權異動',
    updated: '已更新', failed: '刷新失敗，將自動重試',
    scanning: '首輪掃描進行中（約 1 分鐘）…',
    pageTitle: '個股期權異動大單',
    summary: (n, m) => `已從 ${m} 個熱門標的中篩出 ${n} 份異動合約`,
    fAll: '全部', fCalls: '看漲 Calls', fPuts: '看跌 Puts',
    thSym: '標的', thType: '類型', thExp: '到期日', thStrike: '行權價',
    thSpot: '標的現價', thLast: '合約價', thVol: '成交量', thOI: '持倉量',
    thVolOi: '量/持倉', thPrem: '權利金', thIV: '隱波',
    call: '看漲', put: '看跌',
    empty: '今日暫無符合條件的異動合約',
    pageNote: '數據來自 CBOE 官方延遲期權鏈（15分鐘延遲），覆蓋 30 個熱門標的。篩選條件：成交量≥500 且 權利金≥$50萬 且 成交量≥持倉量1.5倍（疑似新開倉）。此為鏈上快照啟發式篩選，非逐筆大單明細。每 10 分鐘重掃。不構成投資建議。',
    marketLabel: '美股', et: '美東',
    sess_pre: '盤前', sess_regular: '盤中', sess_after: '盤後',
    sess_overnight: '夜盤', sess_closed: '休市',
  },
  ja: {
    docTitle: 'オプションフロー · StockView',
    navUS: '米国株', navHK: '香港株', navA: '中国A株', navOpt: 'オプションフロー',
    updated: '更新', failed: '更新に失敗しました。再試行します',
    scanning: '初回スキャン中（約1分）…',
    pageTitle: '個別株オプション異常フロー',
    summary: (n, m) => `${m}銘柄から${n}件の異常な建玉を検出`,
    fAll: 'すべて', fCalls: 'コール', fPuts: 'プット',
    thSym: '銘柄', thType: 'タイプ', thExp: '満期日', thStrike: '権利行使価格',
    thSpot: '原資産価格', thLast: 'プレミアム単価', thVol: '出来高', thOI: '建玉',
    thVolOi: '出来高/建玉', thPrem: 'プレミアム総額', thIV: 'IV',
    call: 'コール', put: 'プット',
    empty: '本日は条件に合致する契約がありません',
    pageNote: 'CBOE公式の遅延オプションチェーン（15分遅延）を使用し、30の主要銘柄を対象。条件: 出来高≥500、プレミアム≥$50万、出来高≥建玉の1.5倍（新規建玉の可能性）。チェーンスナップショットによるヒューリスティックであり、ティックレベルの検出ではありません。10分ごとに再スキャン。投資助言ではありません。',
    marketLabel: '米国市場', et: 'ET',
    sess_pre: 'プレマーケット', sess_regular: '取引時間中', sess_after: 'アフターマーケット',
    sess_overnight: 'オーバーナイト', sess_closed: '休場',
  },
  ko: {
    docTitle: '옵션 플로우 · StockView',
    navUS: '미국', navHK: '홍콩', navA: '중국A', navOpt: '옵션 플로우',
    updated: '업데이트', failed: '새로고침 실패, 재시도 중',
    scanning: '첫 스캔 진행 중 (약 1분)…',
    pageTitle: '개별주 옵션 이상 거래',
    summary: (n, m) => `${m}개 종목에서 ${n}건의 이상 계약 감지`,
    fAll: '전체', fCalls: '콜', fPuts: '풋',
    thSym: '종목', thType: '유형', thExp: '만기일', thStrike: '행사가',
    thSpot: '기초자산가', thLast: '계약가', thVol: '거래량', thOI: '미결제약정',
    thVolOi: '거래량/OI', thPrem: '프리미엄', thIV: 'IV',
    call: '콜', put: '풋',
    empty: '오늘은 조건에 맞는 계약이 없습니다',
    pageNote: 'CBOE 공식 지연 옵션 체인(15분 지연) 기반, 30개 인기 종목 대상. 조건: 거래량≥500, 프리미엄≥$50만, 거래량≥미결제약정의 1.5배(신규 포지션 추정). 체인 스냅샷 휴리스틱이며 틱 단위 대량주문 감지가 아닙니다. 10분마다 재스캔. 투자 조언이 아닙니다.',
    marketLabel: '미국 증시', et: 'ET',
    sess_pre: '프리마켓', sess_regular: '정규장', sess_after: '애프터마켓',
    sess_overnight: '오버나이트', sess_closed: '휴장',
  },
};
const VALID_LANGS = LANGS.map(l => l.code);
let lang = VALID_LANGS.includes(localStorage.getItem('lang')) ? localStorage.getItem('lang') : 'en';
const t = (k) => I18N[lang][k];

const REFRESH_MS = 60000;   // 后台10分钟一扫，前端1分钟拉一次缓存足够
let typeFilter = 'all';
let lastData = null;
let timer = null;

const $ = (id) => document.getElementById(id);
const LOCALES = { en: 'en-US', zh: 'zh-CN', tw: 'zh-TW', ja: 'ja-JP', ko: 'ko-KR' };
function fmtNum(v, digits = 2) {
  if (v === null || v === undefined || isNaN(v)) return '--';
  return v.toLocaleString(LOCALES[lang], { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function fmtInt(v) { return v == null ? '--' : v.toLocaleString(LOCALES[lang]); }
const CJK_UNITS = { zh: ['亿', '万'], tw: ['億', '萬'], ja: ['億', '万'], ko: ['억', '만'] };
function fmtPrem(v) {
  if (v == null) return '--';
  const u = CJK_UNITS[lang];
  if (!u) {
    if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
    if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
    return '$' + (v / 1e3).toFixed(0) + 'K';
  }
  if (v >= 1e8) return '$' + (v / 1e8).toFixed(2) + u[0];
  return '$' + (v / 1e4).toFixed(0) + u[1];
}

/* ---------- 美东时间与交易时段 ---------- */
function nyNow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', weekday: 'short', year: 'numeric',
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    second: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const g = (type) => (parts.find(p => p.type === type) || {}).value;
  const wdMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    wd: wdMap[g('weekday')],
    mins: parseInt(g('hour'), 10) * 60 + parseInt(g('minute'), 10),
    y: g('year'), M: g('month'), D: g('day'),
    hms: `${g('hour')}:${g('minute')}:${g('second')}`,
  };
}
function usSession() {
  const { wd, mins } = nyNow();
  if (wd === 6) return 'closed';
  if (wd === 0) return mins >= 1200 ? 'overnight' : 'closed';
  if (mins < 240) return 'overnight';
  if (mins < 570) return 'pre';
  if (mins < 960) return 'regular';
  if (mins < 1200) return 'after';
  return wd === 5 ? 'closed' : 'overnight';
}
function nyTimeString() {
  const n = nyNow();
  if (lang === 'zh' || lang === 'tw') {
    return `${n.y}年${parseInt(n.M, 10)}月${parseInt(n.D, 10)}日 ${n.hms} ${t('et')}`;
  }
  return `${n.y}-${n.M}-${n.D} ${n.hms} ${t('et')}`;
}

function setStatus(ok, text) {
  $('statusDot').className = 'dot' + (ok ? '' : ' err');
  $('statusText').textContent = text;
}

/* ---------- 渲染 ---------- */
function renderStatics() {
  document.documentElement.lang = { en: 'en', zh: 'zh-CN', tw: 'zh-TW', ja: 'ja', ko: 'ko' }[lang];
  document.title = t('docTitle');
  $('navUS').textContent = t('navUS');
  $('navHK').textContent = t('navHK');
  $('navA').textContent = t('navA');
  $('navOpt').textContent = t('navOpt');
  $('pageTitle').textContent = t('pageTitle');
  $('pageNote').textContent = t('pageNote');
  buildLangMenu();
  renderTypeTabs();
}

function renderSessionPill() {
  const sess = usSession();
  const el = $('sessionPill');
  el.className = 'session-pill pill-' + sess;
  el.textContent = `${t('marketLabel')} · ${t('sess_' + sess)}`;
}

function renderTypeTabs() {
  const defs = [['all', 'fAll'], ['C', 'fCalls'], ['P', 'fPuts']];
  $('typeTabs').innerHTML = defs.map(([v, k]) =>
    `<button class="grp-tab ${typeFilter === v ? 'active' : ''}" data-v="${v}">${t(k)}</button>`).join('');
  $('typeTabs').querySelectorAll('.grp-tab').forEach(b => {
    b.onclick = () => { typeFilter = b.dataset.v; renderTypeTabs(); renderTable(); };
  });
}

function renderTable() {
  $('thead').innerHTML = `<tr>
    <th>${t('thSym')}</th><th>${t('thType')}</th><th>${t('thExp')}</th><th>${t('thStrike')}</th>
    <th>${t('thSpot')}</th><th>${t('thLast')}</th><th>${t('thVol')}</th><th>${t('thOI')}</th>
    <th>${t('thVolOi')}</th><th>${t('thPrem')}</th><th>${t('thIV')}</th></tr>`;
  const items = (lastData?.items || []).filter(x => typeFilter === 'all' || x.type === typeFilter);
  const empty = $('empty');
  if (!items.length) {
    $('tbody').innerHTML = '';
    empty.style.display = 'block';
    empty.textContent = (!lastData || !lastData.time) ? t('scanning') : t('empty');
    return;
  }
  empty.style.display = 'none';
  $('tbody').innerHTML = items.map(x => {
    const isCall = x.type === 'C';
    const c = isCall ? 'up' : 'down';
    const otm = x.spot ? (isCall ? x.strike > x.spot : x.strike < x.spot) : false;
    return `<tr>
      <td><span class="stock-name">${x.symbol}</span></td>
      <td><span class="chg-badge ${c}">${isCall ? t('call') : t('put')}</span></td>
      <td class="num flat">${x.expiry}</td>
      <td class="num">${fmtNum(x.strike, x.strike % 1 ? 2 : 0)}${otm ? ' <span class="otm-tag">OTM</span>' : ''}</td>
      <td class="num flat">${fmtNum(x.spot)}</td>
      <td class="num flat">${fmtNum(x.last)}</td>
      <td class="num">${fmtInt(x.volume)}</td>
      <td class="num flat">${fmtInt(x.oi)}</td>
      <td class="num ${x.volOi >= 5 ? c : ''}">${fmtNum(x.volOi, 1)}×</td>
      <td class="price ${c}">${fmtPrem(x.premium)}</td>
      <td class="num flat">${x.iv ? fmtNum(x.iv * 100, 1) + '%' : '--'}</td>
    </tr>`;
  }).join('');
}

/* ---------- 语言菜单 ---------- */
function setLang(code) {
  lang = code;
  localStorage.setItem('lang', code);
  $('langMenu').classList.add('hidden');
  renderStatics();
  if (window.Auth) Auth.rerender();
  renderTable();
  renderSummary();
}
function buildLangMenu() {
  $('langMenu').innerHTML = LANGS.map(l =>
    `<button class="lang-item ${l.code === lang ? 'active' : ''}" data-lang="${l.code}">${l.label}</button>`).join('');
  $('langMenu').querySelectorAll('.lang-item').forEach(b => {
    b.onclick = () => setLang(b.dataset.lang);
  });
}
$('langBtn').onclick = (e) => {
  e.stopPropagation();
  $('langMenu').classList.toggle('hidden');
};
document.addEventListener('click', () => $('langMenu').classList.add('hidden'));

function renderSummary() {
  if (!lastData || !lastData.time) { $('updatedNote').textContent = ''; return; }
  $('updatedNote').textContent = t('summary')(lastData.items.length, lastData.scanned);
}

/* ---------- 刷新 ---------- */
async function refresh() {
  renderSessionPill();
  try {
    const resp = await fetch('/api/options-flow');
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    lastData = await resp.json();
    renderTable();
    renderSummary();
    setStatus(true, t('updated') + ' ' + nyTimeString());
  } catch (e) {
    setStatus(false, t('failed'));
  }
}

async function loop() {
  if (!document.hidden) await refresh();
  timer = setTimeout(loop, REFRESH_MS);
}
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refresh();
});

renderStatics();
loop();
