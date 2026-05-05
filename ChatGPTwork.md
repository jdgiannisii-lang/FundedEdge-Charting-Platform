# Futures Terminal Project Context (Frontend + Vercel Refactor)

## Overview

This project is a web-based trading terminal UI inspired by ICT / SMC
concepts.

The interface includes: - Price display (GC1!, NQ, ES) - Line and
candlestick charts - ICT-style checklist system - Market session tracker
(Tokyo, London, New York) - Macro ticker feed - Typewriter-style
analysis engine - Symbol switching system - Demo mode for simulated
price action

The UI layer is complete.

------------------------------------------------------------------------

## Core Objective

The system is being refactored from a frontend-dependent market data
model into a backend-driven architecture.

### Current architecture (deprecated)

Frontend: - Calls Finnhub API directly - Stores API keys in
localStorage - Uses WebSocket connections to Finnhub - Handles
authentication and data fetching

### Target architecture

Frontend: - Pure UI rendering layer - Requests normalized data from
backend API only

Backend (Vercel): - Handles all external market data requests - Stores
API keys securely - Normalizes responses - Returns unified JSON format

------------------------------------------------------------------------

## Backend Data Source

All market data is provided through a single endpoint:

https://verc-jd-s-projects2.vercel.app/api/stock?symbol=GC1!

Expected response format:

{ "c": 295.40, "o": 294.80, "h": 296.10, "l": 293.90, "pc": 294.00 }

------------------------------------------------------------------------

## Symbol Mapping

Futures symbols are mapped to ETF proxies:

GC1! -\> GLD\
NQ -\> QQQ\
ES -\> SPY

Frontend symbol mapping:

SYMBOLS = { "GC1!": { fh: "GLD" }, "NQ": { fh: "QQQ" }, "ES": { fh:
"SPY" } }

------------------------------------------------------------------------

## Removed Frontend Responsibilities

### API Key System

The following are removed entirely: - API key storage (localStorage) -
Settings UI for API keys - saveApiKey() - clearApiKey() -
toggleSettings()

Reason: backend handles all authentication.

------------------------------------------------------------------------

### Direct Market API Calls

All direct external API usage is removed: - fetchQuote() (Finnhub
version) - fetchCandles() - WebSocket connections

Also removed: - https://finnhub.io/api/v1/* - wss://ws.finnhub.io/*

------------------------------------------------------------------------

### Real-time WebSocket Layer

The entire Finnhub WebSocket system is removed: - trade streaming -
subscription logic - live tick handling

Future replacement may include backend streaming or polling.

------------------------------------------------------------------------

## New Data Layer

Single unified fetch function:

function fetchQuote(symbol){ return
fetch(`https://verc-jd-s-projects2.vercel.app/api/stock?symbol=${symbol}`)
.then(r =\> r.json()); }

------------------------------------------------------------------------

## Initialization Flow

function initData(){ setConn('loading', 'LOADING');

fetchQuote(SYMBOLS\[currentSymbol\].fh) .then(d =\> { latestPrice = d.c;
openPrice = d.o; prevClose = d.pc; dayHigh = d.h; dayLow = d.l;

      updatePriceDisplay();
      drawChart();

      setConn('live', 'LIVE');
    })
    .catch(err => {
      setConn('error', 'API ERROR');
    });

}

------------------------------------------------------------------------

## Required Frontend Stability Rules

The following systems must remain unchanged: - UI layout and styling -
Chart rendering logic - Checklist system (ICT model) - Symbol switching
logic - Macro ticker system - Session tracker - Typewriter engine - Demo
mode

------------------------------------------------------------------------

## System Architecture Summary

Frontend responsibilities: - Render UI - Display market data - Handle
user interaction - Request backend data only

Backend responsibilities: - Fetch external market data - Protect API
keys - Normalize responses - Serve unified JSON

------------------------------------------------------------------------

## Design Constraint

The frontend must not contain: - API keys - external API URLs -
authentication logic - data provider logic

The frontend only consumes backend output.

------------------------------------------------------------------------

## Future Improvements

Backend layer may be extended with: - caching system - batch symbol
requests - improved candle endpoints - rate limit handling - optional
WebSocket streaming

Optional future upgrades: - true futures data feed instead of ETF
proxies - server-side liquidity/SMC signal generation - multi-timeframe
aggregation engine
