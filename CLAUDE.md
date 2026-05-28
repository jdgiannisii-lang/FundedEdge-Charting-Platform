# FundedEdge — Project Context

> The trading cockpit for ICT futures traders running prop firm capital.

This file is the single source of truth for any developer (human or AI) entering this repository. Read it before writing a single line of code. If something here is wrong, fix the file before fixing the code — drift between this doc and reality is a defect.

**Live URL (legacy prototype):** https://jdgiannisii-lang.github.io/
**Live URL (production):** TBD — to be configured at fundededge.com (or chosen domain) when v1.0 ships
**Primary branch:** `main`
**Current phase:** Foundation — see `docs/roadmap.md`
**Legacy context:** the previous GC trading terminal context lives in `LEGACY.md`. It is not the product going forward but documents the v0 prototype's data layer (Vercel API, Finnhub, Twelve Data, ETF proxies) which still informs Phase 0 fallback work.

---

## What this product is

FundedEdge is a focused, opinionated trading terminal for one specific user: an ICT-style trader running a prop firm futures account on NQ, MNQ, ES, MES, or GC. The product exists to keep that trader funded by surfacing rule violations *before* they happen, integrating prop firm risk math into a polished cockpit alongside their chart, checklist, and economic context.

It is not Bloomberg. It is not TradingView. It is not Tradezella. It is the layer that sits between a trader's brain and their execution platform and says "you're 0.4 contracts away from breaching your daily loss limit — are you sure?"

**Core promise to the user:** *Help traders stay funded.*

**Wedge user:** Apex / TPT / Tradeify / Lucid evaluation and PA traders running ICT setups on NQ/ES. Every UX decision optimizes for them first.

**Anti-scope:** Broker execution, copy trading, social feeds, custom chart engines, magic prediction AI. We don't build these in v1, possibly ever.

---

## Current state vs target state

### What exists today (legacy)
A vanilla HTML + canvas prototype in `index.html` calling Vercel serverless functions for Finnhub quotes and Twelve Data candles, using ETF proxies (GLD/QQQ/SPY) for futures symbols. Hosted on GitHub Pages with API on a separate Vercel-deployed `verc` repo. Full context in `LEGACY.md`.

This is the v0 experiment. It taught us how the data layer works. **It is not the product.** The migration to the real codebase is described in `docs/tasks/01-monorepo-bootstrap.md`.

### What we are building (target)
A multi-tenant Next.js 15 SaaS application on a Turborepo monorepo, backed by Supabase, with TradingView Advanced Charts as the charting primitive, deployed on Vercel. See `docs/architecture/system-design.md` for the full picture.

---

## Repository structure (target)

```
fundededge/
├── apps/
│   ├── web/                    # Main Next.js application (the cockpit)
│   └── marketing/              # Marketing site (separate Next.js app)
├── packages/
│   ├── ui/                     # shadcn/ui components, design tokens
│   ├── rules-engine/           # Pure-TS prop firm rules engine (zero deps)
│   ├── data/                   # Data fetching, market data clients
│   ├── types/                  # Shared TypeScript types
│   ├── db/                     # Supabase types, migrations, RLS policies
│   ├── chart/                  # TradingView Advanced Charts wrapper
│   ├── config/                 # Shared tsconfig, biome config, etc.
│   └── utils/                  # Shared pure utilities
├── docs/
│   ├── architecture/           # System design, data model, ADRs
│   ├── tasks/                  # Independently-buildable component specs
│   └── standards/              # Coding, testing, design, git standards
├── .github/
│   └── workflows/              # CI/CD
├── CLAUDE.md                   # This file
├── LEGACY.md                   # GC terminal v0 context, preserved
├── README.md
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── biome.json
```

**Read these in order when starting a new session:**
1. This file (CLAUDE.md)
2. `docs/roadmap.md` — what's shipping when
3. `docs/architecture/system-design.md` — how it all fits together
4. The specific task file in `docs/tasks/` you're working on

---

## Tech stack (locked)

