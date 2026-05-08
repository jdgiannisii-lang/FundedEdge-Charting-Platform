# Task 10: Economic Calendar

## Goal
Right-sidebar tab. Show high-impact upcoming events (CPI, FOMC, NFP, etc.) with countdowns. Warn user when entering a "news risk window" tied to their active account's news-trading rule (if any).

## Dependencies
- Task 02, 04

## Acceptance criteria

- [ ] List of upcoming events for next 7 days, sorted by time
- [ ] Filter by impact level (high default; medium / low optional)
- [ ] Filter by currency (USD default for futures traders)
- [ ] Each event shows: name, country, impact badge, scheduled time, time until, forecast/previous if available
- [ ] Banner alert when within news_trading restriction window
- [ ] Source: Forex Factory scraping (free, reliable) → backed up by Trading Economics or Finnhub calendar
- [ ] Cron job updates `economic_events` daily at 00:00 UTC
- [ ] Read-only for users; service role refreshes

## Files to create

```
apps/web/src/
├── app/
│   └── api/
│       └── jobs/
│           └── refresh-calendar/route.ts
└── features/calendar/
    ├── components/
    │   ├── calendar-panel.tsx
    │   ├── event-row.tsx
    │   ├── impact-badge.tsx
    │   ├── countdown.tsx
    │   ├── news-risk-banner.tsx
    │   └── filters.tsx
    ├── lib/
    │   ├── ff-scraper.ts
    │   └── normalize.ts
    ├── queries.ts
    └── index.ts
```

## Implementation notes

### Source choice

Forex Factory has been the de-facto free source forever. Their HTML structure is stable. We scrape, parse, and normalize. Note: their TOS prohibits redistribution, so we're in a gray area for SaaS — the safer long-term move is to negotiate a license or switch to Trading Economics ($X/mo) once we have revenue. Document this risk in the task.

### Vercel cron

```json
{
  "crons": [
    { "path": "/api/jobs/refresh-calendar", "schedule": "0 0 * * *" }
  ]
}
```

### News risk banner

When current time is within `news_trading.restriction_window_minutes_before` of any high-impact event matching the user's selected currencies, show a banner: "FOMC in 12 minutes. News-trading restricted on this account."

## Testing requirements
- Vitest: scraper handles malformed HTML gracefully
- Playwright: events render, filters work, countdown updates

## Definition of done
- [ ] All acceptance criteria checked
- [ ] Cron job verified running in production
- [ ] CLAUDE.md component registry updated: 10 → 🟢 Done
