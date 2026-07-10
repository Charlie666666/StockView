/* 板块总览页：11大板块 + 25行业主题 + 时段强弱分析（非盘中优先盘前/盘后数据） */

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '简体中文' },
  { code: 'tw', label: '繁體中文' },
];
const I18N = {
  en: {
    docTitle: 'US Sectors · StockView',
    navUS: 'US', navHK: 'HK', navA: 'CN-A', navOpt: 'Options Flow', back: '← Back to markets',
    updated: 'Updated', failed: 'Refresh failed, retrying',
    marketLabel: 'US', et: 'ET',
    sess_pre: 'Pre-Market', sess_regular: 'Regular', sess_after: 'After-Hours',
    sess_overnight: 'Overnight', sess_closed: 'Closed',
    analysisTitle: (s) => `${s} Sector Strength`,
    strongest: 'Strongest', weakest: 'Weakest',
    counts: (n, up, down, flat) => `All ${n} sectors: ${up} up · ${down} down${flat ? ` · ${flat} flat` : ''}`,
    coreTitle: 'S&P 500 Sectors', coreNote: '11 GICS sectors',
    indTitle: 'Industries & Themes', indNote: '25 industry ETFs',
    prevDay: 'Prev day', closeDay: 'Close',
    pageNote: 'Sector data via industry ETFs (Storage is a composite of MU/WDC/STX) · Extended-hours change is measured vs the latest close · Latest after-hours data shown during overnight/closed sessions',
  },
  zh: {
    docTitle: '美股板块 · StockView',
    navUS: '美股', navHK: '港股', navA: 'A股', navOpt: '期权异动', back: '← 返回行情',
    updated: '已更新', failed: '刷新失败，将自动重试',
    marketLabel: '美股', et: '美东',
    sess_pre: '盘前', sess_regular: '盘中', sess_after: '盘后',
    sess_overnight: '夜盘', sess_closed: '休市',
    analysisTitle: (s) => `今日${s}板块强弱`,
    strongest: '最强', weakest: '最弱',
    counts: (n, up, down, flat) => `全部 ${n} 个板块：${up} 涨 · ${down} 跌${flat ? ` · ${flat} 平` : ''}`,
    coreTitle: '标普500 大板块', coreNote: '11 个 GICS 一级板块',
    indTitle: '行业与主题', indNote: '25 个细分行业',
    prevDay: '昨日', closeDay: '收盘',
    pageNote: '板块数据来自对应行业 ETF（存储为 MU/WDC/STX 合成） · 非常规时段展示盘前/盘后涨跌（相对最近收盘价） · 夜盘与休市时段展示最近一次盘后数据',
  },
  tw: {
    docTitle: '美股板塊 · StockView',
    navUS: '美股', navHK: '港股', navA: 'A股', navOpt: '期權異動', back: '← 返回行情',
    updated: '已更新', failed: '刷新失敗，將自動重試',
    marketLabel: '美股', et: '美東',
    sess_pre: '盤前', sess_regular: '盤中', sess_after: '盤後',
    sess_overnight: '夜盤', sess_closed: '休市',
    analysisTitle: (s) => `今日${s}板塊強弱`,
    strongest: '最強', weakest: '最弱',
    counts: (n, up, down, flat) => `全部 ${n} 個板塊：${up} 漲 · ${down} 跌${flat ? ` · ${flat} 平` : ''}`,
    coreTitle: '標普500 大板塊', coreNote: '11 個 GICS 一級板塊',
    indTitle: '行業與主題', indNote: '25 個細分行業',
    prevDay: '昨日', closeDay: '收盤',
    pageNote: '板塊數據來自對應行業 ETF（儲存為 MU/WDC/STX 合成） · 非常規時段顯示盤前/盤後漲跌（相對最近收盤價） · 夜盤與休市時段顯示最近一次盤後數據',
  },
  ja: {
    docTitle: '米国株セクター · StockView',
    navUS: '米国株', navHK: '香港株', navA: '中国A株', navOpt: 'オプションフロー', back: '← 戻る',
    updated: '更新', failed: '更新に失敗しました。再試行します',
    marketLabel: '米国市場', et: 'ET',
    sess_pre: 'プレマーケット', sess_regular: '取引時間中', sess_after: 'アフターマーケット',
    sess_overnight: 'オーバーナイト', sess_closed: '休場',
    analysisTitle: (s) => `${s} セクター強弱`,
    strongest: '最強', weakest: '最弱',
    counts: (n, up, down, flat) => `全${n}セクター: 上昇${up} · 下落${down}${flat ? ` · 変わらず${flat}` : ''}`,
    coreTitle: 'S&P500 セクター', coreNote: 'GICS 11セクター',
    indTitle: '業種・テーマ', indNote: '25の業種ETF',
    prevDay: '前日', closeDay: '終値',
    pageNote: 'セクターデータは業種ETFに基づく（ストレージはMU/WDC/STXの合成） · 時間外の騰落率は直近終値比 · オーバーナイト・休場中は直近のアフターマーケットデータを表示',
  },
  ko: {
    docTitle: '미국 섹터 · StockView',
    navUS: '미국', navHK: '홍콩', navA: '중국A', navOpt: '옵션 플로우', back: '← 돌아가기',
    updated: '업데이트', failed: '새로고침 실패, 재시도 중',
    marketLabel: '미국 증시', et: 'ET',
    sess_pre: '프리마켓', sess_regular: '정규장', sess_after: '애프터마켓',
    sess_overnight: '오버나이트', sess_closed: '휴장',
    analysisTitle: (s) => `${s} 섹터 강약`,
    strongest: '최강', weakest: '최약',
    counts: (n, up, down, flat) => `전체 ${n}개 섹터: 상승 ${up} · 하락 ${down}${flat ? ` · 보합 ${flat}` : ''}`,
    coreTitle: 'S&P500 섹터', coreNote: 'GICS 11개 섹터',
    indTitle: '업종·테마', indNote: '25개 업종 ETF',
    prevDay: '전일', closeDay: '종가',
    pageNote: '섹터 데이터는 업종 ETF 기준(스토리지는 MU/WDC/STX 합성) · 시간외 등락률은 최근 종가 대비 · 오버나이트·휴장 시간에는 최근 애프터마켓 데이터를 표시',
  },
};
const VALID_LANGS = LANGS.map(l => l.code);
let lang = VALID_LANGS.includes(localStorage.getItem('lang')) ? localStorage.getItem('lang') : 'en';
const t = (k) => I18N[lang][k];

