# StockView

A lightweight, multi-market stock market dashboard built with **Python standard libraries**, **vanilla JavaScript**, **HTML**, **CSS**, and **SQLite**.

StockView provides real-time market data, interactive candlestick charts, quantitative stock analysis, options flow, retail-sentiment signals, sector views, news, and user authentication across **U.S. stocks, Korean stocks, Hong Kong stocks, and A-shares** — with a five-language interface.

> Live demo: `http://47.80.6.12/`

## Features

### Multi-Market Support

StockView supports multiple equity markets, each on its own page (ordered US → KR → HK → A):

* **U.S. stocks** — with market indices (S&P 500, Nasdaq 100, Dow Jones, Nasdaq Composite), a sector heatmap, options flow, and full per-stock analysis
* **Korean stocks** — with KOSPI and KOSDAQ indices
* **Hong Kong stocks**
* **A-shares** — Shanghai, Shenzhen, and Beijing exchanges

The backend normalizes stock symbols across different markets and converts market-specific quote formats into a consistent internal structure.

### Real-Time Market Quotes

Quote data includes information such as:

* Current price
* Price change
* Percentage change
* Previous close
* Open
* High
* Low
* Volume
* Turnover / traded amount
* P/E ratio
* Quote timestamp

### Extended-Hours U.S. Market Data

StockView includes support for U.S. extended-hours data, including pre-market and after-hours sessions.

The backend uses a background refresh mechanism and cached market data to reduce request latency and avoid blocking user requests when upstream providers are slow or temporarily unavailable.

The U.S. page also shows the current trading session (pre-market, regular, after-hours, overnight, or closed) and timestamps quotes in U.S. Eastern time.

### Candlestick Charts & Technical Indicators

Clicking a watchlist stock opens an interactive candlestick chart with:

* Timeframes: 1-minute, 5-minute, 15-minute, daily, weekly, monthly, and yearly
* Overlays: moving averages (MA5 / MA10 / MA20 / MA60) and Bollinger Bands
* Dedicated MACD and volume sub-panels
* Crosshair readouts, mouse-wheel zoom, and drag-to-pan

The charting engine is written from scratch on an HTML canvas — no third-party charting library.

### Individual Stock Analysis

Each U.S. stock includes a quantitative analysis panel:

* A weighted composite score (−100 to +100) with a short-term verdict (Strongly Bullish → Neutral → Strongly Bearish)
* A signal breakdown across MACD, RSI (14 and 6), KDJ, Bollinger Bands, moving-average alignment, volume ratio, and momentum
* Support and resistance levels

### Options Flow

* A market-wide **unusual options** page that scans active tickers and flags large, likely-new-position contracts using volume, premium, and volume/open-interest filters
* Per-stock options analytics: put/call ratio, max pain, at-the-money implied volatility, and unusual-contract detection
* A homepage highlight strip showing the day's largest call and put

### Retail Sentiment & Social Buzz

* Reddit mention counts and 24-hour trend per stock
* A composite **retail sentiment** read (bullish / bearish / mixed) derived from mention trends, options positioning, and price momentum
* A homepage **Reddit Buzz Top 5** ranking of the most-mentioned tickers
* Short-interest data (days to cover, shares short, and percentage of float)

> Note: X/Twitter no longer offers a free public API, so retail attention is measured via Reddit.

### Recent News

Each U.S. stock shows major news from the past 48 hours. Every item is tagged with its source, U.S. Eastern time, a relative timestamp (for example, "15m ago"), and a link to the original article.

### Multi-Language Interface

The entire interface is available in five languages — English, Korean, Japanese, Simplified Chinese, and Traditional Chinese — switchable from any page. English is the default.

### Watchlists

Users can:

* Add and remove stocks
* Reorder stocks by drag-and-drop
* Organize stocks into custom-named groups and filter by group
* Save watchlists
* Synchronize watchlists across devices through authenticated accounts

Watchlist data is persisted with SQLite. Signed-out users keep a local watchlist in the browser, which is migrated to their account on first sign-in.

### User Authentication

StockView includes a lightweight authentication system with:

* User registration
* User login
* Session-based authentication
* Password hashing with PBKDF2-HMAC-SHA256
* Random password salts
* Cryptographically secure session tokens
* HTTP-only session cookies

### Sector Views

A dedicated sector page presents a heatmap of the 11 S&P 500 GICS sectors plus 20+ industry and thematic groups (semiconductors, software, biotech, airlines, uranium, China internet, and more), with a session-aware strength/weakness summary. A compact heatmap of key industries also appears on the U.S. homepage.

### Responsive Frontend

