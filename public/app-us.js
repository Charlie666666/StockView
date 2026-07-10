/* 美股页逻辑：五语言、绿涨红跌、指数条、行业板块热力图、指数详情、盘前盘后、1秒自适应刷新 */

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
    docTitle: 'US Markets · StockView',
    navUS: 'US', navHK: 'HK', navA: 'CN-A', navOpt: 'Options Flow',
    groupAll: 'All', groupAdd: '+ group',
    groupPrompt: (ex) => `Group name for this stock (existing: ${ex}). Leave empty to remove.`,
    loading: 'Loading…', updated: 'Updated', failed: 'Refresh failed, retrying',
    indices: 'Market Indices', indicesNote: 'Click for constituent overview',
    sectors: 'Sector Heatmap', sectorsNote: 'Key industries · green up / red down',
    watchlist: 'Watchlist', add: '＋ Add',
    placeholder: 'Add ticker, e.g. AAPL / NVDA',
    hint: 'US tickers · Prices in USD · Green up / red down',
    extNote: 'Latest after-hours data is shown during overnight/closed sessions',
    sess_pre: 'Pre-Market', sess_regular: 'Regular', sess_after: 'After-Hours',
    sess_overnight: 'Overnight', sess_closed: 'Closed',
    marketLabel: 'US', priceSuffix: '', extPctCol: 'vs Close',
    thClose: 'Close', et: 'ET',
    moreTile: 'More Sectors', moreTileSub: '35+ sectors',
    thName: 'Name / Symbol', thPrice: 'Price', thChgPct: 'Chg %', thChg: 'Chg',
    thOpen: 'Open', thHigh: 'High', thLow: 'Low', thPrev: 'Prev Close',
    thVol: 'Volume', thAmt: 'Turnover', thTurn: 'Turnover %',
    empty: 'Watchlist is empty. Add a ticker above.',
    back: '← Back to markets',
    breadth: 'Advancers / Decliners', up: 'Up', down: 'Down', flat: 'Flat',
    constituents: 'Constituents', constNote: 'Sorted by approx. index weight',
    ixicNote: 'Nasdaq Composite has 3000+ members; showing Nasdaq-100 heavyweights',
    flowNote: 'Note: money-flow data is not available for US markets from the current source; market breadth and turnover are shown instead',
    open: 'Open', high: 'High', low: 'Low', prev: 'Prev', vol: 'Volume',
    notFound: 'Symbol not found: ', exists: 'Already in watchlist',
    wrongMarket: 'is not a US-listed symbol. Please use the matching market page.',
    netErr: 'Request failed. Check your network.',
  },
  zh: {
    docTitle: '美股行情 · StockView',
    navUS: '美股', navHK: '港股', navA: 'A股', navOpt: '期权异动',
    groupAll: '全部', groupAdd: '＋分组',
    groupPrompt: (ex) => `输入分组名（已有分组：${ex}），留空则取消分组`,
    loading: '加载中…', updated: '已更新', failed: '刷新失败，将自动重试',
    indices: '大盘指数', indicesNote: '点击查看权重股全景',
    sectors: '板块热力图', sectorsNote: '主要行业板块 · 绿涨红跌',
    watchlist: '自选股', add: '＋ 添加自选',
    placeholder: '输入美股代码添加自选，如 AAPL / NVDA',
    hint: '美股字母代码 · 价格单位 USD · 绿涨红跌',
    extNote: '夜盘与休市时段展示最近一次盘后数据',
    sess_pre: '盘前', sess_regular: '盘中', sess_after: '盘后',
    sess_overnight: '夜盘', sess_closed: '休市',
    marketLabel: '美股', priceSuffix: '价', extPctCol: '较收盘',
    thClose: '收盘价', et: '美东',
    moreTile: '查看更多', moreTileSub: '35+ 板块',
    thName: '名称 / 代码', thPrice: '最新价', thChgPct: '涨跌幅', thChg: '涨跌额',
    thOpen: '今开', thHigh: '最高', thLow: '最低', thPrev: '昨收',
    thVol: '成交量', thAmt: '成交额', thTurn: '换手率',
    empty: '暂无自选股，在上方输入代码添加',
    back: '← 返回行情',
    breadth: '涨跌家数', up: '上涨', down: '下跌', flat: '平盘',
    constituents: '权重股表现', constNote: '按指数权重近似排序',
    ixicNote: '纳指综合含 3000+ 只股票，此处展示纳斯达克100权重股',
    flowNote: '注：当前数据源暂不提供美股资金流向，以涨跌家数与成交概况呈现市场资金动向',
    open: '今开', high: '最高', low: '最低', prev: '昨收', vol: '成交量',
    notFound: '未找到该股票：', exists: '已在自选列表中',
    wrongMarket: '不属于美股，请切换到对应市场页面添加',
    netErr: '查询失败，请检查网络',
  },
  tw: {
    docTitle: '美股行情 · StockView',
    navUS: '美股', navHK: '港股', navA: 'A股', navOpt: '期權異動',
    groupAll: '全部', groupAdd: '＋分組',
    groupPrompt: (ex) => `輸入分組名（既有分組：${ex}），留空則取消分組`,
    loading: '載入中…', updated: '已更新', failed: '刷新失敗，將自動重試',
    indices: '大盤指數', indicesNote: '點擊查看權重股全景',
    sectors: '板塊熱力圖', sectorsNote: '主要行業板塊 · 綠漲紅跌',
    watchlist: '自選股', add: '＋ 加入自選',
    placeholder: '輸入美股代碼加入自選，如 AAPL / NVDA',
    hint: '美股字母代碼 · 價格單位 USD · 綠漲紅跌',
    extNote: '夜盤與休市時段顯示最近一次盤後數據',
    sess_pre: '盤前', sess_regular: '盤中', sess_after: '盤後',
    sess_overnight: '夜盤', sess_closed: '休市',
    marketLabel: '美股', priceSuffix: '價', extPctCol: '較收盤',
    thClose: '收盤價', et: '美東',
    moreTile: '查看更多', moreTileSub: '35+ 板塊',
    thName: '名稱 / 代碼', thPrice: '最新價', thChgPct: '漲跌幅', thChg: '漲跌額',
    thOpen: '今開', thHigh: '最高', thLow: '最低', thPrev: '昨收',
    thVol: '成交量', thAmt: '成交額', thTurn: '換手率',
    empty: '暫無自選股，在上方輸入代碼加入',
    back: '← 返回行情',
    breadth: '漲跌家數', up: '上漲', down: '下跌', flat: '平盤',
    constituents: '權重股表現', constNote: '按指數權重近似排序',
    ixicNote: '納指綜合含 3000+ 檔股票，此處顯示納斯達克100權重股',
    flowNote: '注：目前數據源不提供美股資金流向，以漲跌家數與成交概況呈現市場資金動向',
    open: '今開', high: '最高', low: '最低', prev: '昨收', vol: '成交量',
    notFound: '未找到該股票：', exists: '已在自選清單中',
    wrongMarket: '不屬於美股，請切換到對應市場頁面加入',
    netErr: '查詢失敗，請檢查網路',
  },
  ja: {
    docTitle: '米国株マーケット · StockView',
    navUS: '米国株', navHK: '香港株', navA: '中国A株', navOpt: 'オプションフロー',
    groupAll: 'すべて', groupAdd: '＋グループ',
    groupPrompt: (ex) => `グループ名を入力（既存: ${ex}）。空欄でグループ解除`,
    loading: '読み込み中…', updated: '更新', failed: '更新に失敗しました。再試行します',
    indices: '主要指数', indicesNote: 'クリックで構成銘柄を表示',
    sectors: 'セクターヒートマップ', sectorsNote: '主要業種 · 上昇=緑 / 下落=赤',
    watchlist: 'ウォッチリスト', add: '＋ 追加',
    placeholder: 'ティッカーを入力（例: AAPL / NVDA）',
    hint: '米国株ティッカー · 表示は USD · 上昇=緑 / 下落=赤',
    extNote: 'オーバーナイト・休場中は直近のアフターマーケットデータを表示します',
    sess_pre: 'プレマーケット', sess_regular: '取引時間中', sess_after: 'アフターマーケット',
    sess_overnight: 'オーバーナイト', sess_closed: '休場',
    marketLabel: '米国市場', priceSuffix: '', extPctCol: '終値比',
    thClose: '終値', et: 'ET',
    moreTile: 'もっと見る', moreTileSub: '35+ セクター',
    thName: '銘柄', thPrice: '現在値', thChgPct: '騰落率', thChg: '前日比',
    thOpen: '始値', thHigh: '高値', thLow: '安値', thPrev: '前日終値',
    thVol: '出来高', thAmt: '売買代金', thTurn: '回転率',
    empty: 'ウォッチリストは空です。上でティッカーを追加してください。',
    back: '← 戻る',
    breadth: '騰落銘柄数', up: '上昇', down: '下落', flat: '変わらず',
    constituents: '構成銘柄', constNote: '指数ウェイト順（概算）',
    ixicNote: 'ナスダック総合は3000銘柄超。ナスダック100の主力銘柄を表示しています',
    flowNote: '注: 現在のデータソースでは米国株の資金フローを取得できないため、騰落銘柄数と売買概況を表示しています',
    open: '始値', high: '高値', low: '安値', prev: '前日終値', vol: '出来高',
    notFound: '銘柄が見つかりません: ', exists: '既にウォッチリストにあります',
    wrongMarket: 'は米国上場銘柄ではありません。対応する市場ページをご利用ください',
    netErr: 'リクエストに失敗しました。ネットワークをご確認ください',
  },
  ko: {
    docTitle: '미국 증시 · StockView',
    navUS: '미국', navHK: '홍콩', navA: '중국A', navOpt: '옵션 플로우',
    groupAll: '전체', groupAdd: '＋그룹',
    groupPrompt: (ex) => `그룹 이름 입력 (기존: ${ex}). 비워두면 그룹 해제`,
    loading: '로딩 중…', updated: '업데이트', failed: '새로고침 실패, 재시도 중',
    indices: '주요 지수', indicesNote: '클릭하면 구성종목 보기',
    sectors: '섹터 히트맵', sectorsNote: '주요 업종 · 상승=녹색 / 하락=빨강',
    watchlist: '관심종목', add: '＋ 추가',
    placeholder: '티커 입력 (예: AAPL / NVDA)',
    hint: '미국 주식 티커 · USD 표시 · 상승=녹색 / 하락=빨강',
    extNote: '오버나이트·휴장 시간에는 최근 애프터마켓 데이터를 표시합니다',
    sess_pre: '프리마켓', sess_regular: '정규장', sess_after: '애프터마켓',
    sess_overnight: '오버나이트', sess_closed: '휴장',
    marketLabel: '미국 증시', priceSuffix: ' 가격', extPctCol: '종가대비',
    thClose: '종가', et: 'ET',
    moreTile: '더 보기', moreTileSub: '35+ 섹터',
    thName: '종목', thPrice: '현재가', thChgPct: '등락률', thChg: '등락폭',
    thOpen: '시가', thHigh: '고가', thLow: '저가', thPrev: '전일종가',
    thVol: '거래량', thAmt: '거래대금', thTurn: '회전율',
    empty: '관심종목이 없습니다. 위에서 티커를 추가하세요.',
    back: '← 돌아가기',
    breadth: '상승/하락 종목수', up: '상승', down: '하락', flat: '보합',
    constituents: '구성종목', constNote: '지수 비중순(근사치)',
    ixicNote: '나스닥종합은 3000개 이상. 나스닥100 대형주를 표시합니다',
    flowNote: '참고: 현재 데이터 소스는 미국 주식 자금 흐름을 제공하지 않아 등락 종목수와 거래 현황으로 대체합니다',
    open: '시가', high: '고가', low: '저가', prev: '전일종가', vol: '거래량',
    notFound: '종목을 찾을 수 없습니다: ', exists: '이미 관심종목에 있습니다',
    wrongMarket: '은(는) 미국 상장 종목이 아닙니다. 해당 시장 페이지를 이용하세요',
    netErr: '요청 실패. 네트워크를 확인하세요',
  },
};
const VALID_LANGS = LANGS.map(l => l.code);
let lang = VALID_LANGS.includes(localStorage.getItem('lang')) ? localStorage.getItem('lang') : 'en';
const t = (k) => I18N[lang][k];

