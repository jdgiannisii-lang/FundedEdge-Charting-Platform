# ADR 0003: TradingView Advanced Charts for v1, custom engine deferred

**Date:** 2026-Day-0
**Status:** Accepted

## Context

The chart is the centerpiece of the cockpit. Traders spend hours staring at it. The bar for "good enough" is high — they're comparing to TradingView itself. We need:

- All standard indicators (MAs, RSI, MACD, etc.)
- Drawing tools (trend lines, FVG rectangles, fib retracements)
- Multiple timeframes
- Live data
- Layout persistence
- Smooth pan/zoom

Building this from scratch is months of work.

## Decision

**v1.0:** TradingView Advanced Charts (Charting Library). Apply for the free non-commercial license for development; pay for commercial license when going to production.

**v2.0+:** Build a custom engine *only if* we hit a wall on TradingView extensibility — specifically, if FVG/order block detection requires custom drawing primitives TradingView won't expose.

## Alternatives considered

- **TradingView Lightweight Charts (free, MIT)** — beautiful API but bare-bones. We'd build all indicators and drawing tools ourselves. Months of work.
- **Highcharts Stock** — expensive, ugly, dated.
- **ECharts / Apache** — capable but not specialized for finance.
- **Custom canvas (current legacy approach)** — full control, but we'd be in chart-engine R&D for 3+ months. Wrong tradeoff for shipping in 90 days.

## Consequences

**Good:**
- Industry-standard chart that traders already know
- Every indicator and drawing tool included
- Layout serialization built in (we save to `chart_layouts` table)
- Drawing tools persist out of the box
- Performance is excellent

**Bad:**
- Commercial license cost (negotiated, usually small for early stage)
- Application process delays go-live by 1–3 weeks — start the application Day 1
- Bundle size hit (~1MB) — mitigated by code-splitting; chart only loads in cockpit route
- Customization limits — the `paneOverlay` API exists but is constrained
- We don't own the chart — TradingView's roadmap is theirs

## Mitigations

- Start the TradingView application immediately on Day 1
- Wrap the chart in `packages/chart` with our own typed API so swapping to a custom engine later is contained
- Build any FVG/order-block overlays as separate canvas layers on top of TradingView, not via TV's drawing API, so they're portable

## Implementation notes

See `docs/tasks/08-chart-container.md`.
