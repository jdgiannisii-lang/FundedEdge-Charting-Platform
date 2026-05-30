# FundedEdge Roadmap

This roadmap is the source of truth for what ships when. It's intentionally aggressive on v1.0 and intentionally conservative on everything after — we ship the cockpit, get users, then expand based on what they actually use.

**North star metric:** Daily Active Traders (DAT) — users who open the app on a US trading day and interact with it.

**Day 0:** Monday after this doc is committed.
**Day 90 target:** v1.0 in production with paying users (or actively converting beta users).
**Day 120 target:** 100 DAT.

---

## Phase 0 — Foundation (Days 1–14)

Goal: scaffolding so every component after this can be built without friction.

| ID | Deliverable | Days |
|---|---|---|
| 01 | Monorepo bootstrap (Turborepo, pnpm, Next.js 15 app, packages skeleton, Biome, Vitest, Playwright, Storybook, GitHub Actions CI) | 1–3 |
| 02 | Supabase schema + RLS + migrations + seed data + types generation | 4–7 |
| 03 | Auth system (email + magic link + Google OAuth, session management, protected routes) | 8–11 |
| - | Vercel deployment + preview deploy per PR | 12 |
| - | Sentry + PostHog + Resend integrated | 13 |

**Exit criteria for Phase 0:**
- A user can sign up, log in, log out
- The protected `/app` route requires auth and shows an empty shell
- CI runs typecheck, lint, unit, E2E, and build on every PR
- Preview deploys work on every PR
- Sentry catches an intentional error in production

---

## Phase 1 — Cockpit Shell (Days 15–35)

Goal: the visual product without the dynamic dashboard logic.

| ID | Deliverable | Days |
|---|---|---|
| 04 | App shell — 3-panel responsive layout, dark + light mode, panel collapse/resize, Stripe-style design with glass effects | 15–22 |
| 08 | Chart container — TradingView Advanced Charts integration, symbol switching (NQ, MNQ, ES, MES, GC), timeframe controls, layout persistence | 23–35 |

**Exit criteria for Phase 1:**
- User logs in, sees the cockpit, switches between NQ/ES, changes timeframes, draws on the chart, and the drawings persist across sessions
- Both light and dark mode look polished
- Mobile shows a "this product is desktop-only for now" landing page

---

## Phase 2 — Rules Engine + Prop Dashboard (Days 36–55)

Goal: the differentiator. The reason FundedEdge exists.

| ID | Deliverable | Days |
|---|---|---|
| 05 | Rules engine — pure TS package with presets for Apex, TPT, Tradeify, Lucid + custom rules support, exhaustive tests | 36–46 |
| 06 | Account management — UI to create/edit/delete prop firm accounts, configure rules from preset or custom | 47–51 |
| 07 | Prop dashboard panel — live calculations, alerts, "X until breach" displays | 52–55 |

**Exit criteria for Phase 2:**
- A user creates an Apex 50K account, enters their starting balance and current P&L, and sees their trailing drawdown calculated correctly
- The dashboard updates in real time as P&L changes (manually entered for now — broker integration is v2)
- Alerts fire visually when within configurable thresholds of any rule
- All preset firms have rule fixtures matching their published documentation
- The engine handles custom rule combinations the user defines

---

## Phase 3 — Workflow Tools (Days 56–75)

Goal: the daily ritual.

| ID | Deliverable | Days |
|---|---|---|
| 09 | Pre-trade checklist — customizable rule sets, pre-built ICT templates, persists per-account | 56–63 |
| 10 | Economic calendar — high-impact events, CPI/FOMC countdowns, news risk warnings tied to chart | 64–70 |
| - | Settings page — preferences, theme, timezone, notifications | 71–73 |
| - | Onboarding flow — first-run wizard that gets a new user from signup to configured account in under 3 minutes | 74–75 |

**Exit criteria for Phase 3:**
- A new user signs up and completes onboarding (account configured, first checklist set, calendar visible) in < 3 minutes
- Checklist persistence works across sessions and accounts
- Calendar shows the next 7 days of high-impact events with countdowns

---

## Phase 4 — Polish + Marketing + Launch (Days 76–90)

Goal: production-ready.

| Deliverable | Days |
|---|---|
| Custom domain (fundededge.com) wired to Vercel production deployment | 76 |
| Brand assets — logo, favicon, OG image, colour tokens finalised | 76 |
| Performance audit — Lighthouse 95+ on all pages, web-vitals green | 77–78 |
| Marketing site (apps/marketing) — landing page, pricing, FAQ, blog scaffold | 79–84 |
| Beta program — invite list, beta user feedback loop, analytics review | 85–87 |
| Pricing decision — freemium tiers vs single price, configured in Stripe (or deferred) | 88 |
| Launch on r/Daytrading, r/FuturesTrading, ICT Discords, Topstep + Apex communities | 89–90 |

**Exit criteria for Phase 4:**
- v1.0 is live at fundededge.com (or chosen domain)
- 50+ users signed up
- Sub-second page loads on broadband
- Zero P0/P1 bugs in Sentry over 7 days

---

## v1.1 — Journal (Days 91–120)

Goal: retention.

The journal is the feature that turns a one-time visitor into a daily user. Trade logs, screenshot uploads, emotional state tracking, tag-based filtering, basic analytics (winrate by setup, by session, by day-of-week).

This is also when we add **broker read-only integration** (Tradovate API) for the firms that support it, so trades auto-populate instead of requiring manual entry.

**Target:** 100 DAT by day 120.

---

## v1.2 — AI Assistant (Days 121–150)

Goal: the marketing moat.

Context-aware AI sidekick using Anthropic's API. Features:
- "Was this trade allowed under my rules?"
- "What's my win rate after two consecutive losses on NQ during London open?"
- "Review this week's journal entries and tell me what I'm doing differently."

The AI is a *risk manager and journal analyst*, not a market predictor. We never let it tell users what to trade.

---

## v2.0 — Broker Integration (Days 151+)

Goal: removing manual P&L entry.

Read-only integrations with:
- Tradovate (Apex, TPT, Tradeify, Lucid all use it)
- NinjaTrader (where APIs exist)
- Rithmic (where APIs exist)

Live position pull, live P&L pull, automatic trade journaling. We never execute trades — the user keeps that in their broker. We only read.

---

## What we are deliberately not building

These are tempting and we will say no until we have evidence we should:

- **Custom chart engine** (use TradingView)
- **Trade execution** (broker, not us)
- **Copy trading / signals**
- **Social feed / community features**
- **Mobile native app** (responsive web only for now, mobile maybe in year 2)
- **Custom indicators marketplace**
- **Backtesting engine**
- **Prop firm leaderboard**

If a user asks for one of these, we say "not yet, here's why" and add it to the wishlist.

---

## Decision points we've deferred

| Decision | When we decide | Default if no decision made |
|---|---|---|
| Pricing model (freemium vs paid trial) | Day 75 | Free during beta, $29/mo single tier at launch |
| Domain name | Day 30 | fundededge.com |
| Live futures data provider | Day 30 | Databento (per-user pricing) or Polygon (flat rate) |
| Mobile responsive vs desktop-only | Day 60 | Desktop-only for v1.0 |
| When to open source any of it | Year 2 | Stay closed |
