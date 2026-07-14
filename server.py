# -*- coding: utf-8 -*-
"""
股票分析网站 - 后端服务
零依赖，仅使用 Python 标准库。运行: python server.py
行情数据来源: 腾讯财经 (qt.gtimg.cn)，支持 A股 / 港股 / 美股
"""
import datetime
import hashlib
import hmac
import html
import json
import os
import re
import secrets
import sqlite3
import threading
import time
import urllib.error
import urllib.request
from zoneinfo import ZoneInfo
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs, quote as urlquote

# 部署平台（Render/Railway 等）通过 PORT 环境变量指定端口
PORT = int(os.environ.get("PORT", "8000"))
HOST = os.environ.get("HOST", "0.0.0.0")
PUBLIC_DIR = Path(__file__).parent / "public"

# 页面路由：三个市场各自独立页面，首页默认展示美股
PAGE_ROUTES = {
    "/": "us.html",
    "/us": "us.html",
    "/kr": "kr.html",
    "/hk": "hk.html",
    "/a": "a.html",
    "/sectors": "sectors.html",
    "/options": "options.html",
}

QUOTE_URL = "https://qt.gtimg.cn/q={codes}"
LINE_RE = re.compile(r'v_([\w.]+)="([^"]*)"')  # 代码可含点号，如 usBRK.B

# 新浪美股接口：提供盘前/盘后价格（腾讯接口没有）
SINA_URL = "https://hq.sinajs.cn/list={codes}"
SINA_LINE_RE = re.compile(r'hq_str_gb_([\w.]+)="([^"]*)"')


# 盘前/盘后数据：后台线程每 15 秒保温缓存，请求路径只读缓存、永不等待上游
# （此前缓存过期时请求要同步等新浪超时+Yahoo认证，最坏七八秒，导致打开页面卡顿）
_ext_cache = {"time": 0.0, "data": {}}
_ext_watch = set()          # 需要保温的代码集合（出现过的美股代码）
_ext_lock = threading.Lock()
# 新浪封海外 IP（403）：失败后 10 分钟内直接走 Yahoo，避免每次白等超时
_sina_down_until = 0.0


def fetch_us_ext_cached(us_codes):
    """注册代码进保温列表并立即返回当前缓存（非阻塞）。"""
    with _ext_lock:
        _ext_watch.update(us_codes)
        if len(_ext_watch) > 500:  # 防止无限增长
            _ext_watch.clear()
            _ext_watch.update(us_codes)
    return _ext_cache["data"]


def _ext_refresher():
    global _ext_cache
    while True:
        with _ext_lock:
            codes = list(_ext_watch)[:120]
        if not codes:
            time.sleep(1)   # 服务刚启动还没有请求，快速等待首批代码
            continue
        try:
            data = fetch_us_ext_any(codes)
            _ext_cache = {"time": time.time(),
                          "data": {**_ext_cache["data"], **data}}
        except Exception:
            pass
        time.sleep(15)


# 行情响应微缓存：同一批代码 0.8 秒内复用，多用户秒级轮询不会打爆上游
_quote_cache = {}
_quote_lock = threading.Lock()


def fetch_quotes_cached(codes):
    key = ",".join(codes)
    now = time.time()
    with _quote_lock:
        hit = _quote_cache.get(key)
        if hit and now - hit[0] < 0.8:
            return hit[1]
    data = fetch_quotes(codes)
    with _quote_lock:
        if len(_quote_cache) > 300:
            _quote_cache.clear()
        _quote_cache[key] = (now, data)
    return data


def fetch_us_ext_any(us_codes):
    global _sina_down_until
    if time.time() > _sina_down_until:
        try:
            return fetch_us_ext(us_codes)
        except Exception:
            _sina_down_until = time.time() + 600
    return fetch_us_ext_yahoo(us_codes)


# ---------- Yahoo Finance 备用源（海外服务器可用；需要匿名 cookie+crumb） ----------
YAHOO_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
_yahoo_auth = {"cookie": "", "crumb": "", "time": 0.0}


def _yahoo_get_auth():
    global _yahoo_auth
    if _yahoo_auth["crumb"] and time.time() - _yahoo_auth["time"] < 6 * 3600:
        return _yahoo_auth
    cookie = ""
    try:
        urllib.request.urlopen(urllib.request.Request(
            "https://fc.yahoo.com/", headers={"User-Agent": YAHOO_UA}), timeout=6)
    except urllib.error.HTTPError as e:  # fc.yahoo.com 返回 404 但携带 Set-Cookie
        cookie = (e.headers.get("Set-Cookie") or "").split(";")[0]
    req = urllib.request.Request(
        "https://query1.finance.yahoo.com/v1/test/getcrumb",
        headers={"User-Agent": YAHOO_UA, "Cookie": cookie})
    crumb = urllib.request.urlopen(req, timeout=6).read().decode()
    _yahoo_auth = {"cookie": cookie, "crumb": crumb, "time": time.time()}
    return _yahoo_auth