| Layer | Choice | Why |
|---|---|---|
| Frontend framework | Next.js 15 (App Router, RSC) | Server-side rendering for SEO + auth, edge-friendly, industry default |
| Language | TypeScript 5.x, strict mode | Non-negotiable for a production codebase |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix) | Fastest path to consistent, accessible, theme-able UI |
| Client state | Zustand | Simpler than Redux, more predictable than Context |
| Server state | TanStack Query | The right answer for cache + refetch + optimistic updates |
| Forms | React Hook Form + Zod | Performant + schema validation that matches our TS types |
| Backend | Supabase (Postgres + Auth + Realtime + Storage) | One vendor, all the primitives, generous free tier |
| Auth | Supabase Auth (email + OAuth Google) | Built-in, RLS-aware, supports magic links and OAuth |
| Database | Postgres (managed by Supabase) | Boring, proven, the right answer |
| Realtime | Supabase Realtime (Postgres CDC) | WebSocket-based, no extra infrastructure |
| Charting | TradingView Advanced Charts | Professional grade — license required for production |
| Market data (quotes) | Vercel API → Finnhub (legacy) → Databento or Polygon (v1.0) | Need live futures, not ETF proxies |
| Market data (candles) | TradingView UDF datafeed → Databento/Polygon | TV Advanced Charts uses UDF protocol |
| Economic calendar | Forex Factory scrape OR Trading Economics API | Decide in `docs/tasks/10-economic-calendar.md` |
| Hosting | Vercel | Zero-config Next.js, edge functions, preview deploys per PR |
| Email | Resend | Best DX for transactional email |
| Payments | Stripe (added in v1.x) | Industry standard |
| Error monitoring | Sentry | Battle-tested, integrates with Next.js cleanly |
| Product analytics | PostHog | Open source, generous free tier, session replay + flags |
| Build orchestration | Turborepo + pnpm | Fast incremental builds, workspace-aware caching |
| Lint + format | Biome | 10–100x faster than ESLint+Prettier, single config |
| Unit testing | Vitest | Vite-native, fast, Jest-compatible API |
| E2E testing | Playwright | The right answer in 2026 |
| Component dev | Storybook 8 | Industry standard, great DX |
| CI/CD | GitHub Actions | Free for public, generous for private |
| Versioning | Conventional Commits + Changesets | Automated changelogs, versioned packages |

**Rule: do not deviate from this stack without an ADR.** If a task seems to want a new library, write an ADR in `docs/architecture/adr/` first, get it approved, then implement.

---

## Core architectural principles

These are the rules every PR is judged against. Internalize them.

### 1. Components are independently buildable, independently shippable.
A new component lives in its own package or subdirectory, has its own tests, its own Storybook stories, and a typed public API exported through a single `index.ts`. Internal files are not importable from outside the package. If component A needs something from component B, it imports from B's public API — never from B's internals.

### 2. The rules engine is pure TypeScript with zero side effects.
`packages/rules-engine` has no DB calls, no HTTP, no React, no DOM. It takes a state object in and returns a verdict object out. This is what makes it 100% testable and what allows the same engine to run on the server for alerts and on the client for live UI feedback.

### 3. Server state is server state. Client state is client state. Don't confuse them.
Anything that originates from the database is fetched via TanStack Query and cached there. Don't put it in Zustand. Zustand is for ephemeral UI state.

### 4. RSC by default, client components when interactivity demands it.
Every component is a Server Component until proven otherwise. Add `"use client"` only when the component actually needs hooks, browser APIs, or event handlers.

### 5. RLS is the security boundary. Always.
Every Supabase query enforces row-level security. Never disable RLS to "make it work." If you need to bypass RLS for a system task, use the service role key in a server-only route handler with explicit justification in a code comment.

### 6. Every public function has a Zod schema for its input.
We validate at boundaries. Server actions, API route handlers, and external data ingestion all parse with Zod. Internal pure functions trust their TypeScript types.

### 7. No `any`. No `@ts-ignore` without an inline comment explaining why and a linked issue.
Strict mode is non-negotiable. If TypeScript is fighting you, the type model is wrong, not TypeScript.

### 8. Tests prove behavior, not implementation.
Test what the user (or calling code) experiences. The rules engine in particular gets exhaustive table-driven tests with every prop firm preset's edge cases.

### 9. The user can customize their own prop firm rules.
Presets for Apex, TPT, Tradeify, and Lucid are conveniences — the data model and engine treat custom rules as first-class.

### 10. Performance is a feature.
Every interaction targets <100ms response. Every chart load targets <1s on broadband. Every page transition targets instant. Regressions from these targets fail CI.

---

## Component registry

This is the live status of every major component. Update it in the same PR as the component itself.

