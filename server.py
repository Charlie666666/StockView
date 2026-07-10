# -*- coding: utf-8 -*-
"""
股票分析网站 - 后端服务
零依赖，仅使用 Python 标准库。运行: python server.py
行情数据来源: 腾讯财经 (qt.gtimg.cn)，支持 A股 / 港股 / 美股
"""
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import threading
import time
import urllib.error
import urllib.request
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
CODE_RE = re.compile(r"^(sh|sz|bj|hk|us)[A-Za-z0-9.]{1,12}$")
VALID_MARKETS = ("us", "hk", "a")


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
    if re.fullmatch(r"(sh|sz|bj|hk)\d+", cl):
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
        "currency": {"hk": "HKD", "us": "USD"}.get(market, "CNY"),
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
        else:
            self.serve_static(parsed.path)

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
