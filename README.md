# StockView

A lightweight, multi-market stock market dashboard built with **Python standard libraries**, **vanilla JavaScript**, **HTML**, **CSS**, and **SQLite**.

StockView provides real-time market data, watchlist management, sector views, options tools, and user authentication across **A-shares, Hong Kong stocks, and U.S. stocks**.

> Live demo: `http://47.80.6.12/`

## Features

### Multi-Market Support

StockView supports multiple equity markets:

* **A-shares** — Shanghai, Shenzhen, and Beijing exchanges
* **Hong Kong stocks**
* **U.S. stocks**

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

### Watchlists

Users can:

* Add and remove stocks
* Organize stocks into groups
* Save watchlists
* Synchronize watchlists through authenticated accounts

Watchlist data is persisted with SQLite.

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

Dedicated sector pages provide a structured way to explore groups of related stocks and market themes.

### Options Tools

The project includes an options-focused interface and backend scanning functionality for options-related market analysis.

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
   +--> Tencent market data
   +--> Sina market data
   +--> Yahoo fallback data
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
    ├── a.html
    ├── hk.html
    ├── us.html
    ├── sectors.html
    ├── options.html
    ├── app.js
    ├── app-us.js
    ├── app-sectors.js
    ├── app-options.js
    ├── auth.js
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

* Candlestick charts
* Additional technical indicators
* Improved options analytics
* More advanced watchlist tools
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