| ID | Component | Location | Status | Depends On | Spec |
|---|---|---|---|---|---|
| 01 | Monorepo Bootstrap | repo root | 🟢 Done | — | `docs/tasks/01-monorepo-bootstrap.md` |
| 02 | Supabase Schema + RLS | `packages/db` | 🟢 Done | 01 | `docs/tasks/02-supabase-schema.md` |
| 03 | Auth System | `apps/web/src/` | 🟡 In progress | 01, 02 | `docs/tasks/03-auth-system.md` |
| 04 | App Shell (3-panel layout) | `apps/web/src/app/(app)` | 🔴 Not started | 01, 03 | `docs/tasks/04-app-shell.md` |
| 05 | Rules Engine | `packages/rules-engine` | 🔴 Not started | 01 | `docs/tasks/05-rules-engine.md` |
| 06 | Account Management | `apps/web/src/features/accounts` | 🔴 Not started | 02, 03, 05 | `docs/tasks/06-account-management.md` |
| 07 | Prop Dashboard Panel | `apps/web/src/features/prop-dashboard` | 🔴 Not started | 04, 05, 06 | `docs/tasks/07-prop-dashboard.md` |
| 08 | Chart Container | `packages/chart`, `apps/web/src/features/chart` | 🔴 Not started | 04 | `docs/tasks/08-chart-container.md` |
| 09 | Pre-Trade Checklist | `apps/web/src/features/checklist` | 🔴 Not started | 02, 04 | `docs/tasks/09-checklist-system.md` |
| 10 | Economic Calendar | `apps/web/src/features/calendar` | 🔴 Not started | 04 | `docs/tasks/10-economic-calendar.md` |
| 11 | Marketing Site | `apps/marketing` | 🔴 Not started | 01 | `docs/tasks/11-marketing-site.md` |

**Status legend:** 🔴 Not started · 🟡 In progress · 🔵 In review · 🟢 Done

---

## Development workflow

### Branch naming
- `feat/<task-id>-<short-description>` — new features (`feat/05-rules-engine`)
- `fix/<short-description>` — bug fixes
- `chore/<short-description>` — tooling, deps, docs
- `refactor/<short-description>` — non-behavior-changing changes

### Commit messages
Conventional Commits format. Examples:
- `feat(rules-engine): add Apex trailing drawdown calculation`
- `fix(prop-dashboard): correct daily loss display when timezone is UTC`
- `docs(architecture): add ADR for chart datafeed protocol`

### Status and sync updates
**Never commit status/sync changes in a worktree.** Updates to `docs/tasks/*` session tables, `handoff.md`, and the CLAUDE.md component registry must be committed directly to the current working branch (or included in the feature PR itself). Worktrees create isolated branches that expire without merging — the update silently disappears.

Rule: if the only files changing in a commit are `docs/`, `handoff.md`, or `CLAUDE.md`, that commit must happen on a branch that will be pushed and merged, not in an `EnterWorktree` session.

### PR checklist
Every PR must:
1. Reference its task file (`Closes docs/tasks/05-rules-engine.md`)
2. Pass CI (typecheck, lint, unit, E2E, build)
3. Include tests for new behavior
4. Update CLAUDE.md component registry status
5. Update or add a Storybook story for any UI component
6. Include a screenshot or screen recording for any UI change
7. Be reviewed and approved before merge

### Definition of done
A component is "done" when:
- All acceptance criteria in its task file are met
- Tests cover happy path + edge cases listed in the task file
- Storybook story exists (for UI components)
- Public API is documented with TSDoc
- A README.md exists in the component's directory if it's non-trivial
- The CLAUDE.md component registry is updated to 🟢
- It runs in production without errors for 48 hours

---

## Standards

See:
- `docs/standards/development.md` — code style, naming, file organization
- `docs/standards/testing.md` — what to test and how
- `docs/standards/design.md` — visual design system, tokens, density rules
- `docs/standards/git-workflow.md` — branching, PRs, releases

These are non-negotiable. If a standard is wrong, propose a change in a PR — don't ignore it.

---

## Environment variables

All env vars live in `apps/web/.env.local` (gitignored) for local dev and in Vercel project settings for production. The full list is documented in `apps/web/.env.example` (committed). Never commit a real key.

| Var | Required | Used by | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | client + server | Project URL from Supabase dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | client + server | Anon key, RLS enforced |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | server only | Bypasses RLS — use sparingly |
| `DATABENTO_API_KEY` | v1.0 | server only | Live futures data |
| `FINNHUB_KEY` | legacy | server only | Quote fallback during migration |
| `TWELVE_DATA_KEY` | legacy | server only | Candle fallback during migration |
| `RESEND_API_KEY` | yes | server only | Transactional email |
| `SENTRY_DSN` | prod | both | Error monitoring |
| `NEXT_PUBLIC_POSTHOG_KEY` | prod | client | Product analytics |
| `STRIPE_SECRET_KEY` | v1.x | server only | Added when monetization launches |
| `STRIPE_WEBHOOK_SECRET` | v1.x | server only | Stripe webhooks |
| `TRADINGVIEW_LIBRARY_LICENSE` | v1.0 | build | TV Advanced Charts license terms |

---

## Common workflows

### Starting a new feature
1. Pick a task from `docs/tasks/` that's `🔴 Not started`
2. Confirm its dependencies are `🟢 Done`
3. Create a branch: `git checkout -b feat/<id>-<name>`
4. Update component registry status to 🟡
5. Build per the task file's acceptance criteria
6. Open PR, ensure CI is green, request review
7. After merge, update registry to 🟢

