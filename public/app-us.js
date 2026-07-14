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
    navUS: 'US', navKR: 'KR', navHK: 'HK', navA: 'CN-A', navOpt: 'Options Flow',
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
    p_m1: '1m', p_m5: '5m', p_m15: '15m', p_d: '1D', p_w: '1W', p_mo: '1M', p_y: '1Y',
    chartNote: 'Data: Yahoo Finance (may be delayed) · Scroll to zoom · Drag to pan · Hover for values',
    chartErr: 'Failed to load chart data',
    optTitle: 'Options Flow', optMore: 'View full chain →',
    optCall: 'Top Call', optPut: 'Top Put', optScanning: 'Scanning…',
    optVol: 'Vol', optPrem: 'Premium', optAsOf: 'as of',
    redditTitle: 'Reddit Buzz · Top 5', redditSub: 'Most-mentioned tickers (24h) · via ApeWisdom', redditMentions: 'mentions',
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
    ana: {
      title: 'Stock Analysis', loading: 'Analyzing…', err: 'Analysis unavailable',
      score: 'Composite Score', basis: 'Quant signals from daily bars, options chain & short interest',
      v: { strong_bull: 'Strongly Bullish', bull: 'Short-term Bullish', neutral: 'Neutral / Choppy', bear: 'Short-term Bearish', strong_bear: 'Strongly Bearish' },
      sig: {
        macd_golden: 'MACD Golden Cross', macd_death: 'MACD Death Cross',
        macd_hist_up: 'MACD Hist Rising', macd_hist_down: 'MACD Hist Falling',
        ma_bull: 'Bullish MA Stack', ma_bear: 'Bearish MA Stack', ma_mixed: 'MAs Entangled',
        px_above_ma20: 'Above MA20', px_below_ma20: 'Below MA20',
        rsi_overbought: 'RSI Overbought', rsi_oversold: 'RSI Oversold', rsi_bullzone: 'RSI Bull Zone', rsi_bearzone: 'RSI Bear Zone',
        kdj_golden: 'KDJ Golden Cross', kdj_death: 'KDJ Death Cross', kdj_bull: 'KDJ Bullish', kdj_bear: 'KDJ Bearish',
        kdj_j_hot: 'J Overheated', kdj_j_cold: 'J Oversold',
        boll_break_up: 'Above Upper Band', boll_break_down: 'Below Lower Band',
        vol_surge_up: 'Volume Surge Up', vol_surge_down: 'Volume Surge Down',
        mom_strong: 'Strong 5d Momentum', mom_weak: 'Weak 5d Momentum',
      },
      volRatio: 'Vol Ratio', mom5: '5d Chg', mom20: '20d Chg', support: 'Support', resistance: 'Resist',
      optTitle: 'Options Data', pcrVol: 'P/C (Vol)', pcrOi: 'P/C (OI)', maxPain: 'Max Pain', atmIv: 'ATM IV', nearExp: 'Near Expiry',
      optSent: { bullish: 'Options flow leans bullish', bearish: 'Options flow leans bearish', balanced: 'Options flow balanced' },
      unusual: 'Unusual Options Today', noUnusual: 'No unusual options today', optNa: 'Options data unavailable',
      shTitle: 'Short Interest', shRatio: 'Days to Cover', shShares: 'Shares Short', shPct: '% of Float',
      socTitle: 'Retail Attention', socSub: 'Reddit mentions (24h) · via ApeWisdom',
      socMentions: 'Reddit Mentions', socRank: 'Reddit Rank', socTrend: 'vs 24h ago', socUpvotes: 'Upvotes',
      socNotInTop: 'Low retail chatter — not in Reddit top 100',
      sentLabel: { bull: 'Retail leaning bullish', bear: 'Retail leaning bearish', mixed: 'Retail views mixed' },
      sentReason: { opt_bull: 'call-heavy options', opt_bear: 'put-heavy hedging', px_up: 'rising price', px_down: 'falling price', buzz: 'surging mentions' },
      sentBasis: 'heuristic from mention trend, options positioning & momentum',
      newsTitle: 'Recent News', newsSub: 'Past 48h · ET', newsNone: 'No major news in the past 48h',
      agoMin: (n) => `${n}m ago`, agoHr: (n) => `${n}h ago`, agoDay: (n) => `${n}d ago`,
      note: 'Quant signals from daily technicals, options chain and short interest. For reference only — not investment advice.',
    },
  },
  zh: {
    docTitle: '美股行情 · StockView',
    navUS: '美股', navKR: '韩股', navHK: '港股', navA: 'A股', navOpt: '期权异动',
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
    p_m1: '1分', p_m5: '5分', p_m15: '15分', p_d: '日K', p_w: '周K', p_mo: '月K', p_y: '年K',
    chartNote: '数据来源 Yahoo Finance（可能有延迟） · 滚轮缩放 · 拖动平移 · 悬停查看数值',
    chartErr: 'K线数据加载失败',
    optTitle: '期权异动', optMore: '查看完整期权链 →',
    optCall: '看涨大单', optPut: '看跌大单', optScanning: '扫描中…',
    optVol: '成交', optPrem: '权利金', optAsOf: '数据截至',
    redditTitle: 'Reddit 散户讨论榜 · Top 5', redditSub: '24小时提及最多的股票 · 数据 ApeWisdom', redditMentions: '次提及',
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
    ana: {
      title: '个股分析', loading: '分析中…', err: '分析数据加载失败',
      score: '综合评分', basis: '基于日K技术指标、期权链与做空数据',
      v: { strong_bull: '强烈偏多', bull: '短期偏多', neutral: '中性震荡', bear: '短期偏空', strong_bear: '强烈偏空' },
      sig: {
        macd_golden: 'MACD金叉', macd_death: 'MACD死叉',
        macd_hist_up: '动能柱走强', macd_hist_down: '动能柱走弱',
        ma_bull: '均线多头排列', ma_bear: '均线空头排列', ma_mixed: '均线交织',
        px_above_ma20: '站上MA20', px_below_ma20: '跌破MA20',
        rsi_overbought: 'RSI超买', rsi_oversold: 'RSI超卖', rsi_bullzone: 'RSI强势区', rsi_bearzone: 'RSI弱势区',
        kdj_golden: 'KDJ金叉', kdj_death: 'KDJ死叉', kdj_bull: 'KDJ多头', kdj_bear: 'KDJ空头',
        kdj_j_hot: 'J值过热', kdj_j_cold: 'J值超冷',
        boll_break_up: '突破布林上轨', boll_break_down: '跌破布林下轨',
        vol_surge_up: '放量上涨', vol_surge_down: '放量下跌',
        mom_strong: '5日动量强劲', mom_weak: '5日动量疲弱',
      },
      volRatio: '量比', mom5: '5日涨幅', mom20: '20日涨幅', support: '支撑', resistance: '压力',
      optTitle: '期权数据', pcrVol: 'P/C比(量)', pcrOi: 'P/C比(持仓)', maxPain: '最大痛点', atmIv: 'ATM隐波', nearExp: '近月到期',
      optSent: { bullish: '期权情绪偏多', bearish: '期权情绪偏空', balanced: '期权多空均衡' },
      unusual: '今日期权异动大单', noUnusual: '今日无异动大单', optNa: '期权数据暂不可用',
      shTitle: '做空数据', shRatio: '回补天数', shShares: '做空股数', shPct: '占流通盘',
      socTitle: '散户热度', socSub: 'Reddit 24小时提及量 · 数据 ApeWisdom',
      socMentions: 'Reddit 提及', socRank: 'Reddit 排名', socTrend: '较24h前', socUpvotes: '获赞',
      socNotInTop: '散户讨论较少 — 未进 Reddit 热度前100',
      sentLabel: { bull: '散户偏多', bear: '散户偏空', mixed: '多空分歧' },
      sentReason: { opt_bull: '期权偏买Call', opt_bear: '期权偏买Put避险', px_up: '价格走高', px_down: '价格走低', buzz: '提及量激增' },
      sentBasis: '综合提及趋势、期权持仓与价格动量的启发式判断',
      newsTitle: '近期新闻', newsSub: '近48小时 · 美东时间', newsNone: '近48小时无重点新闻',
      agoMin: (n) => `${n}分钟前`, agoHr: (n) => `${n}小时前`, agoDay: (n) => `${n}天前`,
      note: '基于日K线技术指标、期权链与做空数据的量化信号，仅供参考，不构成投资建议',
    },
  },
  tw: {
    docTitle: '美股行情 · StockView',
    navUS: '美股', navKR: '韓股', navHK: '港股', navA: 'A股', navOpt: '期權異動',
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
    p_m1: '1分', p_m5: '5分', p_m15: '15分', p_d: '日K', p_w: '週K', p_mo: '月K', p_y: '年K',
    chartNote: '數據來源 Yahoo Finance（可能有延遲） · 滾輪縮放 · 拖動平移 · 懸停查看數值',
    chartErr: 'K線數據載入失敗',
    optTitle: '期權異動', optMore: '查看完整期權鏈 →',
    optCall: '看漲大單', optPut: '看跌大單', optScanning: '掃描中…',
    optVol: '成交', optPrem: '權利金', optAsOf: '數據截至',
    redditTitle: 'Reddit 散戶討論榜 · Top 5', redditSub: '24小時提及最多的股票 · 數據 ApeWisdom', redditMentions: '次提及',
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
    ana: {
      title: '個股分析', loading: '分析中…', err: '分析數據載入失敗',
      score: '綜合評分', basis: '基於日K技術指標、期權鏈與做空數據',
      v: { strong_bull: '強烈偏多', bull: '短期偏多', neutral: '中性震盪', bear: '短期偏空', strong_bear: '強烈偏空' },
      sig: {
        macd_golden: 'MACD金叉', macd_death: 'MACD死叉',
        macd_hist_up: '動能柱走強', macd_hist_down: '動能柱走弱',
        ma_bull: '均線多頭排列', ma_bear: '均線空頭排列', ma_mixed: '均線交織',
        px_above_ma20: '站上MA20', px_below_ma20: '跌破MA20',
        rsi_overbought: 'RSI超買', rsi_oversold: 'RSI超賣', rsi_bullzone: 'RSI強勢區', rsi_bearzone: 'RSI弱勢區',
        kdj_golden: 'KDJ金叉', kdj_death: 'KDJ死叉', kdj_bull: 'KDJ多頭', kdj_bear: 'KDJ空頭',
        kdj_j_hot: 'J值過熱', kdj_j_cold: 'J值超冷',
        boll_break_up: '突破布林上軌', boll_break_down: '跌破布林下軌',
        vol_surge_up: '放量上漲', vol_surge_down: '放量下跌',
        mom_strong: '5日動量強勁', mom_weak: '5日動量疲弱',
      },
      volRatio: '量比', mom5: '5日漲幅', mom20: '20日漲幅', support: '支撐', resistance: '壓力',
      optTitle: '期權數據', pcrVol: 'P/C比(量)', pcrOi: 'P/C比(持倉)', maxPain: '最大痛點', atmIv: 'ATM隱波', nearExp: '近月到期',
      optSent: { bullish: '期權情緒偏多', bearish: '期權情緒偏空', balanced: '期權多空均衡' },
      unusual: '今日期權異動大單', noUnusual: '今日無異動大單', optNa: '期權數據暫不可用',
      shTitle: '做空數據', shRatio: '回補天數', shShares: '做空股數', shPct: '佔流通盤',
      socTitle: '散戶熱度', socSub: 'Reddit 24小時提及量 · 數據 ApeWisdom',
      socMentions: 'Reddit 提及', socRank: 'Reddit 排名', socTrend: '較24h前', socUpvotes: '獲讚',
      socNotInTop: '散戶討論較少 — 未進 Reddit 熱度前100',
      sentLabel: { bull: '散戶偏多', bear: '散戶偏空', mixed: '多空分歧' },
      sentReason: { opt_bull: '期權偏買Call', opt_bear: '期權偏買Put避險', px_up: '價格走高', px_down: '價格走低', buzz: '提及量激增' },
      sentBasis: '綜合提及趨勢、期權持倉與價格動量的啟發式判斷',
      newsTitle: '近期新聞', newsSub: '近48小時 · 美東時間', newsNone: '近48小時無重點新聞',
      agoMin: (n) => `${n}分鐘前`, agoHr: (n) => `${n}小時前`, agoDay: (n) => `${n}天前`,
      note: '基於日K線技術指標、期權鏈與做空數據的量化信號，僅供參考，不構成投資建議',
    },
  },
  ja: {
    docTitle: '米国株マーケット · StockView',
    navUS: '米国株', navKR: '韓国株', navHK: '香港株', navA: '中国A株', navOpt: 'オプションフロー',
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
    p_m1: '1分', p_m5: '5分', p_m15: '15分', p_d: '日足', p_w: '週足', p_mo: '月足', p_y: '年足',
    chartNote: 'データ: Yahoo Finance（遅延の可能性あり） · ホイールでズーム · ドラッグで移動 · ホバーで数値表示',
    chartErr: 'チャートデータの読み込みに失敗しました',
    optTitle: 'オプションフロー', optMore: '完全なチェーンを見る →',
    optCall: 'コール上位', optPut: 'プット上位', optScanning: 'スキャン中…',
    optVol: '出来高', optPrem: 'プレミアム', optAsOf: '時点',
    redditTitle: 'Reddit 話題ランキング · Top 5', redditSub: '24時間で最も言及された銘柄 · ApeWisdom', redditMentions: '件言及',
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
    ana: {
      title: '銘柄分析', loading: '分析中…', err: '分析データの取得に失敗しました',
      score: '総合スコア', basis: '日足テクニカル・オプションチェーン・空売りデータに基づく',
      v: { strong_bull: '強い買い優勢', bull: '短期買い優勢', neutral: '中立・レンジ', bear: '短期売り優勢', strong_bear: '強い売り優勢' },
      sig: {
        macd_golden: 'MACDゴールデンクロス', macd_death: 'MACDデッドクロス',
        macd_hist_up: 'ヒストグラム上昇', macd_hist_down: 'ヒストグラム下降',
        ma_bull: 'MA強気配列', ma_bear: 'MA弱気配列', ma_mixed: 'MA交錯',
        px_above_ma20: 'MA20上抜け', px_below_ma20: 'MA20下抜け',
        rsi_overbought: 'RSI買われすぎ', rsi_oversold: 'RSI売られすぎ', rsi_bullzone: 'RSI強気圏', rsi_bearzone: 'RSI弱気圏',
        kdj_golden: 'KDJゴールデンクロス', kdj_death: 'KDJデッドクロス', kdj_bull: 'KDJ強気', kdj_bear: 'KDJ弱気',
        kdj_j_hot: 'J値過熱', kdj_j_cold: 'J値超冷',
        boll_break_up: 'ボリンジャー上限突破', boll_break_down: 'ボリンジャー下限割れ',
        vol_surge_up: '出来高急増(上昇)', vol_surge_down: '出来高急増(下落)',
        mom_strong: '5日モメンタム強', mom_weak: '5日モメンタム弱',
      },
      volRatio: '出来高比', mom5: '5日騰落', mom20: '20日騰落', support: 'サポート', resistance: 'レジスタンス',
      optTitle: 'オプションデータ', pcrVol: 'P/C(出来高)', pcrOi: 'P/C(建玉)', maxPain: 'マックスペイン', atmIv: 'ATM IV', nearExp: '直近限月',
      optSent: { bullish: 'オプションは強気寄り', bearish: 'オプションは弱気寄り', balanced: 'オプションは中立' },
      unusual: '本日の異常フロー', noUnusual: '本日は異常フローなし', optNa: 'オプションデータ利用不可',
      shTitle: '空売りデータ', shRatio: '買い戻し日数', shShares: '空売り株数', shPct: '浮動株比率',
      socTitle: '個人投資家の注目度', socSub: 'Reddit 24時間の言及数 · ApeWisdom',
      socMentions: 'Reddit 言及数', socRank: 'Reddit ランク', socTrend: '24時間前比', socUpvotes: '高評価',
      socNotInTop: '個人の話題は少なめ — Reddit トップ100外',
      sentLabel: { bull: '個人は強気寄り', bear: '個人は弱気寄り', mixed: '個人は方向感なし' },
      sentReason: { opt_bull: 'コール偏重', opt_bear: 'プット偏重ヘッジ', px_up: '価格上昇', px_down: '価格下落', buzz: '言及急増' },
      sentBasis: '言及トレンド・オプション建玉・モメンタムからの推定',
      newsTitle: '最近のニュース', newsSub: '過去48時間 · 米国東部時間', newsNone: '過去48時間に主要ニュースなし',
      agoMin: (n) => `${n}分前`, agoHr: (n) => `${n}時間前`, agoDay: (n) => `${n}日前`,
      note: '日足テクニカル・オプションチェーン・空売りデータに基づく定量シグナルです。参考情報であり投資助言ではありません。',
    },
  },
  ko: {
    docTitle: '미국 증시 · StockView',
    navUS: '미국', navKR: '한국', navHK: '홍콩', navA: '중국A', navOpt: '옵션 플로우',
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
    p_m1: '1분', p_m5: '5분', p_m15: '15분', p_d: '일봉', p_w: '주봉', p_mo: '월봉', p_y: '연봉',
    chartNote: '데이터: Yahoo Finance (지연 가능) · 휠 확대/축소 · 드래그 이동 · 호버로 수치 확인',
    chartErr: '차트 데이터 로드 실패',
    optTitle: '옵션 플로우', optMore: '전체 체인 보기 →',
    optCall: '콜 상위', optPut: '풋 상위', optScanning: '스캔 중…',
    optVol: '거래량', optPrem: '프리미엄', optAsOf: '기준',
    redditTitle: 'Reddit 화제 랭킹 · Top 5', redditSub: '24시간 언급 최다 종목 · ApeWisdom', redditMentions: '회 언급',
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
    ana: {
      title: '종목 분석', loading: '분석 중…', err: '분석 데이터 로드 실패',
      score: '종합 점수', basis: '일봉 기술지표·옵션 체인·공매도 데이터 기반',
      v: { strong_bull: '강한 매수우위', bull: '단기 매수우위', neutral: '중립·횡보', bear: '단기 매도우위', strong_bear: '강한 매도우위' },
      sig: {
        macd_golden: 'MACD 골든크로스', macd_death: 'MACD 데드크로스',
        macd_hist_up: '히스토그램 상승', macd_hist_down: '히스토그램 하락',
        ma_bull: 'MA 정배열', ma_bear: 'MA 역배열', ma_mixed: 'MA 혼조',
        px_above_ma20: 'MA20 상회', px_below_ma20: 'MA20 하회',
        rsi_overbought: 'RSI 과매수', rsi_oversold: 'RSI 과매도', rsi_bullzone: 'RSI 강세권', rsi_bearzone: 'RSI 약세권',
        kdj_golden: 'KDJ 골든크로스', kdj_death: 'KDJ 데드크로스', kdj_bull: 'KDJ 강세', kdj_bear: 'KDJ 약세',
        kdj_j_hot: 'J값 과열', kdj_j_cold: 'J값 침체',
        boll_break_up: '볼린저 상단 돌파', boll_break_down: '볼린저 하단 이탈',
        vol_surge_up: '거래량 급증(상승)', vol_surge_down: '거래량 급증(하락)',
        mom_strong: '5일 모멘텀 강세', mom_weak: '5일 모멘텀 약세',
      },
      volRatio: '거래량비', mom5: '5일 등락', mom20: '20일 등락', support: '지지', resistance: '저항',
      optTitle: '옵션 데이터', pcrVol: 'P/C(거래량)', pcrOi: 'P/C(미결제)', maxPain: '맥스페인', atmIv: 'ATM IV', nearExp: '근월물',
      optSent: { bullish: '옵션 흐름 강세 우위', bearish: '옵션 흐름 약세 우위', balanced: '옵션 흐름 중립' },
      unusual: '오늘의 이상 거래', noUnusual: '오늘 이상 거래 없음', optNa: '옵션 데이터 없음',
      shTitle: '공매도 데이터', shRatio: '커버 소요일', shShares: '공매도 주수', shPct: '유통주 비중',
      socTitle: '개미 관심도', socSub: 'Reddit 24시간 언급량 · ApeWisdom',
      socMentions: 'Reddit 언급', socRank: 'Reddit 순위', socTrend: '24시간 전 대비', socUpvotes: '추천',
      socNotInTop: '개인 관심 낮음 — Reddit 상위 100 밖',
      sentLabel: { bull: '개미 매수우위', bear: '개미 매도우위', mixed: '개미 방향 혼조' },
      sentReason: { opt_bull: '콜 편중', opt_bear: '풋 편중 헤지', px_up: '가격 상승', px_down: '가격 하락', buzz: '언급 급증' },
      sentBasis: '언급 추세·옵션 포지션·모멘텀 기반 추정',
      newsTitle: '최근 뉴스', newsSub: '최근 48시간 · 미국 동부시간', newsNone: '최근 48시간 주요 뉴스 없음',
      agoMin: (n) => `${n}분 전`, agoHr: (n) => `${n}시간 전`, agoDay: (n) => `${n}일 전`,
      note: '일봉 기술지표·옵션 체인·공매도 데이터 기반의 정량 신호입니다. 참고용이며 투자 조언이 아닙니다.',
    },
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
  let m = location.hash.match(/^#i=(\w+)$/);
  if (m && CONSTITUENTS[m[1]]) return { type: 'index', key: m[1] };
  m = location.hash.match(/^#k=(us[A-Za-z0-9.]+)$/);
  if (m) return { type: 'chart', code: m[1] };
  return { type: 'main' };
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
  $('navKR').textContent = t('navKR');
  $('navHK').textContent = t('navHK');
  $('navA').textContent = t('navA');
  $('idxTitle').textContent = t('indices');
  $('idxNote').textContent = t('indicesNote');
  $('hmTitle').textContent = t('sectors');
  $('hmNote').textContent = t('sectorsNote');
  $('optTitle').textContent = t('optTitle');
  $('optMore').textContent = t('optMore');
  renderOptFlow();
  $('redditTitle').textContent = t('redditTitle');
  $('redditSub').textContent = t('redditSub');
  renderRedditRank();
  $('wlTitle').textContent = t('watchlist');
  $('addBtn').textContent = t('add');
  $('codeInput').placeholder = t('placeholder');
  $('hintText').textContent = t('hint');
  $('backBtn').textContent = t('back');
  $('flowNote').textContent = t('flowNote');
  $('empty').textContent = t('empty');
  renderChartStatics();
  if (anaData) renderAnalysis();
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

/* ---------- 期权异动精选（成交最大的一条看涨 + 一条看跌） ---------- */
let optFlow = null;
let optFlowFetchedAt = 0;

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

function optAsOfString(ts) {
  if (!ts) return '';
  const d = new Date(ts * 1000);
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(d);
  const g = (k) => (p.find(x => x.type === k) || {}).value;
  const date = (lang === 'zh' || lang === 'tw')
    ? `${g('year')}年${parseInt(g('month'),10)}月${parseInt(g('day'),10)}日`
    : `${g('year')}-${g('month')}-${g('day')}`;
  return `${t('optAsOf')} ${date} ${g('hour')}:${g('minute')} ${t('et')}`;
}

function optCard(item, kind) {
  const isCall = kind === 'C';
  const c = isCall ? 'up' : 'down';
  const label = isCall ? t('optCall') : t('optPut');
  if (!item) {
    return `<div class="opt-card"><div class="opt-kind ${c}">${label}</div>
      <div class="opt-empty">${t('optScanning')}</div></div>`;
  }
  const dir = isCall ? 'C' : 'P';
  return `<a class="opt-card" href="/options">
    <div class="opt-kind ${c}">${label}</div>
    <div class="opt-main">
      <span class="opt-sym">${item.symbol}</span>
      <span class="opt-contract ${c}">${fmtNum(item.strike, item.strike % 1 ? 2 : 0)}${dir} · ${item.expiry}</span>
    </div>
    <div class="opt-stats">
      <span>${t('optVol')} <b>${(item.volume).toLocaleString(LOCALES[lang])}</b></span>
      <span>${t('optPrem')} <b class="${c}">${fmtPrem(item.premium)}</b></span>
    </div>
  </a>`;
}

function renderOptFlow() {
  const strip = $('optFlowStrip');
  if (!strip) return;
  const items = optFlow?.items || [];
  const topCall = items.filter(x => x.type === 'C').sort((a, b) => b.premium - a.premium)[0];
  const topPut = items.filter(x => x.type === 'P').sort((a, b) => b.premium - a.premium)[0];
  strip.innerHTML = optCard(topCall, 'C') + optCard(topPut, 'P');
  $('optMore').textContent = t('optMore') +
    (optFlow?.time ? '  ·  ' + optAsOfString(optFlow.time) : '');
}

async function refreshOptFlow() {
  // 后台每10分钟扫一次，前端每2分钟拉一次缓存即可
  if (Date.now() - optFlowFetchedAt < 120000 && optFlow) return;
  try {
    const resp = await fetch('/api/options-flow');
    if (!resp.ok) return;
    optFlow = await resp.json();
    optFlowFetchedAt = Date.now();
    renderOptFlow();
  } catch (e) { /* 保持上次数据 */ }
}

/* ---------- Reddit 散户讨论排行榜（首页 Top5） ---------- */
let redditTop = null;
let redditFetchedAt = 0;
function renderRedditRank() {
  const el = $('redditRank');
  if (!el) return;
  const items = redditTop?.top || [];
  if (!items.length) { el.innerHTML = `<div class="empty" style="padding:14px">${t('optScanning')}</div>`; return; }
  el.innerHTML = items.map((r, idx) => {
    const c = r.chg == null ? 'flat' : cls(r.chg);
    return `<a class="rr-item" href="#k=us${r.ticker}" title="${escapeHtml(r.name || '')}">
      <span class="rr-rank">${idx + 1}</span>
      <span class="rr-sym">${r.ticker}</span>
      <span class="rr-name">${escapeHtml(r.name || '')}</span>
      <span class="rr-cnt">${r.mentions.toLocaleString(LOCALES[lang])} <em>${t('redditMentions')}</em></span>
      <span class="rr-chg ${c}">${r.chg == null ? '' : sign(r.chg) + r.chg + '%'}</span>
    </a>`;
  }).join('');
}
async function refreshRedditRank() {
  if (Date.now() - redditFetchedAt < 300000 && redditTop) return;   // 5分钟一拉
  try {
    const resp = await fetch('/api/social-top');
    if (!resp.ok) return;
    redditTop = await resp.json();
    redditFetchedAt = Date.now();
    renderRedditRank();
  } catch (e) { /* 保持上次 */ }
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
  $('thead').innerHTML = `<tr><th class="col-handle"></th>
    <th class="col-name">${t('thName')}</th><th>${showExt ? t('thClose') : t('thPrice')}</th>
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
      <td class="col-name"><div class="stock-name clickable" onclick="location.hash='k=${code}'">${dispName(q)}</div>
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

/* ---------- 个股K线视图 ---------- */
const PERIODS = ['m1', 'm5', 'm15', 'd', 'w', 'mo', 'y'];
let kchart = null;
let chartCode = null;
let chartPeriod = PERIODS.includes(localStorage.getItem('kperiod'))
  ? localStorage.getItem('kperiod') : 'd';
let klineKey = '';
let klineAt = 0;

function renderChartStatics() {
  $('chartBackBtn').textContent = t('back');
  $('chartNote').textContent = t('chartNote');
  $('periodTabs').innerHTML = PERIODS.map(p =>
    `<button class="grp-tab ${chartPeriod === p ? 'active' : ''}" data-p="${p}">${t('p_' + p)}</button>`).join('');
  $('periodTabs').querySelectorAll('.grp-tab').forEach(b => {
    b.onclick = () => {
      chartPeriod = b.dataset.p;
      localStorage.setItem('kperiod', chartPeriod);
      renderChartStatics();
      loadKline();
    };
  });
  const inds = kchart ? kchart.ind : { ma: true, boll: false, macd: true };
  $('indToggles').innerHTML = ['ma', 'boll', 'macd'].map(k =>
    `<button class="grp-tab ${inds[k] ? 'active' : ''}" data-k="${k}">${k.toUpperCase()}</button>`).join('');
  $('indToggles').querySelectorAll('.grp-tab').forEach(b => {
    b.onclick = () => {
      if (!kchart) return;
      kchart.setIndicators({ [b.dataset.k]: !kchart.ind[b.dataset.k] });
      renderChartStatics();
    };
  });
}

function renderChartHead(q, sess) {
  if (!q || q.error) return;
  const c = cls(q.change);
  const ext = (sess !== 'regular' && q.extPrice != null)
    ? `<span class="ch-ext ${cls(q.extChange)}">${t('sess_' + (q.extSession || 'after'))} ${fmtNum(q.extPrice)} (${sign(q.extChangePercent)}${fmtNum(q.extChangePercent)}%)</span>`
    : '';
  $('chartHead').innerHTML = `
    <span class="ch-name">${dispName(q)}</span>
    <span class="ch-sym">${sym(q.code)} · USD</span>
    <span class="ch-price ${c}">${fmtNum(q.price)}</span>
    <span class="ch-chg ${c}">${sign(q.change)}${fmtNum(q.change)} (${sign(q.changePercent)}${fmtNum(q.changePercent)}%)</span>
    ${ext}`;
}

let klineLoadedKey = '';   // 最近一次成功装载的序列，用于判断"同序列刷新"

async function loadKline() {
  if (!chartCode) return;
  const code = chartCode, period = chartPeriod;
  const key = code + '|' + period;
  klineKey = key;   // 先记录，失败也按TTL节流重试
  klineAt = Date.now();
  $('chartMsg').classList.add('hidden');
  try {
    const resp = await fetch(`/api/kline?code=${encodeURIComponent(code)}&period=${period}`);
    const d = await resp.json();
    if (!resp.ok || d.error || !(d.candles || []).length) throw new Error('no data');
    if (chartCode === code && chartPeriod === period) {
      // 同序列的定时刷新保留用户的缩放/平移位置
      kchart.setData(d.candles, period, d.tz, klineLoadedKey === key);
      klineLoadedKey = key;
    }
  } catch (e) {
    $('chartMsg').textContent = t('chartErr');
    $('chartMsg').classList.remove('hidden');
  }
}

/* ---------- 个股分析面板 ---------- */
let anaData = null;
let anaCode = '';
let anaAt = 0;

async function loadAnalysis() {
  if (!chartCode) return;
  const code = chartCode;
  anaCode = code;          // 先记录，失败也按TTL节流重试
  anaAt = Date.now();
  $('anaBody').innerHTML = `<div class="empty">${t('ana').loading}</div>`;
  try {
    const resp = await fetch('/api/analysis?code=' + encodeURIComponent(code));
    const d = await resp.json();
    if (!resp.ok || d.error) throw new Error('bad');
    if (chartCode === code) {
      anaData = d;
      renderAnalysis();
    }
  } catch (e) {
    if (chartCode === code) $('anaBody').innerHTML = `<div class="empty">${t('ana').err}</div>`;
  }
}

function renderAnalysis() {
  const A = t('ana');
  $('anaTitle').textContent = A.title;
  $('anaMeta').textContent = A.basis;
  const d = anaData;
  if (!d) return;
  const i = d.ind;
  const vcls = d.score >= 15 ? 'up' : d.score <= -15 ? 'down' : 'flat';
  const needle = Math.min(Math.max((d.score + 100) / 2, 2), 98);

  const chips = d.signals.map(s =>
    `<span class="sig-chip ${s.t}">${A.sig[s.k] || s.k}</span>`).join('');

  const cards = `
    <div class="ana-card"><div class="ac-l">MACD (12,26,9)</div>
      <div class="ac-v">DIF ${fmtNum(i.dif, 3)} · DEA ${fmtNum(i.dea, 3)}<br>HIST ${fmtNum(i.hist, 3)}</div></div>
    <div class="ana-card"><div class="ac-l">RSI</div>
      <div class="ac-v">RSI14 <b class="${i.rsi14 > 70 ? 'down' : i.rsi14 < 30 ? 'up' : ''}">${fmtNum(i.rsi14, 1)}</b><br>RSI6 ${fmtNum(i.rsi6, 1)}</div></div>
    <div class="ana-card"><div class="ac-l">KDJ (9,3,3)</div>
      <div class="ac-v">K ${fmtNum(i.k, 1)} · D ${fmtNum(i.d, 1)}<br>J ${fmtNum(i.j, 1)}</div></div>
    <div class="ana-card"><div class="ac-l">BOLL (20,2)</div>
      <div class="ac-v">${fmtNum(i.bollLow)} ~ ${fmtNum(i.bollUp)}<br>%B ${fmtNum(i.pb, 1)}%</div></div>
    <div class="ana-card"><div class="ac-l">MA</div>
      <div class="ac-v">MA5 ${fmtNum(i.ma5)} · MA10 ${fmtNum(i.ma10)}<br>MA20 ${fmtNum(i.ma20)} · MA60 ${fmtNum(i.ma60)}</div></div>
    <div class="ana-card"><div class="ac-l">${A.volRatio} / ${A.mom5} / ${A.mom20}</div>
      <div class="ac-v">${fmtNum(i.volRatio, 2)}× · <span class="${cls(i.mom5)}">${sign(i.mom5)}${fmtNum(i.mom5, 1)}%</span> · <span class="${cls(i.mom20)}">${sign(i.mom20)}${fmtNum(i.mom20, 1)}%</span></div></div>
    <div class="ana-card"><div class="ac-l">${A.support} / ${A.resistance}</div>
      <div class="ac-v"><span class="up">${fmtNum(i.support)}</span> / <span class="down">${fmtNum(i.resistance)}</span></div></div>`;

  let opt = `<div class="empty">${A.optNa}</div>`;
  if (d.options) {
    const o = d.options;
    const sentCls = o.sentiment === 'bullish' ? 'up' : o.sentiment === 'bearish' ? 'down' : 'flat';
    const stats = `
      <div class="opt-stat">${A.pcrVol}<b>${fmtNum(o.pcrVol, 2)}</b></div>
      <div class="opt-stat">${A.pcrOi}<b>${fmtNum(o.pcrOi, 2)}</b></div>
      <div class="opt-stat">${A.maxPain}<b>${fmtNum(o.maxPain, o.maxPain % 1 ? 2 : 0)}</b></div>
      <div class="opt-stat">${A.atmIv}<b>${o.atmIv != null ? fmtNum(o.atmIv, 1) + '%' : '--'}</b></div>
      <div class="opt-stat">${A.nearExp}<b>${o.expiry || '--'}</b></div>
      <div class="opt-stat"><span class="${sentCls}" style="font-weight:700">${A.optSent[o.sentiment]}</span></div>`;
    let rows = `<div class="empty" style="padding:14px">${A.noUnusual}</div>`;
    if (o.unusual && o.unusual.length) {
      rows = `<div class="table-wrap"><table class="mini-table"><tbody>` + o.unusual.map(u => {
        const c = u.type === 'C' ? 'up' : 'down';
        return `<tr>
          <td><span class="chg-badge ${c}">${u.type === 'C' ? 'CALL' : 'PUT'}</span></td>
          <td class="num">${fmtNum(u.strike, u.strike % 1 ? 2 : 0)}</td>
          <td class="num flat">${u.expiry}</td>
          <td class="num">Vol ${u.vol.toLocaleString(LOCALES[lang])}</td>
          <td class="num flat">OI ${u.oi.toLocaleString(LOCALES[lang])}</td>
          <td class="num">${fmtNum(u.volOi, 1)}×</td>
          <td class="price ${c}">${fmtPrem(u.premium)}</td>
          <td class="num flat">${u.iv != null ? 'IV ' + fmtNum(u.iv, 1) + '%' : ''}</td>
        </tr>`;
      }).join('') + `</tbody></table></div>`;
    }
    opt = `<div class="section-title" style="margin-top:16px"><span>${A.optTitle}</span><span class="section-note">${A.unusual}</span></div>
      <div class="opt-stat-row">${stats}</div>${rows}`;
  }

  let sh = '';
  if (d.shortInt) {
    const s = d.shortInt;
    sh = `<div class="opt-stat-row" style="margin-top:12px">
      <div class="opt-stat">${A.shTitle}</div>
      <div class="opt-stat">${A.shRatio}<b>${fmtNum(s.ratio, 2)}</b></div>
      <div class="opt-stat">${A.shShares}<b>${s.shares != null ? fmtVolume(s.shares) : '--'}</b></div>
      <div class="opt-stat">${A.shPct}<b>${s.pctFloat != null ? fmtNum(s.pctFloat, 2) + '%' : '--'}</b></div>
    </div>`;
  }

  // 散户热度（Reddit 提及）+ 散户情绪总结
  let soc = '';
  {
    const s = d.social;
    const sent = retailSentiment(d);
    const scls = sent.label === 'bull' ? 'up' : sent.label === 'bear' ? 'down' : 'flat';
    const reasonTxt = sent.reasons.map(r => A.sentReason[r]).filter(Boolean).join(' · ');
    const sentLine = `<div class="sentiment-box">
      <span class="sent-badge ${scls}">${A.sentLabel[sent.label]}</span>
      <span class="sent-basis">${reasonTxt ? reasonTxt + ' — ' : ''}${A.sentBasis}</span>
    </div>`;

    let inner;
    if (s && s.inTop) {
      const tc = s.chg == null ? 'flat' : cls(s.chg);
      inner = `<div class="opt-stat-row">
        <div class="opt-stat">${A.socMentions}<b>${s.mentions.toLocaleString(LOCALES[lang])}</b></div>
        <div class="opt-stat">${A.socTrend}<b class="${tc}">${s.chg == null ? '--' : sign(s.chg) + fmtNum(s.chg, 0) + '%'}</b></div>
        <div class="opt-stat">${A.socRank}<b>#${s.rank}</b></div>
        <div class="opt-stat">${A.socUpvotes}<b>${s.upvotes != null ? fmtVolume(s.upvotes) : '--'}</b></div>
      </div>`;
    } else {
      inner = `<div class="empty" style="padding:14px">${A.socNotInTop}</div>`;
    }
    soc = `<div class="section-title" style="margin-top:16px"><span>${A.socTitle}</span><span class="section-note">${A.socSub}</span></div>
      ${sentLine}${inner}`;
  }

  // 近期新闻（近48h，带美东时间+相对时间+来源）
  let news = '';
  {
    const items = d.news || [];
    let rows;
    if (items.length) {
      rows = '<div class="news-list">' + items.map(n => `
        <a class="news-item" href="${n.link}" target="_blank" rel="noopener noreferrer">
          <div class="news-title">${escapeHtml(n.title)}</div>
          <div class="news-meta"><span class="news-src">${escapeHtml(n.publisher || '')}</span>
            <span class="news-time">${etTime(n.ts)} · ${relTime(n.ts)}</span></div>
        </a>`).join('') + '</div>';
    } else {
      rows = `<div class="empty" style="padding:14px">${A.newsNone}</div>`;
    }
    news = `<div class="section-title" style="margin-top:16px"><span>${A.newsTitle}</span><span class="section-note">${A.newsSub}</span></div>${rows}`;
  }

  $('anaBody').innerHTML = `
    <div class="ana-verdict">
      <span class="av-score ${vcls}">${d.score > 0 ? '+' : ''}${d.score}</span>
      <span class="av-verdict ${vcls}">${A.v[d.verdict]}</span>
      <div class="av-gauge"><div class="av-needle" style="left:${needle}%"></div></div>
    </div>
    <div class="sig-wrap">${chips}</div>
    <div class="ana-cards">${cards}</div>
    ${opt}${sh}${soc}${news}
    <p class="hint" style="margin-top:12px">${A.note}</p>`;
}

/* 散户情绪启发式：综合 Reddit 提及趋势 + 期权持仓方向 + 价格动量 */
function retailSentiment(d) {
  const s = d.social, o = d.options, i = d.ind;
  let score = 0;
  const reasons = [];
  if (o && o.pcrVol != null) {
    if (o.pcrVol < 0.7) { score += 2; reasons.push('opt_bull'); }
    else if (o.pcrVol > 1.3) { score -= 2; reasons.push('opt_bear'); }
  }
  if (i && i.mom5 != null) {
    if (i.mom5 > 3) { score += 1; reasons.push('px_up'); }
    else if (i.mom5 < -3) { score -= 1; reasons.push('px_down'); }
  }
  if (s && s.inTop && s.chg != null && s.chg > 50) {
    reasons.push('buzz');
    if (i && i.mom5 > 0) score += 1; else if (i && i.mom5 < 0) score -= 0.5;
  }
  const label = score >= 1.5 ? 'bull' : score <= -1.5 ? 'bear' : 'mixed';
  return { label, reasons };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function etTime(ts) {
  return new Date(ts * 1000).toLocaleString(LOCALES[lang], {
    timeZone: 'America/New_York', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
}
function relTime(ts) {
  const A = t('ana');
  const mins = Math.max(0, Math.floor(Date.now() / 1000 - ts) / 60);
  if (mins < 60) return A.agoMin(Math.floor(mins) || 1);
  const hrs = mins / 60;
  if (hrs < 24) return A.agoHr(Math.floor(hrs));
  return A.agoDay(Math.floor(hrs / 24));
}

async function refreshChartView(code, sess) {
  if (!kchart) {
    kchart = new KChart($('kcanvas'));
    window.addEventListener('resize', () => kchart && kchart.render());
  }
  if (chartCode !== code) {
    chartCode = code;
    kchart.setData([], chartPeriod);   // 清空旧图
    anaData = null;
    renderChartStatics();
  }
  // 报价头随行情刷新（1秒级）
  try {
    const map = await fetchQuotes([code]);
    renderChartHead(map[code], sess);
  } catch (e) { /* 保持上次 */ }
  // K线按周期节流：分钟级30秒，其余2分钟
  const ttl = chartPeriod.startsWith('m') ? 30000 : 120000;
  if (klineKey !== code + '|' + chartPeriod || Date.now() - klineAt > ttl) {
    await loadKline();
  }
  // 分析面板：换股立即加载，同股5分钟刷新一次
  if (anaCode !== code || Date.now() - anaAt > 300000) {
    loadAnalysis();   // 异步，不阻塞行情刷新
  }
  // 兜底重绘：视图刚变可见时布局才有宽度（canvas绘制开销极小）
  if (kchart.candles.length) kchart.render();
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
  $('mainView').classList.toggle('hidden', view.type !== 'main');
  $('detailView').classList.toggle('hidden', view.type !== 'index');
  $('chartView').classList.toggle('hidden', view.type !== 'chart');
  try {
    if (view.type === 'main') {
      const codes = [...INDICES.map(i => i.code), ...sectorCodes(SECTORS), ...watchlist];
      const map = await fetchQuotes(codes);
      lastMap = map;
      lastSess = sess;
      renderIndices(map);
      renderHeatmap(map, sess);
      if (!dragging) renderWatch(map, sess);
      refreshOptFlow();   // 独立节流，不阻塞行情刷新
      refreshRedditRank();
    } else if (view.type === 'index') {
      const ix = INDICES.find(i => i.key === view.key);
      const codes = [ix.code, ...CONSTITUENTS[view.key].map(tk => 'us' + tk)];
      const map = await fetchQuotes(codes);
      renderDetail(view.key, map);
    } else {
      await refreshChartView(view.code, sess);
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
