/* 板块定义（美股页 + 板块总览页共用）
   每项: { tk: ETF代码或合成板块ID, basket: 合成板块的成分股, n: 五语言名称 } */
window.SECTOR_DEFS = (() => {
  const S = (tk, en, zh, tw, ja, ko, basket) => ({ tk, basket, n: { en, zh, tw, ja, ko } });

  /* 主页展示的 11 个主要行业板块 */
  const MAIN = [
    S('SMH',  'Semiconductors',  '半导体',     '半導體',     '半導体',           '반도체'),
    S('IGV',  'Software',        '软件',       '軟體',       'ソフトウェア',      '소프트웨어'),
    S('CIBR', 'Cybersecurity',   '网络安全',   '網路安全',   'サイバーセキュリティ', '사이버보안'),
    S('SKYY', 'Cloud Computing', '云计算',     '雲端運算',   'クラウド',          '클라우드'),
    S('BOTZ', 'Robotics & AI',   '机器人与AI', '機器人與AI', 'ロボット・AI',      '로봇·AI'),
    S('XT',   'Exponential Tech','前沿科技',   '前沿科技',   '先端テクノロジー',   '첨단기술'),
    S('UFO',  'Space',           '太空',       '太空',       '宇宙',             '우주'),
    S('STOR', 'Storage',         '存储',       '儲存',       'ストレージ',        '스토리지', ['MU', 'WDC', 'STX']),
    S('BITQ', 'Crypto',          '加密货币',   '加密貨幣',   '暗号資産',          '암호화폐'),
    S('GLTR', 'Precious Metals', '贵金属',     '貴金屬',     '貴金属',           '귀금속'),
    S('XBI',  'Biotech',         '生物科技',   '生物科技',   'バイオテック',      '바이오텍'),
  ];

  /* 标普500 GICS 11 大板块 */
  const CORE = [
    S('XLK',  'Technology',       '信息技术', '資訊科技', '情報技術',       '정보기술'),
    S('XLF',  'Financials',       '金融',     '金融',     '金融',           '금융'),
    S('XLV',  'Health Care',      '医疗保健', '醫療保健', 'ヘルスケア',      '헬스케어'),
    S('XLY',  'Consumer Disc.',   '可选消费', '非必需消費','一般消費財',     '임의소비재'),
    S('XLC',  'Communication',    '通信服务', '通訊服務', '通信サービス',    '통신서비스'),
    S('XLI',  'Industrials',      '工业',     '工業',     '資本財',         '산업재'),
    S('XLP',  'Consumer Staples', '必需消费', '必需消費', '生活必需品',      '필수소비재'),
    S('XLE',  'Energy',           '能源',     '能源',     'エネルギー',      '에너지'),
    S('XLU',  'Utilities',        '公用事业', '公用事業', '公益事業',        '유틸리티'),
    S('XLB',  'Materials',        '材料',     '原物料',   '素材',           '소재'),
    S('XLRE', 'Real Estate',      '房地产',   '房地產',   '不動産',         '부동산'),
  ];

  /* 板块总览页的行业与主题（含主页 11 个） */
  const INDUSTRY = [
    ...MAIN,
    S('JETS', 'Airlines',            '航空',           '航空',           '航空',           '항공'),
    S('ITA',  'Aerospace & Defense', '国防军工',       '國防軍工',       '航空宇宙・防衛',  '방위산업'),
    S('IYT',  'Transportation',      '运输',           '運輸',           '運輸',           '운송'),
    S('KRE',  'Regional Banks',      '区域银行',       '區域銀行',       '地方銀行',        '지방은행'),
    S('XRT',  'Retail',              '零售',           '零售',           '小売',           '소매'),
    S('XHB',  'Homebuilders',        '住宅建筑',       '住宅營建',       '住宅建設',        '주택건설'),
    S('XOP',  'Oil & Gas E&P',       '油气开采',       '油氣開採',       '石油ガス開発',    '석유가스개발'),
    S('XME',  'Metals & Mining',     '金属矿业',       '金屬礦業',       '金属・鉱業',      '금속·광업'),
    S('GDX',  'Gold Miners',         '黄金矿业',       '黃金礦業',       '金鉱株',         '금광주'),
    S('TAN',  'Solar',               '太阳能',         '太陽能',         '太陽光',         '태양광'),
    S('URA',  'Uranium',             '铀与核能',       '鈾與核能',       'ウラン',         '우라늄'),
    S('KWEB', 'China Internet',      '中概互联',       '中概互聯',       '中国ネット株',    '중국인터넷'),
    S('DRIV', 'EV & Autonomous',     '电动车与自动驾驶','電動車與自動駕駛','EV・自動運転',   '전기차·자율주행'),
    S('IHI',  'Medical Devices',     '医疗器械',       '醫療器材',       '医療機器',        '의료기기'),
  ];

  /* 板块需要请求的行情代码 */
  const codesOf = (s) => (s.basket || [s.tk]).map(x => 'us' + x);

  return { MAIN, CORE, INDUSTRY, codesOf };
})();