def fetch_us_ext_yahoo(us_codes, _retried=False):
    global _yahoo_auth
    auth = _yahoo_get_auth()
    sym_map = {c[2:].replace(".", "-").upper(): c for c in us_codes}
    url = ("https://query1.finance.yahoo.com/v7/finance/quote?symbols=" +
           ",".join(sym_map) + "&crumb=" + urlquote(auth["crumb"]))
    req = urllib.request.Request(url, headers={"User-Agent": YAHOO_UA, "Cookie": auth["cookie"]})
    try:
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        if not _retried and e.code in (401, 403):  # crumb 过期，重取一次
            _yahoo_auth = {"cookie": "", "crumb": "", "time": 0.0}
            return fetch_us_ext_yahoo(us_codes, _retried=True)
        raise
    result = {}
    for r in data.get("quoteResponse", {}).get("result", []):
        code = sym_map.get(r.get("symbol", ""))
        if not code:
            continue
        state = r.get("marketState", "")
        if state.startswith("PRE") and r.get("preMarketPrice") is not None:
            sess = "pre"
            price, pct, chg, ts = (r.get("preMarketPrice"), r.get("preMarketChangePercent"),
                                   r.get("preMarketChange"), r.get("preMarketTime"))
        elif r.get("postMarketPrice") is not None:
            sess = "after"
            price, pct, chg, ts = (r.get("postMarketPrice"), r.get("postMarketChangePercent"),
                                   r.get("postMarketChange"), r.get("postMarketTime"))
        else:
            continue
        result[code] = {
            "extPrice": round(price, 4),
            "extChangePercent": round(pct, 2) if pct is not None else None,
            "extChange": round(chg, 4) if chg is not None else None,
            "extTime": ts,
            "extSession": sess,
        }
    return result


# ---------- 大盘指数（Yahoo v7 quote，用于腾讯不覆盖的市场，如韩国 KOSPI/KOSDAQ） ----------
INDEX_CFG = {
    "kr": [("^KS11", "KOSPI"), ("^KQ11", "KOSDAQ")],
}
_index_cache = {}          # market -> (time, list)
_index_lock = threading.Lock()


def _yahoo_v7(symbols, _retried=False):
    global _yahoo_auth
    auth = _yahoo_get_auth()
    url = ("https://query1.finance.yahoo.com/v7/finance/quote?symbols=" +
           urlquote(",".join(symbols)) + "&crumb=" + urlquote(auth["crumb"]))
    req = urllib.request.Request(url, headers={"User-Agent": YAHOO_UA, "Cookie": auth["cookie"]})
    try:
        with urllib.request.urlopen(req, timeout=6) as resp:
            data = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        if not _retried and e.code in (401, 403):
            _yahoo_auth = {"cookie": "", "crumb": "", "time": 0.0}
            return _yahoo_v7(symbols, _retried=True)
        raise
    return {r.get("symbol"): r for r in data.get("quoteResponse", {}).get("result", [])}


def fetch_indices(market):
    cfg = INDEX_CFG.get(market)
    if not cfg:
        return []
    now = time.time()
    with _index_lock:
        hit = _index_cache.get(market)
    if hit and now - hit[0] < 20:
        return hit[1]
    try:
        raw = _yahoo_v7([s for s, _ in cfg])
    except Exception:
        return hit[1] if hit else []
    result = []
    for sym, name in cfg:
        r = raw.get(sym) or {}
        if r.get("regularMarketPrice") is None:
            continue
        result.append({
            "symbol": sym,
            "name": name,
            "price": r.get("regularMarketPrice"),
            "change": r.get("regularMarketChange"),
            "changePercent": r.get("regularMarketChangePercent"),
        })
    with _index_lock:
        _index_cache[market] = (now, result)
    return result


def fetch_us_ext(us_codes):
    """抓取美股非常规时段行情（盘前/盘后）。返回 {usAAPL: {extPrice,...}}。"""
    syms = ",".join("gb_" + c[2:].lower() for c in us_codes)
    req = urllib.request.Request(SINA_URL.format(codes=syms), headers={
        "Referer": "https://finance.sina.com.cn/",
        "User-Agent": "Mozilla/5.0",
    })
    with urllib.request.urlopen(req, timeout=6) as resp:
        text = resp.read().decode("gbk", errors="replace")
    result = {}
    for m in SINA_LINE_RE.finditer(text):
        f = m.group(2).split(",")
        # [21]盘前/盘后价 [22]相对收盘涨跌% [23]涨跌额 [24]报价时间(美东)
        if len(f) < 28 or not f[21]:
            continue
        try:
            ext_price = float(f[21])
            ext_pct = float(f[22])
            ext_chg = float(f[23])
        except ValueError:
            continue
        if ext_price <= 0:
            continue
        # 报价时间含 AM 即盘前（美股盘前 4:00-9:30AM），否则为盘后
        result["us" + m.group(1).upper()] = {
            "extPrice": ext_price,
            "extChangePercent": ext_pct,
            "extChange": ext_chg,
            "extTime": f[24],
            "extSession": "pre" if "AM" in f[24].upper() else "after",
        }
    return result

# ---------- K线数据（Yahoo v8 chart，免认证） ----------
# period -> (yahoo interval, range, 缓存秒数)
KLINE_CFG = {
    "m1":  ("1m",  "2d",  30),
    "m5":  ("5m",  "10d", 30),
    "m15": ("15m", "30d", 30),
    "d":   ("1d",  "2y",  300),
    "w":   ("1wk", "10y", 300),
    "mo":  ("1mo", "max", 3600),
    "y":   ("1mo", "max", 3600),   # 年K由月K聚合
}
_kline_cache = {}
_kline_lock = threading.Lock()


def _aggregate_yearly(candles, tz_name):
    """月K聚合为年K：[t,o,h,l,c,v] 按交易所时区的年份分组"""
    zone = ZoneInfo(tz_name or "America/New_York")
    out = []
    cur = None
    for t, o, h, l, c, v in candles:
        year = datetime.datetime.fromtimestamp(t, zone).year
        if cur and cur[0] == year:
            cur[3] = max(cur[3], h)
            cur[4] = min(cur[4], l)
            cur[5] = c
            cur[6] += v
        else:
            if cur:
                out.append(cur[1:])
            cur = [year, t, o, h, l, c, v]
    if cur:
        out.append(cur[1:])
    return out