/* ---------- 静态数据 ---------- */
const REFRESH_MS = 1000;      // 目标刷新间隔（自适应：慢请求不会堆积）
const FETCH_TIMEOUT = 3500;   // 单次请求超时，防止卡死
const UP_RGB = '31,191,117';
const DOWN_RGB = '240,69,62';

const INDICES = [
  { key: 'INX',  code: 'usINX',  n: { en: 'S&P 500',      zh: '标普500',     tw: '標普500',     ja: 'S&P500',       ko: 'S&P500' } },
  { key: 'NDX',  code: 'usNDX',  n: { en: 'Nasdaq 100',   zh: '纳斯达克100', tw: '納斯達克100', ja: 'ナスダック100', ko: '나스닥100' } },
  { key: 'DJI',  code: 'usDJI',  n: { en: 'Dow Jones',    zh: '道琼斯',      tw: '道瓊斯',      ja: 'ダウ平均',      ko: '다우존스' } },
  { key: 'IXIC', code: 'usIXIC', n: { en: 'Nasdaq Comp.', zh: '纳指综合',    tw: '納指綜合',    ja: 'ナスダック総合', ko: '나스닥종합' } },
];

const SECTORS = window.SECTOR_DEFS.MAIN;
const sectorCodes = (list) => list.flatMap(s => window.SECTOR_DEFS.codesOf(s));

