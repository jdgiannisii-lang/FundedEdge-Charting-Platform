# Task 08: Chart Container — TradingView Advanced Charts

## Goal
The center panel. Embed TradingView Advanced Charts with our UDF-compliant datafeed pulling from Databento (or fallback during dev), with symbol picker (NQ/MNQ/ES/MES/GC), timeframe controls, layout persistence, and theme integration.

## Out of scope
- Custom ICT overlays (post-launch enhancement)
- Backtesting / replay (deferred)
- Volume profile (deferred unless TV provides for free)

## Dependencies
- Task 04
- TradingView Advanced Charts license application started (Day 1!)
- Databento (or fallback) API key

## Acceptance criteria

- [ ] TradingView Charting Library loaded and rendering in the center panel
- [ ] Symbol switching: NQ, MNQ, ES, MES, GC (front-month resolution handled internally)
- [ ] Timeframes: 1m, 5m, 15m, 30m, 1h, 4h, 1D, 1W
- [ ] Light + dark theme matches app theme
- [ ] User's drawings and indicators persist (saved to `chart_layouts` table on debounced change)
- [ ] Layout loads on cockpit open
- [ ] Loading state while library + history fetch
- [ ] Error state if data feed fails (with retry CTA)
- [ ] Quote ticker in top bar updates live: bid/ask/last/change
- [ ] Symbol session shading (Globex / RTH) honors user timezone preference
- [ ] No layout shift when chart loads
- [ ] Bundle: chart code lazy-loaded only on cockpit route

## Files to create

```
packages/chart/
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── index.ts
│   ├── component.tsx
│   ├── client.tsx
│   ├── datafeed/
│   │   ├── udf-adapter.ts
│   │   ├── symbol-resolver.ts
│   │   └── streaming.ts
│   ├── theme.ts
│   └── types.ts

packages/data/
├── package.json
└── src/
    ├── index.ts
    ├── databento/
    │   ├── client.ts
    │   ├── candles.ts
    │   └── stream.ts
    ├── symbols/
    │   ├── index.ts
    │   └── front-month.ts
    └── cache.ts

apps/web/src/
├── app/
│   └── api/
│       └── chart/
│           ├── config/route.ts
│           ├── symbols/route.ts
│           ├── search/route.ts
│           └── history/route.ts
└── features/chart/
    ├── components/
    │   ├── chart-container.tsx
    │   ├── symbol-picker.tsx
    │   ├── timeframe-picker.tsx
    │   └── quote-ticker.tsx
    ├── hooks/
    │   └── use-chart-layout.ts
    └── index.ts
```

## Implementation notes

### TradingView library hosting

The library files (~3MB) live in `apps/web/public/charting_library/` (gitignored). Download from TradingView after license approval. Document install steps in `packages/chart/README.md`.

### UDF adapter

```typescript
export function createUdfDatafeed(opts: { baseUrl: string; theme: 'light' | 'dark' }) {
  return {
    onReady: (cb) => fetch(`${opts.baseUrl}/api/chart/config`).then(r => r.json()).then(cb),
    searchSymbols: async (input, exchange, type, cb) => {
      const r = await fetch(`${opts.baseUrl}/api/chart/search?query=${encodeURIComponent(input)}`)
      cb(await r.json())
    },
    resolveSymbol: async (symbolName, onResolve, onError) => {
      try {
        const r = await fetch(`${opts.baseUrl}/api/chart/symbols?symbol=${symbolName}`)
        onResolve(await r.json())
      } catch (e) { onError(String(e)) }
    },
    getBars: async (symbolInfo, resolution, periodParams, onResult, onError) => {
      try {
        const url = `${opts.baseUrl}/api/chart/history?symbol=${symbolInfo.ticker}&resolution=${resolution}&from=${periodParams.from}&to=${periodParams.to}`
        const r = await fetch(url)
        const { bars, noData } = await r.json()
        onResult(bars, { noData })
      } catch (e) { onError(String(e)) }
    },
    subscribeBars: (symbolInfo, resolution, onTick) => { /* WS to /api/chart/stream */ },
    unsubscribeBars: () => { /* close WS */ },
  }
}
```

### Layout persistence

```typescript
export function useChartLayout(widget: TradingView.Widget | null, accountId: string | null) {
  const debouncedSave = useDebouncedCallback(async (content: unknown) => {
    if (!accountId) return
    await saveLayoutAction({ accountId, content })
  }, 1000)

  useEffect(() => {
    if (!widget) return
    widget.subscribe('drawing_event', () => widget.save((c) => debouncedSave(c)))
    widget.subscribe('study', () => widget.save((c) => debouncedSave(c)))
  }, [widget, debouncedSave])
}
```

### Front-month roll

```typescript
export function frontMonth(symbolAlias: 'NQ' | 'ES' | 'MNQ' | 'MES' | 'GC', date: Date = new Date()): string {
  // CME equity index futures roll second-to-last business day before contract month
  // GC rolls on last business day of month before delivery month
  // Return e.g., "NQH26"
}
```

### Cost mitigation

Databento costs scale per user. For pre-revenue, use a single shared API key with aggressive server-side caching:
- Historical candles cached for the duration of the bar (5min cache for 5min bars)
- Live streams pooled — one upstream WS per symbol, fanned out to all users via Supabase Broadcast or a server-side pub/sub

## Testing requirements

- Playwright: chart loads, symbol switches, timeframe switches, drawing persists across reload
- Vitest: front-month resolver covers calendar edge cases
- Vitest: UDF adapter handles error cases (network down, no data, etc.)

## Definition of done

- [ ] All acceptance criteria checked
- [ ] TradingView commercial license signed
- [ ] Live data confirmed flowing during US trading hours
- [ ] Bundle size for chart route < 1.5MB gzipped
- [ ] CLAUDE.md component registry updated: 08 → 🟢 Done