def fetch_kline(code, period):
    interval, rng, _ = KLINE_CFG[period]
    sym = code[2:].replace(".", "-")
    # 分钟级带盘前盘后K线（Yahoo 默认只给盘中，盘前/盘后时段会看起来"不更新"）
    pre_post = "&includePrePost=true" if period.startswith("m") else ""
    url = (f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}"
           f"?interval={interval}&range={rng}{pre_post}")
    req = urllib.request.Request(url, headers={"User-Agent": YAHOO_UA})
    with urllib.request.urlopen(req, timeout=10) as resp:
        d = json.loads(resp.read())
    r = d["chart"]["result"][0]
    ts = r.get("timestamp") or []
    q = r["indicators"]["quote"][0]
    o_, h_, l_, c_, v_ = (q.get(k) or [] for k in ("open", "high", "low", "close", "volume"))
    candles = []
    for i in range(len(ts)):
        if i >= len(c_) or c_[i] is None or o_[i] is None or h_[i] is None or l_[i] is None:
            continue
        candles.append([ts[i], round(o_[i], 4), round(h_[i], 4),
                        round(l_[i], 4), round(c_[i], 4), int(v_[i] or 0)])
    tz_name = (r.get("meta") or {}).get("exchangeTimezoneName", "America/New_York")
    if period == "y":
        candles = _aggregate_yearly(candles, tz_name)
    return {"code": code, "period": period, "tz": tz_name, "candles": candles}


def fetch_kline_cached(code, period):
    key = (code, period)
    ttl = KLINE_CFG[period][2]
    now = time.time()
    with _kline_lock:
        hit = _kline_cache.get(key)
        if hit and now - hit[0] < ttl:
            return hit[1]
    data = fetch_kline(code, period)
    with _kline_lock:
        if len(_kline_cache) > 500:
            _kline_cache.clear()
        _kline_cache[key] = (now, data)
    return data


# ---------- 个股技术分析引擎（基于日K + 期权链 + 做空数据） ----------
_ana_cache = {}
_ana_lock = threading.Lock()


def _ema_series(vals, n):
    k = 2 / (n + 1)
    out = []
    prev = None
    for v in vals:
        prev = v if prev is None else v * k + prev * (1 - k)
        out.append(prev)
    return out


def _sma_last(vals, n):
    return sum(vals[-n:]) / n if len(vals) >= n else None


def _rsi_last(closes, n):
    """Wilder 平滑 RSI"""
    if len(closes) < n + 1:
        return None
    gains = losses = 0.0
    for i in range(1, n + 1):
        d = closes[i] - closes[i - 1]
        gains += max(d, 0)
        losses += max(-d, 0)
    avg_g, avg_l = gains / n, losses / n
    for i in range(n + 1, len(closes)):
        d = closes[i] - closes[i - 1]
        avg_g = (avg_g * (n - 1) + max(d, 0)) / n
        avg_l = (avg_l * (n - 1) + max(-d, 0)) / n
    if avg_l == 0:
        return 100.0
    return 100 - 100 / (1 + avg_g / avg_l)


def _kdj_series(highs, lows, closes, n=9):
    k = d = 50.0
    out = []
    for i in range(len(closes)):
        lo = min(lows[max(0, i - n + 1):i + 1])
        hi = max(highs[max(0, i - n + 1):i + 1])
        rsv = 50.0 if hi == lo else (closes[i] - lo) / (hi - lo) * 100
        k = k * 2 / 3 + rsv / 3
        d = d * 2 / 3 + k / 3
        out.append((k, d, 3 * k - 2 * d))
    return out