/* 权重股列表（按近似权重排序，静态维护） */
const CONSTITUENTS = {
  INX: ['NVDA','MSFT','AAPL','AMZN','META','AVGO','GOOGL','GOOG','TSLA','BRK.B',
        'LLY','JPM','V','XOM','UNH','MA','COST','NFLX','WMT','PG',
        'JNJ','HD','ABBV','CRM','BAC','ORCL','KO','CVX','MRK','AMD'],
  NDX: ['NVDA','MSFT','AAPL','AMZN','AVGO','META','GOOGL','GOOG','TSLA','COST',
        'NFLX','TMUS','AMD','PEP','ADBE','CSCO','QCOM','INTU','TXN','AMAT',
        'CMCSA','AMGN','ISRG','HON','BKNG','VRTX','ADP','GILD','MU','LRCX'],
  DJI: ['GS','UNH','MSFT','HD','CAT','SHW','CRM','V','AXP','MCD',
        'AMGN','TRV','JPM','IBM','AAPL','AMZN','BA','JNJ','PG','CVX',
        'MMM','DIS','MRK','WMT','NVDA','HON','KO','CSCO','NKE','VZ'],
};
CONSTITUENTS.IXIC = CONSTITUENTS.NDX;

const NAME_EN = {
  NVDA:'Nvidia', MSFT:'Microsoft', AAPL:'Apple', AMZN:'Amazon', META:'Meta',
  AVGO:'Broadcom', GOOGL:'Alphabet A', GOOG:'Alphabet C', TSLA:'Tesla', 'BRK.B':'Berkshire B',
  LLY:'Eli Lilly', JPM:'JPMorgan', V:'Visa', XOM:'Exxon Mobil', UNH:'UnitedHealth',
  MA:'Mastercard', COST:'Costco', NFLX:'Netflix', WMT:'Walmart', PG:'Procter & Gamble',
  JNJ:'Johnson & Johnson', HD:'Home Depot', ABBV:'AbbVie', CRM:'Salesforce', BAC:'Bank of America',
  ORCL:'Oracle', KO:'Coca-Cola', CVX:'Chevron', MRK:'Merck', AMD:'AMD',
  TMUS:'T-Mobile US', PEP:'PepsiCo', ADBE:'Adobe', CSCO:'Cisco', QCOM:'Qualcomm',
  INTU:'Intuit', TXN:'Texas Instruments', AMAT:'Applied Materials', CMCSA:'Comcast', AMGN:'Amgen',
  ISRG:'Intuitive Surgical', HON:'Honeywell', BKNG:'Booking', VRTX:'Vertex', ADP:'ADP',
  GILD:'Gilead', MU:'Micron', LRCX:'Lam Research', GS:'Goldman Sachs', CAT:'Caterpillar',
  SHW:'Sherwin-Williams', AXP:'American Express', MCD:"McDonald's", TRV:'Travelers', IBM:'IBM',
  BA:'Boeing', MMM:'3M', DIS:'Disney', NKE:'Nike', VZ:'Verizon',
  WDC:'Western Digital', STX:'Seagate',
};

