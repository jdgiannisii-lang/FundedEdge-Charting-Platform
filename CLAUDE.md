# Trading Terminal — Project Context

A personal trading terminal hosted on GitHub Pages with live quotes, historical
candles, pan/zoom charting, a setup checklist, and a live-forming candle with
countdown. Symbol switching covers Gold (GC1! via GLD ETF), Nasdaq 100 (NQ via
QQQ), and S&P 500 (ES via SPY).

Live URL: https://jdgiannisii-lang.github.io/

---

## Architecture (two-repo split)

The site uses two GitHub repositories that are **deployed separately**:

| Repo | Hosts | Deploys to |
|------|-------|------------|
| `jdgiannisii-lang/jdgiannisii-lang.github.io` (this repo) | `index.html`, `docs/index.html`, source-of-truth copy of `api/*.js` | GitHub Pages — static frontend |
| `jdgiannisii-lang/verc` | `api/stock.js`, `api/candles.js` | Vercel project `verc-jd-s-projects2` — serverless functions |

GitHub Pages cannot run serverless functions, so the API code lives in the
`verc` repo which is linked to a Vercel project. **The `api/*.js` files in
*this* repo are the canonical copy** — when they change, the same content must
be committed into `jdgiannisii-lang/verc` for the change to take effect on the
Vercel API. (Claude's GitHub MCP tools are scoped to this repo only, so writes
to `verc` must go through the GitHub web UI or the user's local clone.)

The Pages site (`index.html`) calls the Vercel API at:
- `https://verc-jd-s-projects2.vercel.app/api/stock`   — live quotes
- `https://verc-jd-s-projects2.vercel.app/api/candles` — historical OHLC

`docs/index.html` is kept identical to `index.html` for legacy reasons —
always update both together.

The Pages branch is `main`. The Claude development branch is
`claude/gc-trading-terminal-e4WEP`; merge to `main` to deploy.

---

## API endpoints

### `GET /api/stock?symbol={GLD|QQQ|SPY}`

Live quote via Finnhub `/v1/quote`. Free tier covers this endpoint.
Requires env var `FINNHUB_KEY` on the Vercel project.

Response: `{ c, o, h, l, pc, dp, t }` (current, open, high, low, prev close, day pct, trade time).

### `GET /api/candles?symbol={GLD|QQQ|SPY}&interval={…}&range={…}`

Historical OHLC bars. Multi-strategy with fallback chain — see "Data sources"
below. Requires env var `TWELVE_DATA_KEY` on the Vercel project (free signup
at twelvedata.com, 800 req/day, 8 req/min).

Response on success: `{ s:'ok', src, version, t:[], o:[], h:[], l:[], c:[], v:[] }`.

Diagnostic endpoint: `GET /api/candles?ping=1` — returns
`{ s:'ok', version, twelveDataConfigured, cacheSize }`.

---

## Data sources (candles.js fallback chain)

Yahoo Finance hard-rate-limits Vercel datacenter IPs (HTTP 429). This was the
root cause of "load failed" before we added other providers. The current chain
is:

1. **Twelve Data** (primary) — if `TWELVE_DATA_KEY` is set. Datacenter-friendly,
   covers all timeframes. Free tier: 800 req/day, 8 req/min.
2. **Yahoo Finance v8 chart, no auth** — kept as backup; usually 429 from
   Vercel IPs but may work from cold instances.
3. **Yahoo Finance with crumb auth** — handshake against `fc.yahoo.com`
   then `query1.finance.yahoo.com/v1/test/getcrumb`. Skipped on 429
   (crumb endpoint shares the same rate limit).
4. **Stooq CSV** — daily-only, no auth, very reliable. Used as fallback for
   daily timeframes (1M / 3M / 1Y) when Yahoo is blocked.

### Response cache

Module-scope cache in `candles.js`, survives across warm Vercel invocations:
- **Fresh window** (60s): identical request returns cached payload immediately.
- **Stale window** (1 hour): when ALL live sources fail, return last-known-good
  data tagged with `stale:true`.
- LRU-bounded to 60 entries.

### Crumb cache (Yahoo)

Yahoo crumb tokens live ~60 min. Cached at module scope for 50 min so warm
instances skip the 2-step handshake.

---

## Symbol mapping

The frontend uses futures-style names (GC1!, NQ, ES) that map to **ETF proxies**
(GLD, QQQ, SPY) for the actual API calls. This is because the underlying
futures aren't on Finnhub/Twelve Data free tiers — but the ETFs are, and they
track the same instruments tick-for-tick (with proxy bias).

Defined in `index.html` `SYMBOLS`:

```js
'GC1!': { fh:'GLD', ... }  // Gold via GLD
'NQ':   { fh:'QQQ', ... }  // Nasdaq 100 via QQQ
'ES':   { fh:'SPY', ... }  // S&P 500 via SPY
```

`fh` is sent to both `/api/stock` and `/api/candles` as the `symbol` parameter.
Backend whitelists `{GLD, QQQ, SPY}` — anything else returns 400.

---

## Timeframes

`TF_CONFIG` in `index.html` maps user-facing TF buttons to Twelve Data
interval/range pairs:

| Button | Interval | Range | Default visible bars |
|--------|----------|-------|----------------------|
| 1D     | 5m       | 5d    | 78  (~ last trading day) |
| 1W     | 30m      | 1mo   | 65  (~ 5 trading days)   |
| 1M     | 1d       | 6mo   | 22  (~ 1 month)          |
| 3M     | 1d       | 1y    | 65  (~ 3 months)         |
| 1Y     | 1d       | 2y    | 252 (~ 1 year)           |

**Always loads more history than is shown by default** so the user can drag-pan
back into history without re-fetching.

`INTERVAL_SECS` map provides the duration of each interval for live-candle
bucket arithmetic and the close-countdown timer.

---

## Chart engine (`renderChart` + `initChartEngine`)

### Rendering

- HiDPI canvas via `devicePixelRatio` scale.
- `CHART_PAD = { L:8, R:64, T:12, B:28 }` — right padding holds the Y-axis
  labels and the live-price tag, bottom holds X-axis time labels.
- Modes: `line` (smooth gradient fill) or `candle` (wicks + bodies, green/red).
- Grid + Y-axis with `niceSteps()` for human-readable price levels.
- X-axis time formatting via `fmtTime(t, currentTF)`.
- Live price displayed as a dashed horizontal line + gold tag on the right.
- Crosshair draws on hover with OHLC tooltip pinned to the top of the chart.

### Interactions

- **Mouse drag**: pan left/right through bar history. `applyDrag()` uses
  `CHART_PAD` directly to compute pixel-per-bar.
- **Wheel**: zoom (changes `chart.barsVisible`, range 10–`data.length`).
- **Touch**: 1-finger pan, 2-finger pinch zoom.
- `ResizeObserver` re-renders on layout changes (more reliable than
  `window.resize` because it catches grid reflow too).

### State

```js
chart = {
  data: [],          // OHLCV bars (chronological)
  offset: 0,         // bars from right edge to scroll back
  barsVisible: 78,   // zoom level
  dragging, dragX, dragOffset,
  crossX, crossY,    // crosshair position (null = no hover)
  status: 'idle' | 'loading' | 'error',
  statusMsg: string, // shown in chart pill
  reqToken: number,  // monotonic; only the latest fetch's response wins
}
```

### Race protection

`chart.reqToken` is incremented at the start of every `loadChartData()`. The
`fetch().then(...)` callback bails out unless `token === chart.reqToken` at
resolve time. This makes rapid TF/symbol switches safe — stale responses get
discarded.

### Live candle formation (`updateLiveCandle`)

Called on every 5s price poll:
- For intraday TFs: if `now`'s bucket equals the last bar's `t`, update its
  `c/h/l` in place; if `now` has rolled into a new bucket, push a new bar with
  `o = prev.c, h = max(prev.c, price), l = min(prev.c, price), c = price`.
  Skips new-bar creation when the quote is older than 15 min (market closed).
- For daily+ TFs: only updates `c/h/l`; never synthesises new bars.

### Countdown (`getCandleCountdown`)

Returns MM:SS until the next bar closes. Returns `null` for hourly+ intervals
(not useful at second precision). Drawn in the top-left of the chart.

A 1-second `setInterval(renderChart, 1000)` in `initChartEngine` keeps the
countdown ticking smoothly between price polls.

### Auto-reload (`scheduleAutoReload`)

When candles successfully load, schedule a one-shot `setTimeout` that fires 3s
after the next bucket boundary. It calls `loadChartData()` to pull the
officially-settled bar from Twelve Data, replacing our locally-synthesised
bar. The new schedule chains itself.

### Static-line fallback

If `chart.data` is empty but `lineHist` (the rolling buffer of polled prices,
capped at 200) has at least 2 points, `renderLineOnly()` draws a simple line
chart from the polling data. This means the user always sees *something*
moving, even before candles load or if the candle backend is down.

---

## Environment variables (Vercel project)

Both must be set in Production / Preview / Development:

| Var | Used by | Get one from |
|-----|---------|--------------|
| `FINNHUB_KEY`     | `api/stock.js`   | https://finnhub.io/ (free tier OK) |
| `TWELVE_DATA_KEY` | `api/candles.js` | https://twelvedata.com/ (free tier OK) |

If `TWELVE_DATA_KEY` is missing, candles fall through to Yahoo (which 429s)
and Stooq (daily only) — daily TFs will still work but intraday won't.

---

## Polling cadence

- **Quote poll**: every 5 s (`POLL_MS = 5000`) via Finnhub. Updates the price
  ticker, day H/L, P/L, gold dot, current-price line, and the live candle's
  `c/h/l`.
- **Countdown render**: every 1 s — pure visual, no network.
- **Candle reload**: scheduled at next bar close + 3 s buffer (only for
  intraday TFs).

---

## Constraints & gotchas

- **Yahoo Finance from Vercel = HTTP 429.** Don't waste time trying alternate
  Yahoo endpoints, user-agents, or hosts — Yahoo blocks the entire datacenter
  IP range. The fix is using Twelve Data (or any paid/keyed API).
- **Finnhub free tier excludes `/stock/candle`.** That's why we don't use
  Finnhub for historical bars even though the key is already configured.
- **Twelve Data interval `5d` does not exist** — we map `'5d'` → `'1day'`.
- **Twelve Data datetime is in UTC** (we pass `timezone=UTC` explicitly).
  Returned values are newest-first; we reverse to chronological order.
- **Stooq is daily-only** (no intraday on free CSV). Useful as fallback for
  1M / 3M / 1Y but cannot rescue 1D / 1W.
- **The two repos must stay in sync** for `api/*.js`. Updating only this repo
  doesn't change the live API.
- **GitHub Pages caches aggressively** — after pushing to `main`, hard-refresh
  (Ctrl+Shift+R / Cmd+Shift+R) to see frontend changes. Pages may take a few
  minutes to propagate.
- **`docs/index.html` and root `index.html`** must stay identical. Only the
  root copy is served by Pages, but tooling that scans for docs may use the
  `docs/` copy.

---

## Demo mode

If `fetchQuote` errors out (no API key, network failure, etc.), `initData()`
falls into `startDemo()` which generates synthetic price action with the
symbol's `demoStart` and `demoVol` parameters. Useful for local dev without
configured keys; the connection pill shows `DEMO MODE`.

---

## Common workflows

### Adding a new symbol

1. Add to `SYMBOLS` in `index.html` (and `docs/index.html`) with `fh:` set to
   a supported ETF ticker.
2. Add the ticker to `ALLOWED` in both `api/stock.js` and `api/candles.js`.
3. Push to *this* repo for the frontend, AND to `jdgiannisii-lang/verc` for
   the API.

### Updating the candles API

1. Edit `api/candles.js` here, commit + push (this repo).
2. Copy the same content into `jdgiannisii-lang/verc` repo's `api/candles.js`
   on its `main` branch — Vercel auto-deploys within ~30 s.
3. Verify by hitting `/api/candles?ping=1` and checking `version`.
4. Bump the `VERSION` constant when shipping behavioural changes — the
   frontend surfaces it inside error pills, which makes "is the new code live"
   diagnosable from the UI.

### Diagnosing a broken chart

The frontend's chart error pill includes the upstream source name and the
backend `version`, e.g. `HTTP 429 — yahoo: Too Many Requests [multi-strategy-v2-2026-05-06]`.
This usually identifies the issue without opening DevTools. The full `tried[]`
diagnostic array from the backend is also `console.warn`ed.