def _compute_tech(candles):
    """技术指标 + 加权评分（-100~+100，正为偏多）"""
    closes = [c[4] for c in candles]
    highs = [c[2] for c in candles]
    lows = [c[3] for c in candles]
    vols = [c[5] for c in candles]
    c = closes[-1]

    e12 = _ema_series(closes, 12)
    e26 = _ema_series(closes, 26)
    dif = [a - b for a, b in zip(e12, e26)]
    dea = _ema_series(dif, 9)
    hist = [(a - b) * 2 for a, b in zip(dif, dea)]

    rsi14 = _rsi_last(closes, 14)
    rsi6 = _rsi_last(closes, 6)
    kdj = _kdj_series(highs, lows, closes)
    k_, d_, j_ = kdj[-1]
    pk, pd_, _ = kdj[-2]

    ma5, ma10, ma20, ma60 = (_sma_last(closes, n) for n in (5, 10, 20, 60))
    sd20 = (sum((x - ma20) ** 2 for x in closes[-20:]) / 20) ** 0.5
    boll_up, boll_low = ma20 + 2 * sd20, ma20 - 2 * sd20
    pb = (c - boll_low) / (boll_up - boll_low) if boll_up != boll_low else 0.5

    avg_vol5 = sum(vols[-6:-1]) / 5 if len(vols) >= 6 else None
    vol_ratio = vols[-1] / avg_vol5 if avg_vol5 else None
    day_chg = (closes[-1] / closes[-2] - 1) * 100
    mom5 = (c / closes[-6] - 1) * 100
    mom20 = (c / closes[-21] - 1) * 100
    support = min(lows[-20:])
    resistance = max(highs[-20:])

    signals = []
    score = 0

    def sig(key, tag, pts):
        nonlocal score
        signals.append({"k": key, "t": tag})
        score += pts

    # MACD：金叉/死叉 + 动能柱方向
    sig("macd_golden", "bull", 18) if dif[-1] > dea[-1] else sig("macd_death", "bear", -18)
    sig("macd_hist_up", "bull", 7) if hist[-1] > hist[-2] else sig("macd_hist_down", "bear", -7)
    # 均线排列
    if ma5 > ma20 > ma60:
        sig("ma_bull", "bull", 18)
    elif ma5 < ma20 < ma60:
        sig("ma_bear", "bear", -18)
    else:
        sig("ma_mixed", "neut", 0)
    sig("px_above_ma20", "bull", 6) if c > ma20 else sig("px_below_ma20", "bear", -6)
    # RSI：极值做均值回归解读，中段做趋势解读
    if rsi14 is not None:
        if rsi14 > 70:
            sig("rsi_overbought", "bear", -12)
        elif rsi14 < 30:
            sig("rsi_oversold", "bull", 12)
        elif rsi14 >= 50:
            sig("rsi_bullzone", "bull", 6)
        else:
            sig("rsi_bearzone", "bear", -6)
    # KDJ：金叉/死叉优先，其次多空位置；J 值极端提示
    if k_ > d_ and pk <= pd_:
        sig("kdj_golden", "bull", 12)
    elif k_ < d_ and pk >= pd_:
        sig("kdj_death", "bear", -12)
    elif k_ > d_:
        sig("kdj_bull", "bull", 6)
    else:
        sig("kdj_bear", "bear", -6)
    if j_ > 100:
        sig("kdj_j_hot", "bear", -6)
    elif j_ < 0:
        sig("kdj_j_cold", "bull", 6)
    # 布林带突破（超买/超卖）
    if pb > 1:
        sig("boll_break_up", "bear", -8)
    elif pb < 0:
        sig("boll_break_down", "bull", 8)
    # 量价配合
    if vol_ratio is not None and vol_ratio > 1.8:
        sig("vol_surge_up", "bull", 8) if day_chg > 0 else sig("vol_surge_down", "bear", -8)
    # 短期动量
    if mom5 > 3:
        sig("mom_strong", "bull", 8)
    elif mom5 < -3:
        sig("mom_weak", "bear", -8)

    score = max(-100, min(100, score))
    if score >= 50:
        verdict = "strong_bull"
    elif score >= 15:
        verdict = "bull"
    elif score > -15:
        verdict = "neutral"
    elif score > -50:
        verdict = "bear"
    else:
        verdict = "strong_bear"

    r = lambda v, n=2: round(v, n) if v is not None else None
    return {
        "score": score, "verdict": verdict, "signals": signals,
        "ind": {
            "dif": r(dif[-1], 3), "dea": r(dea[-1], 3), "hist": r(hist[-1], 3),
            "rsi14": r(rsi14), "rsi6": r(rsi6),
            "k": r(k_), "d": r(d_), "j": r(j_),
            "bollUp": r(boll_up), "bollMid": r(ma20), "bollLow": r(boll_low), "pb": r(pb * 100, 1),
            "ma5": r(ma5), "ma10": r(ma10), "ma20": r(ma20), "ma60": r(ma60),
            "volRatio": r(vol_ratio), "dayChg": r(day_chg),
            "mom5": r(mom5), "mom20": r(mom20),
            "support": r(support), "resistance": r(resistance),
        },
    }


def _analyze_options(symbol, spot):
    """个股期权链分析：PCR、最大痛点、ATM隐波、异动大单（量/持仓比法）"""
    url = f"https://cdn.cboe.com/api/global/delayed_quotes/options/{symbol}.json"
    req = urllib.request.Request(url, headers={"User-Agent": YAHOO_UA})
    with urllib.request.urlopen(req, timeout=15) as resp:
        d = json.loads(resp.read())
    data = d.get("data") or {}
    spot = data.get("close") or spot
    today = datetime.datetime.now(ZoneInfo("America/New_York")).strftime("%Y-%m-%d")

    contracts = []
    for o in data.get("options") or []:
        m = OPT_RE.match(o.get("option") or "")
        if not m:
            continue
        contracts.append({
            "type": m.group(3),
            "expiry": f"20{m.group(2)[:2]}-{m.group(2)[2:4]}-{m.group(2)[4:]}",
            "strike": int(m.group(4)) / 1000,
            "vol": o.get("volume") or 0,
            "oi": o.get("open_interest") or 0,
            "last": o.get("last_trade_price") or 0,
            "iv": o.get("iv"),
        })
    if not contracts:
        return None

    call_vol = sum(x["vol"] for x in contracts if x["type"] == "C")
    put_vol = sum(x["vol"] for x in contracts if x["type"] == "P")
    call_oi = sum(x["oi"] for x in contracts if x["type"] == "C")
    put_oi = sum(x["oi"] for x in contracts if x["type"] == "P")
    pcr_vol = put_vol / call_vol if call_vol else None
    pcr_oi = put_oi / call_oi if call_oi else None

    # 最近的有效到期日（未过期且总持仓≥1000）→ 最大痛点 + ATM隐波
    max_pain = atm_iv = near_expiry = None
    expiries = sorted({x["expiry"] for x in contracts if x["expiry"] >= today})
    for exp in expiries:
        grp = [x for x in contracts if x["expiry"] == exp]
        if sum(x["oi"] for x in grp) >= 1000:
            near_expiry = exp
            strikes = sorted({x["strike"] for x in grp})
            best, best_pay = None, None
            for s in strikes:
                pay = sum(x["oi"] * max(0.0, s - x["strike"]) for x in grp if x["type"] == "C") + \
                      sum(x["oi"] * max(0.0, x["strike"] - s) for x in grp if x["type"] == "P")
                if best_pay is None or pay < best_pay:
                    best, best_pay = s, pay
            max_pain = best
            if spot:
                atm = min(strikes, key=lambda s: abs(s - spot))
                ivs = [x["iv"] for x in grp if x["strike"] == atm and x["iv"]]
                atm_iv = round(sum(ivs) / len(ivs) * 100, 1) if ivs else None
            break

    # 异动大单：量≥200 且 权利金≥$20万 且 量≥持仓1.5倍（疑似新开仓）
    unusual = []
    for x in contracts:
        prem = x["vol"] * x["last"] * 100
        if x["vol"] >= 200 and prem >= 200_000 and x["vol"] >= 1.5 * max(x["oi"], 1):
            unusual.append({
                "type": x["type"], "strike": x["strike"], "expiry": x["expiry"],
                "vol": int(x["vol"]), "oi": int(x["oi"]),
                "volOi": round(x["vol"] / max(x["oi"], 1), 1),
                "last": x["last"], "premium": int(prem),
                "iv": round(x["iv"] * 100, 1) if x["iv"] else None,
            })
    unusual.sort(key=lambda x: -x["premium"])
    unusual = unusual[:6]

    if pcr_vol is not None and pcr_vol < 0.7:
        sentiment = "bullish"
    elif pcr_vol is not None and pcr_vol > 1.3:
        sentiment = "bearish"
    else:
        sentiment = "balanced"

    return {
        "pcrVol": round(pcr_vol, 2) if pcr_vol is not None else None,
        "pcrOi": round(pcr_oi, 2) if pcr_oi is not None else None,
        "expiry": near_expiry, "maxPain": max_pain, "atmIv": atm_iv,
        "sentiment": sentiment, "unusual": unusual,
    }