/* Mag7 默认自选 */
const DEFAULT_LIST = ['usAAPL','usMSFT','usGOOGL','usAMZN','usNVDA','usMETA','usTSLA'];
const STORAGE_KEY = 'watchlist_us_v2';
const GROUPS_KEY = 'wlgroups_us';

let watchlist = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || DEFAULT_LIST;
let groups = JSON.parse(localStorage.getItem(GROUPS_KEY) || '{}');   // {code: 分组名}
let activeGroup = null;      // 当前筛选的分组（仅本次会话）
let dragging = null;         // 正在拖拽的代码
let lastMap = {};            // 最近一次行情，用于交互后即时重绘
let lastSess = 'closed';
let lastPrices = {};
let timer = null;
let refreshing = false;

/* ---------- 工具 ---------- */
const $ = (id) => document.getElementById(id);
const sym = (code) => code.slice(2);
const dispName = (q) =>
  (lang === 'zh' || lang === 'tw') ? (q.name || sym(q.code)) : (NAME_EN[sym(q.code)] || sym(q.code));

function saveList() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
  localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
  if (Auth.user) Auth.saveWatchlist('us', watchlist, groups);
}

/* 登录状态变化：登录后加载账号自选（首次登录把本机列表迁移上去），退出回到本机列表 */
window.onAuthChange = async (user) => {
  if (user) {
    const saved = await Auth.getWatchlist('us');
    if (saved === null) {
      Auth.saveWatchlist('us', watchlist, groups);
    } else {
      watchlist = saved.codes;
      groups = saved.groups || {};
      localStorage.setItem(STORAGE_KEY, JSON.stringify(watchlist));
      localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
    }
  } else {
    watchlist = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || DEFAULT_LIST;
    groups = JSON.parse(localStorage.getItem(GROUPS_KEY) || '{}');
  }
  refresh();
};

/* ---------- 分组 ---------- */
function groupNames() { return [...new Set(Object.values(groups))]; }

function promptGroup(code) {
  const ex = groupNames();
  const input = prompt(t('groupPrompt')(ex.length ? ex.join(', ') : '—'), groups[code] || '');
  if (input === null) return;
  const name = input.trim().slice(0, 20);
  if (name) groups[code] = name; else delete groups[code];
  if (activeGroup && !groupNames().includes(activeGroup)) activeGroup = null;
  saveList();
  renderGroupTabs();
  renderWatch(lastMap, lastSess);
}

