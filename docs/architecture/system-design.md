# System Design

This document is the high-altitude view of how FundedEdge fits together. Read this once, then reference the data model and interface contracts when you're working on a specific component.

## Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          User's Browser                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Next.js 15 App (apps/web)                                 │ │
│  │                                                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │ Prop         │  │   Chart      │  │ Right        │    │ │
│  │  │ Dashboard    │  │   (TV Adv.)  │  │ Sidebar      │    │ │
│  │  │ (RSC + RT)   │  │  (Client)    │  │ (Mixed)      │    │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │ │
│  │         │                 │                  │            │ │
│  │  ┌──────┴─────────────────┴──────────────────┴───────┐   │ │
│  │  │  Shared State (Zustand) + TanStack Query Cache    │   │ │
│  │  └────────────────────────┬───────────────────────────┘   │ │
│  └───────────────────────────┼───────────────────────────────┘ │
└──────────────────────────────┼─────────────────────────────────┘
                               │
                  ┌────────────┴─────────────┐
                  │                          │
                  ▼                          ▼
         ┌────────────────┐        ┌──────────────────┐
         │  Vercel Edge   │        │  Supabase        │
         │  (RSC, API,    │◄──────►│  (Postgres,      │
         │   Server       │        │   Auth, Realtime,│
         │   Actions)     │        │   Storage, RLS)  │
         └───────┬────────┘        └──────────────────┘
                 │
        ┌────────┼────────────┬───────────────┐
        ▼        ▼            ▼               ▼
   ┌────────┐ ┌──────────┐ ┌─────────┐ ┌────────────┐
   │Datab.  │ │Trading   │ │ Resend  │ │  Stripe    │
   │(futures│ │View Adv. │ │ (email) │ │  (billing) │
   │ data)  │ │Charts    │ │         │ │            │
   └────────┘ │(licensed)│ └─────────┘ └────────────┘
              └──────────┘
```

## Data flow: a user opens the app

1. User hits `fundededge.com/app` in their browser
2. Next.js middleware checks Supabase session cookie. If invalid, redirects to `/login`
3. Server Component for `/app` runs on Vercel edge:
   - Queries Supabase for user's profile, accounts, current account selection
   - Streams initial HTML with the cockpit shell + initial data
4. Client Components hydrate:
   - Prop Dashboard subscribes to Supabase Realtime channel for the user's active account
   - Chart Container loads TradingView Advanced Charts library, points UDF datafeed at our API
   - Right sidebar tabs lazy-load their respective panels
5. UDF datafeed adapter (`packages/chart`) receives chart requests:
   - For historical bars: hits `/api/chart/history` → Databento → caches → returns
   - For realtime: opens WebSocket to Databento → relays bars to TradingView
6. User changes P&L (or, in v2.0, broker pushes update):
   - Mutation hits Supabase via server action
   - Postgres trigger fires Realtime event
   - All connected clients receive the update
   - Rules engine recalculates on the client, dashboard re-renders, alerts fire if thresholds crossed

## Data flow: rules evaluation

The rules engine is pure and runs in three contexts:

1. **Client (immediate UI feedback):** When the user types a new P&L value or a position size, `evaluate(state)` runs synchronously and updates the dashboard. No network round-trip.
2. **Server (notifications):** A Supabase database webhook fires on every `accounts` row change. A Vercel cron-triggered route handler runs `evaluate(state)` server-side. If a threshold is newly crossed, it queues an email/push notification via Resend.
3. **Tests (CI):** Every preset firm has fixture cases. CI runs `evaluate(state)` against thousands of inputs and asserts the verdict. Same engine, same data, same behavior.

## Authentication

- **Provider:** Supabase Auth
- **Methods:** email + password, magic link (passwordless email), Google OAuth
- **Session storage:** HTTP-only cookies (Supabase handles)
- **Server access:** `createServerClient()` from `@supabase/ssr` in RSCs and route handlers
- **Client access:** `createBrowserClient()` from `@supabase/ssr` in Client Components
- **RLS:** Every table has a policy that scopes rows to `auth.uid()`. Service role only used in dedicated server routes for cross-user system tasks.
- **Email verification:** Required for paid features. Free tier accessible immediately for activation funnel reasons (decide in Phase 4).

## State management strategy

```
                  ┌───────────────────────┐
                  │    User Interaction   │
                  └───────────┬───────────┘
                              │
              ┌───────────────┴────────────────┐
              ▼                                ▼
    ┌──────────────────┐              ┌──────────────────┐
    │  Ephemeral UI    │              │  Persisted Data  │
    │  state           │              │                  │
    │  (which tab,     │              │  (account info,  │
    │   modal open,    │              │   trades,        │
    │   form draft)    │              │   layouts)       │
    └────────┬─────────┘              └────────┬─────────┘
             │                                 │
             ▼                                 ▼
       ┌──────────┐                   ┌────────────────┐
       │ Zustand  │                   │ TanStack Query │
       │  store   │                   │  cache         │
       └──────────┘                   │     +          │
                                      │  Supabase RT   │
                                      │  subscription  │
                                      └────────┬───────┘
                                               │
                                               ▼
                                      ┌────────────────┐
                                      │   Supabase     │
                                      │   (Postgres)   │
                                      └────────────────┘