def _fetch_short_interest(symbol):
    """Yahoo quoteSummary 做空数据（失败返回 None）"""
    auth = _yahoo_get_auth()
    url = (f"https://query1.finance.yahoo.com/v10/finance/quoteSummary/{symbol}"
           f"?modules=defaultKeyStatistics&crumb={urlquote(auth['crumb'])}")
    req = urllib.request.Request(url, headers={"User-Agent": YAHOO_UA, "Cookie": auth["cookie"]})
    with urllib.request.urlopen(req, timeout=8) as resp:
        d = json.loads(resp.read())
    ks = d["quoteSummary"]["result"][0]["defaultKeyStatistics"]
    g = lambda k: (ks.get(k) or {}).get("raw")
    ratio, shares, pct = g("shortRatio"), g("sharesShort"), g("shortPercentOfFloat")
    if ratio is None and shares is None:
        return None
    return {
        "ratio": ratio,
        "shares": shares,
        "pctFloat": round(pct * 100, 2) if pct is not None else None,
    }


# ---------- 散户社媒热度（ApeWisdom 聚合 Reddit 提及量，共享 top-100 列表缓存30分钟） ----------
_social_cache = {"time": 0.0, "map": {}, "list": []}
_social_lock = threading.Lock()


def _refresh_social():
    now = time.time()
    with _social_lock:
        if now - _social_cache["time"] < 1800 and _social_cache["map"]:
            return _social_cache["map"]
    try:
        req = urllib.request.Request(
            "https://apewisdom.io/api/v1.0/filter/all-stocks/page/1",
            headers={"User-Agent": YAHOO_UA})
        with urllib.request.urlopen(req, timeout=10) as resp:
            d = json.loads(resp.read())
        m, lst = {}, []
        for r in d.get("results", []):
            entry = {
                "ticker": r.get("ticker"),
                "name": html.unescape(r.get("name") or ""),
                "mentions": r.get("mentions"),
                "mentions24h": r.get("mentions_24h_ago"),
                "rank": r.get("rank"),
                "upvotes": r.get("upvotes"),
            }
            m[r.get("ticker")] = entry
            lst.append(entry)
        with _social_lock:
            _social_cache["time"] = now
            _social_cache["map"] = m
            _social_cache["list"] = lst
        return m
    except Exception:
        return _social_cache["map"]


def social_top(n=5):
    _refresh_social()
    with _social_lock:
        lst = list(_social_cache.get("list") or [])
        ts = _social_cache["time"]
    lst.sort(key=lambda x: x.get("rank") or 9999)
    out = []
    for e in lst[:n]:
        chg = None
        if e.get("mentions24h"):
            chg = round((e["mentions"] / e["mentions24h"] - 1) * 100)
        out.append({"ticker": e["ticker"], "name": e.get("name"),
                    "mentions": e["mentions"], "chg": chg, "rank": e["rank"]})
    return {"top": out, "time": ts}


def _get_social(sym):
    m = _refresh_social()
    d = m.get(sym.replace("-", "."))  # BRK-B -> BRK.B（ApeWisdom 用点）
    if not d:
        d = m.get(sym)
    if not d or d.get("mentions") is None:
        return {"inTop": False, "mentions": 0, "rank": None}
    chg = None
    prev = d.get("mentions24h")
    if prev:
        chg = round((d["mentions"] / prev - 1) * 100, 1)
    return {"inTop": True, "mentions": d["mentions"], "mentions24h": prev,
            "chg": chg, "rank": d["rank"], "upvotes": d.get("upvotes")}


def _fetch_news(symbol, hours=48):
    """Yahoo Finance 个股新闻，仅保留近 hours 小时（含 unix 时间戳与来源）"""
    url = ("https://query1.finance.yahoo.com/v1/finance/search?q=" + urlquote(symbol) +
           "&newsCount=20&quotesCount=0&enableFuzzyQuery=false")
    req = urllib.request.Request(url, headers={"User-Agent": YAHOO_UA})
    with urllib.request.urlopen(req, timeout=8) as resp:
        d = json.loads(resp.read())
    cutoff = time.time() - hours * 3600
    out = []
    for n in d.get("news", []):
        ts = n.get("providerPublishTime")
        title = n.get("title")
        if not ts or not title or ts < cutoff:
            continue
        out.append({
            "title": title,
            "publisher": n.get("publisher"),
            "link": n.get("link"),
            "ts": ts,
        })
    out.sort(key=lambda x: -x["ts"])
    return out[:8]