const REFRESH_MS = 1000;
const FETCH_TIMEOUT = 3500;
const UP_RGB = '31,191,117';
const DOWN_RGB = '240,69,62';

const CORE = window.SECTOR_DEFS.CORE;
const INDUSTRY = window.SECTOR_DEFS.INDUSTRY;
const ALL = [...CORE, ...INDUSTRY];
const ALL_CODES = [...new Set(ALL.flatMap(s => window.SECTOR_DEFS.codesOf(s)))];

const $ = (id) => document.getElementById(id);
let timer = null;
let refreshing = false;

const LOCALES = { en: 'en-US', zh: 'zh-CN', tw: 'zh-TW', ja: 'ja-JP', ko: 'ko-KR' };
function fmtNum(v, digits = 2) {
  if (v === null || v === undefined || isNaN(v)) return '--';
  return v.toLocaleString(LOCALES[lang], { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
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

/* 板块涨跌：合成板块取成分股平均；非盘中优先盘前/盘后 */
function sectorPct(s, map, sess, regularOnly) {
  const members = s.basket || [s.tk];
  const vals = [];
  for (const m of members) {
    const q = map['us' + m];
    if (!q || q.error) continue;
    let v = q.changePercent;
    if (!regularOnly && sess !== 'regular' && q.extChangePercent != null) v = q.extChangePercent;
    if (v != null) vals.push(v);
  }
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function renderStatics() {
  document.documentElement.lang = { en: 'en', zh: 'zh-CN', tw: 'zh-TW', ja: 'ja', ko: 'ko' }[lang];
  document.title = t('docTitle');
  $('navUS').textContent = t('navUS');
  $('navHK').textContent = t('navHK');
  $('navA').textContent = t('navA');
  $('navOpt').textContent = t('navOpt');
  $('backBtn').textContent = t('back');
  $('coreTitle').textContent = t('coreTitle');
  $('coreNote').textContent = t('coreNote');
  $('indTitle').textContent = t('indTitle');
  $('indNote').textContent = t('indNote');
  $('pageNote').textContent = t('pageNote');
  buildLangMenu();
}

function renderSessionPill(sess) {
  const el = $('sessionPill');
  el.className = 'session-pill pill-' + sess;
  el.textContent = `${t('marketLabel')} · ${t('sess_' + sess)}`;
}

function renderAnalysis(map, sess) {
  const ranked = ALL
    .map(s => ({ s, pct: sectorPct(s, map, sess) }))
    .filter(x => x.pct != null)
    .sort((a, b) => b.pct - a.pct);
  if (!ranked.length) { $('analysisCard').innerHTML = ''; return; }
  const up = ranked.filter(x => x.pct > 0).length;
  const down = ranked.filter(x => x.pct < 0).length;
  const flat = ranked.length - up - down;
  const top = ranked.slice(0, 3);
  const bottom = ranked.slice(-3).reverse();
  const chip = (x) => `<span class="chip" style="background:${tileBg(x.pct)}">
    ${x.s.n[lang]} <b>${sign(x.pct)}${fmtNum(x.pct)}%</b></span>`;
  $('analysisCard').innerHTML = `
    <div class="an-title">${t('analysisTitle')(t('sess_' + sess))}</div>
    <div class="an-row"><span class="an-label up">${t('strongest')}</span>${top.map(chip).join('')}</div>
    <div class="an-row"><span class="an-label down">${t('weakest')}</span>${bottom.map(chip).join('')}</div>
    <div class="an-counts">${t('counts')(ranked.length, up, down, flat)}</div>`;
}

function renderGrid(el, list, map, sess) {
  el.innerHTML = list.map(s => {
    const pct = sectorPct(s, map, sess);
    const sub = s.basket ? s.basket.join('·') : s.tk;
    let cmp = '';
    if (sess !== 'regular' && pct != null) {
      const reg = sectorPct(s, map, sess, true);
      if (reg != null) {
        const label = sess === 'pre' ? t('prevDay') : t('closeDay');
        cmp = `<span class="hm-cmp">${label} ${sign(reg)}${fmtNum(reg)}%</span>`;
      }
    }
    return `<div class="hm-tile" style="background:${tileBg(pct)}">
      <div><div class="hm-name">${s.n[lang]}</div><div class="hm-sub">${sub}</div></div>
      <div><div class="hm-chg">${pct == null ? '--' : sign(pct) + fmtNum(pct) + '%'}</div>${cmp}</div>
    </div>`;
  }).join('');
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

/* ---------- 刷新循环 ---------- */
async function refresh() {
  if (refreshing) return;
  refreshing = true;
  const sess = usSession();
  renderSessionPill(sess);
  try {
    const map = await fetchQuotes(ALL_CODES);
    renderAnalysis(map, sess);
    renderGrid($('coreGrid'), CORE, map, sess);
    renderGrid($('indGrid'), INDUSTRY, map, sess);
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

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) refresh();
});

renderStatics();
loop();