```

**Rule:** if you can't reload the page and reproduce the state, it belongs in Zustand. If you can, it belongs in TanStack Query backed by Supabase.

## Caching layers

1. **Vercel edge cache** for static assets and ISR pages (marketing site, public docs)
2. **Next.js Data Cache** for RSC fetches (revalidated by tag where it makes sense)
3. **TanStack Query cache** for client-side server state (default 30s stale, 5min cache)
4. **Module-scope memo cache** in API route handlers for hot paths (chart history, calendar)
5. **Postgres query cache** (free, automatic)

## Realtime architecture

Supabase Realtime listens to Postgres CDC. We subscribe per-user, per-table:

```typescript
useEffect(() => {
  const channel = supabase
    .channel(`account:${accountId}`)
    .on('postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'accounts', filter: `id=eq.${accountId}` },
      (payload) => queryClient.setQueryData(['account', accountId], payload.new))
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}, [accountId])
```

**Tables with Realtime enabled:** `accounts`, `trades`, `checklist_items`. Default off, opt in.

## Market data architecture

```
TradingView Charts Library (browser)
          │ UDF protocol
          ▼
/api/chart/* UDF adapter (Vercel functions, packages/chart)
          │
          ▼
Databento client (server only, packages/data)
          │
          ▼
Databento API (live + historical futures data)
```

**Symbol resolution:** UI shows "NQ" — that's an alias. The data layer resolves it to the active front-month contract (e.g., NQH26) via Databento's `definitions` instrument data, cached daily. Roll happens automatically on the second-to-last business day before expiration.

**Sessions:** ES/NQ globex hours are 5pm Sunday to 4pm Friday CT with a 1hr break daily. Session shading on the chart respects the user's configured timezone (defaults to America/New_York).

## Deployment

- **Production:** `main` branch → Vercel production deployment, custom domain
- **Preview:** Every PR → Vercel preview deployment with unique URL
- **Local:** `pnpm dev` from monorepo root → all apps run with hot reload

## Performance budgets

These fail CI when violated:

| Metric | Budget |
|---|---|
| First Contentful Paint (FCP) | < 1.0s |
| Largest Contentful Paint (LCP) | < 2.0s |
| Time to Interactive (TTI) | < 2.5s |
| Cumulative Layout Shift (CLS) | < 0.05 |
| Total Blocking Time (TBT) | < 200ms |
| Initial JS bundle (app route) | < 200kb gzipped |
| Lighthouse Performance score | > 95 |
| Lighthouse Accessibility score | 100 |

## Security

- All env vars with `NEXT_PUBLIC_` prefix are public — assume they leak. Everything else is server-only.
- RLS on every table. No `SECURITY DEFINER` functions without explicit review.
- CSP headers via `next.config.js`. No `unsafe-eval` or `unsafe-inline` (TradingView's loader is a known exception, document it).
- Rate limiting on every API route (Upstash Redis or Vercel KV)
- Input validation with Zod at every boundary
- No secrets in logs. Redact emails and account IDs in PostHog where possible.
- Stripe webhooks verified by signature
- Auth flows use PKCE where supported

## Observability

- **Sentry:** Application errors, performance traces, release tracking. Source maps uploaded on deploy.
- **PostHog:** Product analytics, funnels, session replays (with PII masking), feature flags.
- **Vercel Logs:** Server logs, function executions, edge logs.
- **Supabase Logs:** Database queries, auth events, function executions.
- **Custom dashboards:** Daily Active Traders, conversion funnels, churn — built in PostHog.

## Backups & disaster recovery

- Supabase Pro tier includes daily backups, 7-day point-in-time recovery
- Database schema lives in `packages/db/migrations/` — fully reproducible
- Export user data on demand (GDPR, CCPA)
- Account deletion soft-deletes for 30 days, hard-deletes after