def compute_analysis(code):
    kl = fetch_kline_cached(code, "d")
    candles = kl.get("candles") or []
    if len(candles) < 70:
        raise ValueError("insufficient history")
    result = _compute_tech(candles)
    result["code"] = code
    result["time"] = time.time()
    sym = code[2:].replace(".", "-")
    try:
        result["options"] = _analyze_options(sym, candles[-1][4])
    except Exception:
        result["options"] = None
    try:
        result["shortInt"] = _fetch_short_interest(sym)
    except Exception:
        result["shortInt"] = None
    try:
        result["social"] = _get_social(sym)
    except Exception:
        result["social"] = None
    try:
        result["news"] = _fetch_news(sym)
    except Exception:
        result["news"] = None
    return result


def compute_analysis_cached(code):
    now = time.time()
    with _ana_lock:
        hit = _ana_cache.get(code)
        if hit and now - hit[0] < 300:
            return hit[1]
    data = compute_analysis(code)
    with _ana_lock:
        if len(_ana_cache) > 200:
            _ana_cache.clear()
        _ana_cache[code] = (now, data)
    return data


# ---------- 期权异动扫描（CBOE 免费延迟期权链，15分钟延迟） ----------
# 筛选逻辑：成交量明显超过持仓（疑似新开仓）且权利金规模大的合约
OPTIONS_UNIVERSE = [
    "SPY", "QQQ", "IWM", "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA",
    "AMD", "AVGO", "MU", "NFLX", "COIN", "MSTR", "PLTR", "BABA", "INTC", "ORCL",
    "XOM", "JPM", "BAC", "UNH", "LLY", "WMT", "COST", "DIS", "BA", "GLD",
]
OPT_RE = re.compile(r"^([A-Z.]+)(\d{6})([CP])(\d{8})$")
_opt_cache = {"time": 0.0, "items": [], "scanned": 0}


def _scan_options_once():
    items = []
    scanned = 0
    for symbol in OPTIONS_UNIVERSE:
        try:
            url = f"https://cdn.cboe.com/api/global/delayed_quotes/options/{symbol}.json"
            req = urllib.request.Request(url, headers={"User-Agent": YAHOO_UA})
            with urllib.request.urlopen(req, timeout=15) as resp:
                d = json.loads(resp.read())
            data = d.get("data") or {}
            spot = data.get("close")
            scanned += 1
            per_symbol = []
            for o in data.get("options") or []:
                vol = o.get("volume") or 0
                oi = o.get("open_interest") or 0
                last = o.get("last_trade_price") or 0
                premium = vol * last * 100
                # 异动阈值：量≥500 且 权利金≥$50万 且 量/持仓≥1.5
                if vol < 500 or premium < 500_000 or vol < 1.5 * max(oi, 1):
                    continue
                m = OPT_RE.match(o.get("option") or "")
                if not m:
                    continue
                per_symbol.append({
                    "symbol": symbol,
                    "type": m.group(3),
                    "expiry": f"20{m.group(2)[:2]}-{m.group(2)[2:4]}-{m.group(2)[4:]}",
                    "strike": int(m.group(4)) / 1000,
                    "spot": spot,
                    "volume": int(vol),
                    "oi": int(oi),
                    "volOi": round(vol / max(oi, 1), 1),
                    "last": last,
                    "premium": int(premium),
                    "iv": o.get("iv"),
                })
            per_symbol.sort(key=lambda x: -x["premium"])
            items.extend(per_symbol[:8])  # 每标的最多8条，避免0DTE刷屏
        except Exception:
            pass
        time.sleep(1.0)  # 温和抓取
    items.sort(key=lambda x: -x["premium"])
    return items[:60], scanned


def _options_scanner():
    global _opt_cache
    while True:
        try:
            items, scanned = _scan_options_once()
            if items or not _opt_cache["items"]:
                _opt_cache = {"time": time.time(), "items": items, "scanned": scanned}
        except Exception:
            pass
        time.sleep(600)  # 每10分钟扫一轮


# ---------- 用户账号与自选列表（SQLite，Python 内置） ----------
DB_PATH = Path(__file__).parent / "data.db"
SESSION_TTL = 30 * 24 * 3600  # 会话有效期 30 天
USERNAME_RE = re.compile(r"^[A-Za-z0-9_]{3,20}$")
CODE_RE = re.compile(r"^(sh|sz|bj|hk|us|kr)[A-Za-z0-9.]{1,12}$")
VALID_MARKETS = ("us", "hk", "a", "kr")


def db():
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    with db() as conn:
        conn.execute(
            "CREATE TABLE IF NOT EXISTS users("
            "id INTEGER PRIMARY KEY AUTOINCREMENT,"
            "username TEXT UNIQUE COLLATE NOCASE NOT NULL,"
            "pwhash TEXT NOT NULL, created INTEGER NOT NULL)")
        conn.execute(
            "CREATE TABLE IF NOT EXISTS sessions("
            "token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires INTEGER NOT NULL)")
        conn.execute(
            "CREATE TABLE IF NOT EXISTS watchlists("
            "user_id INTEGER NOT NULL, market TEXT NOT NULL, codes TEXT NOT NULL,"
            "PRIMARY KEY(user_id, market))")


def hash_pw(pw: str, salt: str = None) -> str:
    salt = salt or secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 120000).hex()
    return f"{salt}${h}"


def verify_pw(pw: str, stored: str) -> bool:
    try:
        salt, h = stored.split("$")
    except ValueError:
        return False
    calc = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 120000).hex()
    return hmac.compare_digest(calc, h)