The frontend is built with:

* Vanilla JavaScript
* HTML
* CSS

No frontend framework is required.

## Architecture

```text
Browser
   |
   v
StockView Python HTTP Server
   |
   +-- Static frontend
   |
   +-- REST-style API endpoints
   |
   +-- Authentication and sessions
   |
   +-- SQLite persistence
   |
   +-- Quote normalization
   |
   +-- In-memory caching
   |
   +-- Background refresh workers
   |
   +--> Tencent market data (quotes: US / KR / HK / A)
   +--> Sina market data (US extended hours)
   +--> Yahoo Finance (extended hours, indices, candlesticks, short interest, news)
   +--> CBOE delayed options chains (options flow & analytics)
   +--> ApeWisdom (Reddit mention counts)
```

## Technology Stack

### Backend

* Python 3
* `http.server`
* `urllib`
* `sqlite3`
* `hashlib`
* `hmac`
* `secrets`
* `threading`

### Frontend

* HTML
* CSS
* Vanilla JavaScript

### Storage

* SQLite

### Deployment

* Docker

## Project Structure

```text
StockView/
├── server.py
├── Dockerfile
├── README.md
├── data.db
└── public/
    ├── us.html            # U.S. page (indices, heatmap, options, charts, analysis)
    ├── kr.html            # Korean page (KOSPI / KOSDAQ)
    ├── hk.html            # Hong Kong page
    ├── a.html             # A-shares page
    ├── sectors.html       # Sector heatmap page
    ├── options.html       # Unusual options page
    ├── app-us.js          # U.S. page logic (charts, analysis, options, sentiment, news)
    ├── app.js             # Shared logic for KR / HK / A pages
    ├── app-sectors.js
    ├── app-options.js
    ├── chart.js           # Canvas candlestick-charting engine
    ├── auth.js            # Auth + login/registration UI
    ├── sectors-data.js
    └── style.css
```

> Note: For production use, the SQLite database should not be committed to the repository. Store it outside version control and use persistent storage when deploying with containers.

## Running Locally

### Requirements

* Python 3.10+ recommended

No third-party Python packages are required for the core server.

### Start the Server

Clone the repository:

```bash
git clone https://github.com/Charlie666666/StockView.git
cd StockView
```

Run the application:

```bash
python server.py
```

Then open the local address printed by the server in your browser.

Depending on the configured port, the application will typically be available at:

```text
http://localhost:8000
```

## Running with Docker

Build the image:

```bash
docker build -t stockview .
```

Run the container:

```bash
docker run -p 8000:8000 stockview
```

Then open:

```text
http://localhost:8000
```

For persistent user and watchlist data, mount the database location to persistent storage rather than relying on the container filesystem.

## Design Goals

StockView is designed around several principles:

* Minimal external dependencies
* Lightweight deployment
* Multi-market compatibility
* Consistent quote normalization
* Graceful upstream failure handling
* Low-latency cached reads
* Simple and transparent architecture

A key goal of the project is to demonstrate how a functional market dashboard can be built without relying on large backend or frontend frameworks.

## Data Reliability

Market data is retrieved from third-party upstream providers. Availability, latency, field definitions, session coverage, and quote accuracy may vary between providers and markets.

The application uses normalization, caching, fallback logic, and background refresh mechanisms to improve resilience, but uninterrupted real-time data is not guaranteed.

## Security Notes

Before using StockView in a public production environment, the following practices are strongly recommended:

* Deploy behind HTTPS
* Mark authentication cookies as `Secure`
* Add rate limiting to login and registration endpoints
* Limit maximum request body sizes
* Keep SQLite database files out of Git
* Rotate or invalidate exposed sessions when necessary
* Use persistent storage for production databases
* Add structured server-side logging and monitoring
* Avoid returning raw internal exception details to clients

## Roadmap

Potential future improvements include:

* Candlestick charts and analysis for the Korean, Hong Kong, and A-share markets
* Additional technical indicators (for example, RSI and KDJ sub-panels on the chart)
* Real-time (sub-minute) data feeds and true overnight-session pricing
* Price and unusual-options alerts
* Search and symbol discovery improvements
* Stronger API rate limiting
* Modular backend architecture
* Structured observability
* Automated testing
* CI/CD workflows
* Production-grade HTTPS deployment

## Disclaimer

StockView is an educational and research-oriented project.

Market data displayed by the application may be delayed, incomplete, inaccurate, or unavailable. Nothing in this project constitutes financial, investment, trading, or legal advice.

## License

No license has currently been specified. Add a license before allowing third parties to reuse, modify, or redistribute the project.