function renderGroupTabs() {
  const el = $('groupTabs');
  const names = groupNames();
  if (!names.length) { el.innerHTML = ''; return; }
  el.innerHTML = [
    `<button class="grp-tab ${!activeGroup ? 'active' : ''}" data-g="">${t('groupAll')}</button>`,
    ...names.map(n => `<button class="grp-tab ${activeGroup === n ? 'active' : ''}" data-g="${n}">${n}</button>`),
  ].join('');
  el.querySelectorAll('.grp-tab').forEach(b => {
    b.onclick = () => {
      activeGroup = b.dataset.g || null;
      renderGroupTabs();
      renderWatch(lastMap, lastSess);
    };
  });
}

async function fetchQuotes(codes) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const resp = await fetch('/api/quote?codes=' + encodeURIComponent(codes.join(',')),
                             { signal: ctrl.signal });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const data = await resp.json();
    const map = {};
    (data.quotes || []).forEach(q => { map[q.code] = q; });
    return map;
  } finally {
    clearTimeout(to);
  }
}

const LOCALES = { en: 'en-US', zh: 'zh-CN', tw: 'zh-TW', ja: 'ja-JP', ko: 'ko-KR' };
const locale = () => LOCALES[lang];
function fmtNum(v, digits = 2) {
  if (v === null || v === undefined || isNaN(v)) return '--';
  return v.toLocaleString(locale(), { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
const CJK_UNITS = { zh: ['亿', '万'], tw: ['億', '萬'], ja: ['億', '万'], ko: ['억', '만'] };
const VOL_SUFFIX = { zh: '股', tw: '股', ja: '株', ko: '주' };
function fmtBig(v, suffix, isMoney) {
  if (v == null) return '--';
  const u = CJK_UNITS[lang];
  if (!u) {
    const p = isMoney ? '$' : '';
    if (v >= 1e9) return p + (v / 1e9).toFixed(2) + 'B';
    if (v >= 1e6) return p + (v / 1e6).toFixed(2) + 'M';
    if (v >= 1e3) return p + (v / 1e3).toFixed(2) + 'K';
    return p + fmtNum(v, 0);
  }
  if (v >= 1e8) return (v / 1e8).toFixed(2) + u[0] + suffix;
  if (v >= 1e4) return (v / 1e4).toFixed(2) + u[1] + suffix;
  return fmtNum(v, 0) + suffix;
}
const fmtVolume = (v) => fmtBig(v, VOL_SUFFIX[lang] || '', false);
const fmtAmount = (v) => fmtBig(v, '', true);
function cls(v) { return v > 0 ? 'up' : v < 0 ? 'down' : 'flat'; }
function sign(v) { return v > 0 ? '+' : ''; }
function tileBg(chg) {
  if (chg == null) return 'rgba(91,102,114,.3)';
  const rgb = chg >= 0 ? UP_RGB : DOWN_RGB;
  const alpha = 0.18 + 0.62 * Math.min(Math.abs(chg) / 3, 1);
  return `rgba(${rgb},${alpha.toFixed(2)})`;
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

/* 时段（美东）：盘前4:00-9:30 盘中9:30-16:00 盘后16:00-20:00
   夜盘20:00-次日4:00（周日晚起、周五晚止），其余休市。不含节假日判断。 */
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

function renderSessionPill(sess) {
  const el = $('sessionPill');
  if (!el) return;
  el.className = 'session-pill pill-' + sess;
  el.textContent = `${t('marketLabel')} · ${t('sess_' + sess)}`;
}

/* ---------- 视图路由 ---------- */
function currentView() {
  const m = location.hash.match(/^#i=(\w+)$/);
  return m && CONSTITUENTS[m[1]] ? m[1] : 'main';
}

/* ---------- 语言菜单 ---------- */
function setLang(code) {
  lang = code;
  localStorage.setItem('lang', code);
  $('langMenu').classList.add('hidden');
  renderStatics();
  if (window.Auth) Auth.rerender();
  refresh();
}

function buildLangMenu() {
  $('langMenu').innerHTML = LANGS.map(l =>
    `<button class="lang-item ${l.code === lang ? 'active' : ''}" data-lang="${l.code}">${l.label}</button>`
  ).join('');
  $('langMenu').querySelectorAll('.lang-item').forEach(b => {
    b.onclick = () => setLang(b.dataset.lang);
  });
}

$('langBtn').onclick = (e) => {
  e.stopPropagation();
  $('langMenu').classList.toggle('hidden');
};
document.addEventListener('click', () => $('langMenu').classList.add('hidden'));

/* ---------- 静态文案渲染 ---------- */
function renderStatics() {
  document.documentElement.lang = { en: 'en', zh: 'zh-CN', tw: 'zh-TW', ja: 'ja', ko: 'ko' }[lang];
  document.title = t('docTitle');
  $('navUS').textContent = t('navUS');
  $('navHK').textContent = t('navHK');
  $('navA').textContent = t('navA');
  $('navOpt').textContent = t('navOpt');
  $('idxTitle').textContent = t('indices');
  $('idxNote').textContent = t('indicesNote');
  $('hmTitle').textContent = t('sectors');
  $('hmNote').textContent = t('sectorsNote');
  $('wlTitle').textContent = t('watchlist');
  $('addBtn').textContent = t('add');
  $('codeInput').placeholder = t('placeholder');
  $('hintText').textContent = t('hint');
  $('backBtn').textContent = t('back');
  $('flowNote').textContent = t('flowNote');
  $('empty').textContent = t('empty');
  buildLangMenu();
}

/* ---------- 主视图渲染 ---------- */
function renderIndices(map) {
  $('indexStrip').innerHTML = INDICES.map(ix => {
    const q = map[ix.code];
    if (!q || q.error) return `<div class="index-card"><div class="iname">${ix.n[lang]}</div><div class="ival">--</div></div>`;
    const c = cls(q.change);
    return `<div class="index-card" onclick="location.hash='i=${ix.key}'">
      <div class="iname"><span>${ix.n[lang]}</span><span>${ix.key}</span></div>
      <div class="ival ${c}">${fmtNum(q.price)}</div>
      <div class="ichg ${c}">${sign(q.change)}${fmtNum(q.change)}&nbsp;&nbsp;${sign(q.changePercent)}${fmtNum(q.changePercent)}%</div>
    </div>`;
  }).join('');
}

/* 板块涨跌：合成板块取成分股平均；非盘中优先盘前/盘后数据 */
function sectorPct(s, map, sess) {
  const members = s.basket || [s.tk];
  const vals = [];
  for (const m of members) {
    const q = map['us' + m];
    if (!q || q.error) continue;
    let v = q.changePercent;
    if (sess !== 'regular' && q.extChangePercent != null) v = q.extChangePercent;
    if (v != null) vals.push(v);
  }
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function renderHeatmap(map, sess) {
  const tiles = SECTORS.map(s => {
    const chg = sectorPct(s, map, sess);
    const sub = s.basket ? s.basket.join('·') : s.tk;
    return `<div class="hm-tile" style="background:${tileBg(chg)}">
      <div><div class="hm-name">${s.n[lang]}</div><div class="hm-sub">${sub}</div></div>
      <div class="hm-chg">${chg == null ? '--' : sign(chg) + fmtNum(chg) + '%'}</div>
    </div>`;
  });
  tiles.push(`<div class="hm-tile more-tile" onclick="location.href='/sectors'">
    <div><div class="hm-name">${t('moreTile')}</div><div class="hm-sub">${t('moreTileSub')}</div></div>
    <div class="hm-chg">→</div>
  </div>`);
  $('heatmap').innerHTML = tiles.join('');
}

function renderWatch(map, sess) {
  const showExt = sess !== 'regular';               // 开盘后隐藏非常规时段列
  // 列名按数据的真实时段标注（数据源只有盘前/盘后；夜盘和休市时展示的是最近盘后数据）
  const dataSess = watchlist.map(c => map[c]).find(q => q && !q.error && q.extSession)?.extSession;
  const extKey = dataSess || (sess === 'pre' ? 'pre' : 'after');
  const extLabel = t('sess_' + extKey) + t('priceSuffix');
  // 夜盘/休市时段在提示行说明数据口径
  $('hintText').textContent = t('hint') +
    ((sess === 'overnight' || sess === 'closed') ? ' · ' + t('extNote') : '');

  const extHead = showExt ? `<th>${extLabel}</th><th>${t('extPctCol')}</th>` : '';
  $('thead').innerHTML = `<tr><th></th>
    <th>${t('thName')}</th><th>${showExt ? t('thClose') : t('thPrice')}</th>
    <th>${t('thChgPct')}</th><th>${t('thChg')}</th>${extHead}
    <th>${t('thOpen')}</th><th>${t('thHigh')}</th><th>${t('thLow')}</th><th>${t('thPrev')}</th>
    <th>${t('thVol')}</th><th>${t('thAmt')}</th><th>${t('thTurn')}</th><th></th></tr>`;

  const tbody = $('tbody');
  const visible = watchlist.filter(c => !activeGroup || groups[c] === activeGroup);
  $('empty').style.display = visible.length ? 'none' : 'block';
  const colCount = showExt ? 14 : 12;
  tbody.innerHTML = visible.map(code => {
    const q = map[code];
    if (!q) return '';
    const handle = `<td class="drag-handle" title="drag">⠿</td>`;
    if (q.error) {
      return `<tr draggable="true" data-code="${code}">${handle}
        <td colspan="${colCount - 1}" class="row-error">${sym(code)}：${q.error}</td>
        <td><button class="del-btn" onclick="removeStock('${code}')">✕</button></td></tr>`;
    }
    const c = cls(q.change);
    const watched = showExt && q.extPrice != null ? q.extPrice : q.price;
    const prev = lastPrices[q.code];
    let flash = '';
    if (prev !== undefined && watched !== prev) flash = watched > prev ? 'flash-up' : 'flash-down';
    lastPrices[q.code] = watched;

    let extCells = '';
    if (showExt) {
      if (q.extPrice != null) {
        const ec = cls(q.extChange);
        extCells = `<td class="price ${ec}">${fmtNum(q.extPrice)}</td>
          <td><span class="chg-badge ${ec}">${sign(q.extChangePercent)}${fmtNum(q.extChangePercent)}%</span></td>`;
      } else {
        extCells = `<td class="num flat">--</td><td class="num flat">--</td>`;
      }
    }
    const grpBadge = `<span class="grp-badge ${groups[code] ? '' : 'ghost'}"
      onclick="promptGroup('${code}')">${groups[code] || t('groupAdd')}</span>`;
    return `<tr class="${flash}" draggable="true" data-code="${code}">${handle}
      <td><div class="stock-name">${dispName(q)}</div>
          <div class="stock-code">${sym(q.code)} · USD ${grpBadge}</div></td>
      <td class="price ${c}">${fmtNum(q.price)}</td>
      <td><span class="chg-badge ${c}">${sign(q.changePercent)}${fmtNum(q.changePercent)}%</span></td>
      <td class="num ${c}">${sign(q.change)}${fmtNum(q.change)}</td>${extCells}
      <td class="num ${cls(q.open - q.prevClose)}">${fmtNum(q.open)}</td>
      <td class="num ${cls(q.high - q.prevClose)}">${fmtNum(q.high)}</td>
      <td class="num ${cls(q.low - q.prevClose)}">${fmtNum(q.low)}</td>
      <td class="num flat">${fmtNum(q.prevClose)}</td>
      <td class="num flat">${fmtVolume(q.volume)}</td>
      <td class="num flat">${fmtAmount(q.amount)}</td>
      <td class="num flat">${q.turnover != null ? fmtNum(q.turnover) + '%' : '--'}</td>
      <td><button class="del-btn" onclick="removeStock('${code}')">✕</button></td>
    </tr>`;
  }).join('');
  renderGroupTabs();
}

/* ---------- 拖拽排序（事件委托一次绑定） ---------- */
(function initDrag() {
  const tbody = $('tbody');
  tbody.addEventListener('dragstart', (e) => {
    const tr = e.target.closest('tr[data-code]');
    if (!tr) return;
    dragging = tr.dataset.code;
    e.dataTransfer.effectAllowed = 'move';
  });
  tbody.addEventListener('dragover', (e) => {
    if (!dragging) return;
    e.preventDefault();
    const tr = e.target.closest('tr[data-code]');
    tbody.querySelectorAll('.drop-target').forEach(x => x.classList.remove('drop-target'));
    if (tr && tr.dataset.code !== dragging) tr.classList.add('drop-target');
  });
  tbody.addEventListener('drop', (e) => {
    e.preventDefault();
    const tr = e.target.closest('tr[data-code]');
    if (tr && dragging && tr.dataset.code !== dragging) {
      const from = watchlist.indexOf(dragging);
      const to = watchlist.indexOf(tr.dataset.code);
      if (from >= 0 && to >= 0) {
        watchlist.splice(from, 1);
        watchlist.splice(to, 0, dragging);
        saveList();
      }
    }
    dragging = null;
    renderWatch(lastMap, lastSess);
  });
  tbody.addEventListener('dragend', () => {
    dragging = null;
    tbody.querySelectorAll('.drop-target').forEach(x => x.classList.remove('drop-target'));
  });
})();

/* ---------- 指数详情渲染 ---------- */
function renderDetail(key, map) {
  const ix = INDICES.find(i => i.key === key);
  const q = map[ix.code];
  if (!q || q.error) { $('dHead').innerHTML = '--'; return; }
  const c = cls(q.change);
  $('dHead').innerHTML = `
    <div class="d-title">${ix.n[lang]} <span class="d-sym">${ix.key}</span></div>
    <div class="d-quote">
      <span class="d-price ${c}">${fmtNum(q.price)}</span>
      <span class="d-chg ${c}">${sign(q.change)}${fmtNum(q.change)} (${sign(q.changePercent)}${fmtNum(q.changePercent)}%)</span>
    </div>
    <div class="stat-row">
      <div class="stat"><div class="s-label">${t('open')}</div><div class="s-val num ${cls(q.open-q.prevClose)}">${fmtNum(q.open)}</div></div>
      <div class="stat"><div class="s-label">${t('high')}</div><div class="s-val num ${cls(q.high-q.prevClose)}">${fmtNum(q.high)}</div></div>
      <div class="stat"><div class="s-label">${t('low')}</div><div class="s-val num ${cls(q.low-q.prevClose)}">${fmtNum(q.low)}</div></div>
      <div class="stat"><div class="s-label">${t('prev')}</div><div class="s-val num flat">${fmtNum(q.prevClose)}</div></div>
      <div class="stat"><div class="s-label">${t('vol')}</div><div class="s-val num flat">${fmtVolume(q.volume)}</div></div>
    </div>`;

  const cons = CONSTITUENTS[key].map(tk => map['us' + tk]).filter(x => x && !x.error);
  const up = cons.filter(x => x.change > 0).length;
  const down = cons.filter(x => x.change < 0).length;
  const flat = cons.length - up - down;
  const total = Math.max(cons.length, 1);
  $('breadth').innerHTML = `
    <div class="section-title"><span>${t('breadth')}</span></div>
    <div class="breadth-bar">
      <div class="b-up" style="width:${(up/total*100).toFixed(1)}%"></div>
      <div class="b-flat" style="width:${(flat/total*100).toFixed(1)}%"></div>
      <div class="b-down" style="width:${(down/total*100).toFixed(1)}%"></div>
    </div>
    <div class="breadth-legend">
      <span><span class="up">●</span> ${t('up')} ${up}</span>
      <span><span class="flat">●</span> ${t('flat')} ${flat}</span>
      <span><span class="down">●</span> ${t('down')} ${down}</span>
    </div>`;

  const note = key === 'IXIC' ? t('ixicNote') : t('constNote');
  $('consTitle').innerHTML = `<span>${t('constituents')}</span><span class="section-note">${note}</span>`;
  const sorted = [...cons].sort((a, b) => (b.changePercent ?? -999) - (a.changePercent ?? -999));
  $('consTiles').innerHTML = sorted.map(x => `
    <div class="c-tile" style="background:${tileBg(x.changePercent)}" title="${dispName(x)}">
      <div class="ct-sym">${sym(x.code)}</div>
      <div class="ct-price">${fmtNum(x.price)}</div>
      <div class="ct-chg">${sign(x.changePercent)}${fmtNum(x.changePercent)}%</div>
    </div>`).join('');
}

/* ---------- 交互 ---------- */
function addStock() {
  const input = $('codeInput');
  const code = input.value.trim();
  if (!code) return;
  input.value = '';
  fetchQuotes([code]).then(map => {
    const q = Object.values(map)[0];
    if (!q || q.error) { alert(t('notFound') + code); return; }
    if (!q.code.startsWith('us')) { alert(`「${q.name}」${t('wrongMarket')}`); return; }
    if (watchlist.includes(q.code)) { alert(t('exists')); return; }
    watchlist.push(q.code);
    saveList();
    refresh();
  }).catch(() => alert(t('netErr')));
}

function removeStock(code) {
  watchlist = watchlist.filter(c => c !== code);
  saveList();
  refresh();
}

function setStatus(ok, text) {
  $('statusDot').className = 'dot' + (ok ? '' : ' err');
  $('statusText').textContent = text;
}

/* ---------- 刷新循环（自适应：请求完成后再排下一次，慢请求不堆积） ---------- */
async function refresh() {
  if (refreshing || dragging) return;   // 拖拽中暂停重绘，避免行被替换
  refreshing = true;
  const view = currentView();
  const sess = usSession();
  renderSessionPill(sess);
  $('mainView').classList.toggle('hidden', view !== 'main');
  $('detailView').classList.toggle('hidden', view === 'main');
  try {
    if (view === 'main') {
      const codes = [...INDICES.map(i => i.code), ...sectorCodes(SECTORS), ...watchlist];
      const map = await fetchQuotes(codes);
      lastMap = map;
      lastSess = sess;
      renderIndices(map);
      renderHeatmap(map, sess);
      if (!dragging) renderWatch(map, sess);
    } else {
      const ix = INDICES.find(i => i.key === view);
      const codes = [ix.code, ...CONSTITUENTS[view].map(tk => 'us' + tk)];
      const map = await fetchQuotes(codes);
      renderDetail(view, map);
    }
    setStatus(true, t('updated') + ' ' + nyTimeString());
  } catch (e) {
    setStatus(false, t('failed'));
  } finally {
    refreshing = false;
  }
}

async function loop() {
  const started = Date.now();
  if (!document.hidden) await refresh();
  const wait = Math.max(REFRESH_MS - (Date.now() - started), 200);
  timer = setTimeout(loop, wait);
}

window.addEventListener('hashchange', refresh);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refresh();  // 回到页面立即刷新一次；隐藏时 loop 会自动跳过
});

renderStatics();
loop();