### Adding a new prop firm preset
1. Add the preset to `packages/rules-engine/src/presets/<firm-slug>.ts`
2. Write the rule fixtures in `packages/rules-engine/src/presets/<firm-slug>.test.ts` covering every rule edge case
3. Add to the preset registry in `packages/rules-engine/src/presets/index.ts`
4. Update the seed data in `packages/db/seed/prop-firms.ts`
5. Update marketing copy if firm is featured

### Adding a new symbol
1. Add to `packages/data/src/symbols/index.ts` with full metadata (tick size, contract size, exchange, session hours)
2. Add to the symbol picker in `apps/web/src/features/chart/components/symbol-picker.tsx`
3. Verify the data feed supports it (Databento universe check)
4. Add a test that fetches a recent candle for it

### Diagnosing production issues
1. Check Sentry for the error
2. Check Vercel logs for the request
3. Check Supabase logs for any DB errors
4. Use PostHog session replay to see what the user did
5. If it's a data issue, check the data provider's status page
6. File an issue with reproduction steps before fixing

---

## Constraints & gotchas

### From the legacy codebase (lessons we paid for)
- **Yahoo Finance from Vercel = HTTP 429.** Datacenter IPs are blocked. Don't try to be clever.
- **Finnhub free tier excludes `/stock/candle`** — historical bars need a separate provider.
- **Twelve Data is a fine fallback** but doesn't cover real futures (NQ, ES) — only ETFs.
- See `LEGACY.md` for the full set of fallback chains, cache strategies, and symbol mapping that informed the v0 prototype.

### TradingView Advanced Charts
- **Commercial use requires a license.** We must complete TradingView's application before going to production. The free non-commercial license is fine for development.
- **Datafeed protocol is UDF.** Our `packages/chart` exposes a UDF-compliant adapter that wraps Databento.
- **Drawings and layouts are saved server-side** — schema in `packages/db` includes a `chart_layouts` table.

### Supabase
- **RLS is on by default in this project.** Never turn it off. Any cross-user query goes through a server-side route handler with the service role key.
- **Realtime requires explicit opt-in per table.** Enable in migration files, not the dashboard.
- **`auth.uid()` returns null in service role context** — pass user ID explicitly when needed.

### Futures data
- **Real futures contracts roll quarterly.** NQ → NQH26 (March), NQM26 (June), etc. Our symbol layer abstracts this — UI shows "NQ", data layer resolves to the active contract.
- **Sessions matter.** ES has overnight session (Globex), regular trading hours (RTH), and a Sunday open. Session shading on the chart respects user's broker timezone preference.
- **Tick sizes vary.** NQ = 0.25, MNQ = 0.25, ES = 0.25, MES = 0.25, GC = 0.10, MGC = 0.10. Hard-coded as data, not in business logic.

### Prop firm rules (the engine's reason for existing)
- **Trailing drawdowns differ across firms.** Apex trails until you hit the profit target then locks. TPT uses static MLL. Tradeify and Lucid have variants. Read each firm's current docs before encoding rules.
- **Consistency rules vary.** Apex PA: best day ≤ 30% of total profits. Each firm's formula is encoded explicitly with citations to the source doc in code comments.
- **Rules change.** When a firm updates rules, we update the preset and version it. Existing user accounts stay on the version they signed up under unless they opt to migrate.
- **The user can override.** Custom rules are first-class. The engine treats every account as having a `rules_config` regardless of whether it was created from a preset.

---

## Communication & decision making

### Architecture Decision Records (ADRs)
Significant architectural decisions get an ADR in `docs/architecture/adr/`. Format: `NNNN-short-name.md`. Contents: context, decision, consequences, alternatives considered. Don't argue about an architectural decision in chat — write an ADR, get it merged, point to it forever.

### Disagreements
If you (Claude or human reviewer) disagree with something in this codebase, the order of operations is:
1. Read the relevant ADR or task file to see if your concern was already addressed
2. Open an issue describing the disagreement with specific examples
3. Propose a change as an ADR or PR
4. Don't unilaterally change a documented standard

### When in doubt
The user (founder) has final say on product decisions. The standards in this repo have final say on technical decisions. When the two conflict, ask.

---

## What "done" looks like for v1.0

Read `docs/roadmap.md` for the full breakdown. Short version: a polished cockpit that lets a paid Apex/TPT/Tradeify/Lucid trader sit down before market open, configure their account, watch their NQ chart, get real-time prop rule alerts as their P&L moves, run their pre-trade checklist, and see upcoming high-impact news — all in a UI that doesn't make them feel like they're using a 2014 web app.

If we ship that in 90 days and have 100 daily active users at day 120, we've succeeded. Everything else is gravy.

---

*Last updated: this is a living document. The PR that changes the system updates this file in the same commit.*