def normalize_code(raw: str) -> str:
    """把用户输入转成腾讯接口的代码格式，如 600519 -> sh600519、AAPL -> usAAPL"""
    c = raw.strip()
    cl = c.lower()
    if re.fullmatch(r"(sh|sz|bj|hk|kr)\d+", cl):
        return cl
    # 美股接口区分大小写，ticker 必须大写；"usAAPL" 这种带前缀的写法按前缀处理
    if re.fullmatch(r"us[A-Z.]+", c):
        return "us" + c[2:]
    if re.fullmatch(r"\d{6}", cl):  # A股六位代码
        if cl[0] in "569":          # 沪市股票/ETF/B股
            return "sh" + cl
        if cl[0] in "48":           # 北交所
            return "bj" + cl
        return "sz" + cl            # 0/2/3 开头为深市
    if re.fullmatch(r"\d{1,5}", cl):  # 港股
        return "hk" + cl.zfill(5)
    if re.fullmatch(r"[a-z.]+", cl):  # 美股字母代码
        return "us" + cl.upper()
    return c


def parse_quote(code: str, raw: str):
    """解析腾讯行情返回的 ~ 分隔字段"""
    f = raw.split("~")
    if len(f) < 40 or not f[3]:
        return None

    def num(i):
        try:
            return float(f[i])
        except (ValueError, IndexError):
            return None

    market = code[:2]
    volume, amount = num(36), num(37)
    # A股返回成交量单位为手、成交额单位为万元；港股/美股为股和元。统一成股/元
    if market in ("sh", "sz", "bj"):
        volume = volume * 100 if volume is not None else None
        amount = amount * 10000 if amount is not None else None

    return {
        "code": code,
        "name": f[1],
        "currency": {"hk": "HKD", "us": "USD", "kr": "KRW"}.get(market, "CNY"),
        "price": num(3),
        "prevClose": num(4),
        "open": num(5),
        "high": num(33),
        "low": num(34),
        "change": num(31),
        "changePercent": num(32),
        "volume": volume,         # 成交量(股)
        "amount": amount,         # 成交额(元)
        "turnover": num(38),      # 换手率(%)
        "pe": num(39),            # 市盈率
        "time": f[30] if len(f) > 30 else "",
    }


def fetch_quotes(codes):
    url = QUOTE_URL.format(codes=",".join(codes))
    req = urllib.request.Request(url, headers={
        "Referer": "https://finance.qq.com/",
        "User-Agent": "Mozilla/5.0",
    })
    with urllib.request.urlopen(req, timeout=10) as resp:
        text = resp.read().decode("gbk", errors="replace")

    found = {m.group(1): m.group(2) for m in LINE_RE.finditer(text)}
    results = []
    for code in codes:
        raw = found.get(code)
        q = parse_quote(code, raw) if raw else None
        results.append(q if q else {"code": code, "error": "未找到该股票"})

    # 美股补充盘前/盘后数据（新浪源失败不影响主行情）
    us_codes = [c for c in codes if c.startswith("us")]
    if us_codes:
        ext = fetch_us_ext_cached(us_codes)
        for q in results:
            if q.get("code", "").startswith("us") and "error" not in q:
                q.update(ext.get(q["code"]) or
                         {"extPrice": None, "extChangePercent": None,
                          "extChange": None, "extTime": None, "extSession": None})
    return results


CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
}


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/quote":
            self.handle_quote(parsed)
        elif parsed.path == "/api/me":
            user = self.current_user()
            self.send_json({"user": {"username": user[1]} if user else None})
        elif parsed.path == "/api/watchlist":
            self.handle_watchlist_get(parsed)
        elif parsed.path == "/api/options-flow":
            self.send_json({
                "time": _opt_cache["time"],
                "scanned": _opt_cache["scanned"],
                "items": _opt_cache["items"],
            })
        elif parsed.path == "/api/kline":
            self.handle_kline(parsed)
        elif parsed.path == "/api/indices":
            market = parse_qs(parsed.query).get("market", [""])[0]
            self.send_json({"indices": fetch_indices(market)})
        elif parsed.path == "/api/social-top":
            try:
                self.send_json(social_top(5))
            except Exception:
                self.send_json({"top": [], "time": 0})
        elif parsed.path == "/api/analysis":
            code = parse_qs(parsed.query).get("code", [""])[0]
            if not code.startswith("us") or not CODE_RE.fullmatch(code):
                self.send_json({"error": "bad_request"}, status=400)
                return
            try:
                self.send_json(compute_analysis_cached(code))
            except Exception:
                self.send_json({"error": "analysis_unavailable"}, status=502)
        else:
            self.serve_static(parsed.path)

    def handle_kline(self, parsed):
        params = parse_qs(parsed.query)
        code = params.get("code", [""])[0]
        period = params.get("period", ["d"])[0]
        if not code.startswith("us") or not CODE_RE.fullmatch(code) or period not in KLINE_CFG:
            self.send_json({"error": "bad_request"}, status=400)
            return
        try:
            self.send_json(fetch_kline_cached(code, period))
        except Exception:
            self.send_json({"error": "kline_unavailable"}, status=502)

    def do_POST(self):
        parsed = urlparse(self.path)
        try:
            length = int(self.headers.get("Content-Length") or 0)
            body = json.loads(self.rfile.read(length) or b"{}") if length else {}
        except (ValueError, json.JSONDecodeError):
            self.send_json({"error": "bad_request"}, status=400)
            return
        if parsed.path == "/api/register":
            self.handle_register(body)
        elif parsed.path == "/api/login":
            self.handle_login(body)
        elif parsed.path == "/api/logout":
            self.handle_logout()
        elif parsed.path == "/api/watchlist":
            self.handle_watchlist_save(body)
        else:
            self.send_error(404)

    # ----- 会话 -----
    def session_token(self):
        cookie = self.headers.get("Cookie") or ""
        for part in cookie.split(";"):
            k, _, v = part.strip().partition("=")
            if k == "session":
                return v
        return None

    def current_user(self):
        """返回 (id, username) 或 None"""
        token = self.session_token()
        if not token:
            return None
        with db() as conn:
            row = conn.execute(
                "SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id "
                "WHERE s.token = ? AND s.expires > ?", (token, int(time.time()))).fetchone()
        return row

    def start_session(self, user_id):
        token = secrets.token_hex(32)
        now = int(time.time())
        with db() as conn:
            conn.execute("DELETE FROM sessions WHERE expires < ?", (now,))
            conn.execute("INSERT INTO sessions(token, user_id, expires) VALUES(?,?,?)",
                         (token, user_id, now + SESSION_TTL))
        return (f"session={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age={SESSION_TTL}")

    # ----- 账号接口 -----
    def handle_register(self, body):
        username = str(body.get("username") or "").strip()
        password = str(body.get("password") or "")
        if not USERNAME_RE.fullmatch(username):
            self.send_json({"error": "invalid_username"}, status=400)
            return
        if not 6 <= len(password) <= 64:
            self.send_json({"error": "invalid_password"}, status=400)
            return
        try:
            with db() as conn:
                cur = conn.execute("INSERT INTO users(username, pwhash, created) VALUES(?,?,?)",
                                   (username, hash_pw(password), int(time.time())))
                user_id = cur.lastrowid
        except sqlite3.IntegrityError:
            self.send_json({"error": "user_exists"}, status=409)
            return
        cookie = self.start_session(user_id)
        self.send_json({"user": {"username": username}}, cookies=[cookie])

    def handle_login(self, body):
        username = str(body.get("username") or "").strip()
        password = str(body.get("password") or "")
        with db() as conn:
            row = conn.execute("SELECT id, username, pwhash FROM users WHERE username = ?",
                               (username,)).fetchone()
        if not row or not verify_pw(password, row[2]):
            self.send_json({"error": "bad_credentials"}, status=401)
            return
        cookie = self.start_session(row[0])
        self.send_json({"user": {"username": row[1]}}, cookies=[cookie])

    def handle_logout(self):
        token = self.session_token()
        if token:
            with db() as conn:
                conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        self.send_json({"user": None},
                       cookies=["session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"])

    # ----- 自选列表接口 -----
    def handle_watchlist_get(self, parsed):
        user = self.current_user()
        if not user:
            self.send_json({"error": "not_logged_in"}, status=401)
            return
        market = parse_qs(parsed.query).get("market", [""])[0]
        if market not in VALID_MARKETS:
            self.send_json({"error": "bad_request"}, status=400)
            return
        with db() as conn:
            row = conn.execute("SELECT codes FROM watchlists WHERE user_id = ? AND market = ?",
                               (user[0], market)).fetchone()
        if not row:
            self.send_json({"codes": None, "groups": {}})
            return
        val = json.loads(row[0])
        if isinstance(val, list):  # 旧格式：纯代码列表
            self.send_json({"codes": val, "groups": {}})
        else:
            self.send_json({"codes": val.get("codes") or [],
                            "groups": val.get("groups") or {}})

    def handle_watchlist_save(self, body):
        user = self.current_user()
        if not user:
            self.send_json({"error": "not_logged_in"}, status=401)
            return
        market = body.get("market")
        codes = body.get("codes")
        groups = body.get("groups") or {}
        codes_ok = (isinstance(codes, list) and len(codes) <= 50 and
                    all(isinstance(c, str) and CODE_RE.fullmatch(c) for c in codes))
        groups_ok = (isinstance(groups, dict) and len(groups) <= 50 and
                     all(isinstance(k, str) and CODE_RE.fullmatch(k) and
                         isinstance(v, str) and 1 <= len(v) <= 20
                         for k, v in groups.items()))
        if market not in VALID_MARKETS or not codes_ok or not groups_ok:
            self.send_json({"error": "bad_request"}, status=400)
            return
        payload = json.dumps({"codes": codes, "groups": groups})
        with db() as conn:
            conn.execute(
                "INSERT INTO watchlists(user_id, market, codes) VALUES(?,?,?) "
                "ON CONFLICT(user_id, market) DO UPDATE SET codes = excluded.codes",
                (user[0], market, payload))
        self.send_json({"ok": True})

    def handle_quote(self, parsed):
        params = parse_qs(parsed.query)
        raw_codes = params.get("codes", [""])[0]
        codes = [normalize_code(c) for c in raw_codes.split(",") if c.strip()]
        if not codes:
            self.send_json({"error": "缺少 codes 参数"}, status=400)
            return
        try:
            data = fetch_quotes_cached(codes[:60])  # 指数详情页需要指数+30只权重股
            self.send_json({"quotes": data})
        except Exception as e:
            self.send_json({"error": f"行情获取失败: {e}"}, status=502)

    def serve_static(self, path):
        path = PAGE_ROUTES.get(path.rstrip("/") or "/", path)
        file = (PUBLIC_DIR / path.lstrip("/")).resolve()
        # 防止路径穿越
        if not str(file).startswith(str(PUBLIC_DIR.resolve())) or not file.is_file():
            self.send_error(404)
            return
        body = file.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", CONTENT_TYPES.get(file.suffix, "application/octet-stream"))
        self.send_header("Content-Length", str(len(body)))
        # 每次校验新鲜度，避免浏览器用启发式缓存拿旧 JS/CSS（用户无需强刷）
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(body)

    def send_json(self, obj, status=200, cookies=None):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        for c in cookies or []:
            self.send_header("Set-Cookie", c)
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt, *args):
        pass  # 安静模式，不打印每条请求日志


if __name__ == "__main__":
    init_db()
    threading.Thread(target=_ext_refresher, daemon=True).start()
    threading.Thread(target=_options_scanner, daemon=True).start()
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    print(f"股票分析网站已启动: http://localhost:{PORT}")
    print(f"  A股: http://localhost:{PORT}/a")
    print(f"  港股: http://localhost:{PORT}/hk")
    print(f"  美股: http://localhost:{PORT}/us")
    print("按 Ctrl+C 停止服务")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n服务已停止")
