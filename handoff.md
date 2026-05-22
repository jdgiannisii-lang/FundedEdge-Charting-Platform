# Session Handoff

**Branch:** `main` (S10 complete — merged 2026-05-19 via PR #42)
**Date written:** 2026-05-22
**Written by:** FundedEdge sync agent (automated)

---

## What we are building

FundedEdge — a trading cockpit for ICT-style prop firm traders. The product helps traders stay funded by surfacing rule violations before they happen.

Task 02 (Supabase Schema + RLS + Migrations + Types) is broken into 14 independently-runnable sessions documented in `docs/tasks/02-breakdown.md`. That doc is the source of truth for session status and prompts.

---

## Files to read before doing anything

In this order:

1. `CLAUDE.md` — project rules, stack, architectural principles, component registry
2. `docs/tasks/02-breakdown.md` — 14-session plan; § 6 has the session status table
3. `docs/architecture/data-model.md` — every table, column, constraint, trigger, RLS policy, and index
4. `docs/tasks/02-supabase-schema.md` — acceptance criteria and file structure for Task 02
5. `docs/tasks/02-verify.md` — end-to-end verification runbook
6. This file

---

## Current state

### Sessions completed (S0–S10)

| Session | Status | PR | Merged |
|---------|--------|----|--------|
| S0 — Supabase project + CLI | 🟢 Done | — | — |
| S1 — Scaffold `packages/db` | 🟢 Done | #27 | 2026-05-13 |
| S2 — Migration 1 (schema, 12 tables) | 🟢 Done | #28 | 2026-05-13 |
| S3 — Migration 2 (triggers) | 🟢 Done | #29 | 2026-05-13 |
| S4 — Migration 3 (RLS, 19 policies) | 🟢 Done | #30 | 2026-05-13 |
| S5 — Migrations 4+5 (realtime + indexes) | 🟢 Done | #33 | 2026-05-14 |
| S6 — Local smoke test | 🟢 Done | — | — |
| S7 — TypeScript type generation | 🟢 Done | #39 | 2026-05-19 |
| S8 — Supabase client wrappers | 🟢 Done | #40 | 2026-05-19 |
| S9 — Prop firm seed data | 🟢 Done | #41 | 2026-05-19 |
| S10 — RLS test suite | 🟢 Done | #42 | 2026-05-19 |

### Remaining sessions

| Session | Tier | Status |
|---------|------|--------|
| S11 — CI wiring | 🟡 Medium | 🔴 Not started — **next up** |
| S12 — Docs + registry | 🟡 Medium | 🔴 Not started |
| S13 — Apply to production | 🟣 User | 🔴 Not started |

### What exists in `packages/db` right now

```
packages/db/
├── package.json
├── tsconfig.json
├── MIGRATIONS.md                                  # placeholder — filled in S12
├── src/
│   ├── index.ts                                   # exports all 3 clients
│   ├── client/
│   │   ├── browser.ts                             # createBrowserClient() via @supabase/ssr
│   │   ├── server.ts                              # createServerClient() via @supabase/ssr + next/headers (server-only)
│   │   └── service.ts                             # createServiceClient() via supabase-js (throws if called in browser)
│   └── generated/
│       └── types.ts                               # generated from local schema (S7)
└── supabase/
    ├── config.toml
    └── migrations/
        ├── 20260101000001_initial_schema.sql      # S2 — 12 public tables
        ├── 20260101000002_triggers.sql            # S3 — 3 trigger functions
        ├── 20260101000003_rls_policies.sql        # S4 — RLS + 19 policies
        ├── 20260101000004_realtime.sql            # S5 — realtime publication (accounts + trades)
        └── 20260101000005_indexes.sql             # S5 — 4 performance indexes
```

Additional files:
- `packages/db/supabase/seed/prop-firms.ts` — S9: 4 firms, 29 account types with source citations
- `packages/db/src/__tests__/rls.test.ts` — S10: 57 integration tests

---

## S10 verification results (final passed state)

**57 tests green covering:**
- Reference tables (`prop_firms`, `prop_firm_account_types`, `economic_events`): anon/authed reads allowed; user insert/update/delete blocked
- User-owned tables: own-row access allowed; cross-user select/insert/update/delete blocked
- Soft-delete tables: deleted rows invisible to owner via SELECT
- INSERT spoofing blocked on `accounts`, `trades`, `checklists`, `chart_layouts`
- Trigger `tg_create_profile`: auth.users insert → profiles + user_preferences rows created
- Trigger `tg_update_highest_balance`: monotonic high-water mark verified in both directions

**Deliberate-bug check:** commenting out the `accounts` SELECT policy broke the suite; restoring it returned all tests green.

---

## Intentional deviations from `data-model.md` (permanent record from PR #30)

### 1. `trades` uses 4 policies, not `for all`
Reason: `for all using (deleted_at is null)` would block soft-deletion itself — the post-update row fails the USING check when setting `deleted_at` to non-null. Split into 4 policies with the filter only on SELECT. Mirrors `accounts` pattern.

### 2. `trade_screenshots` has no `deleted_at is null` filter
Reason: `data-model.md` doesn't include a `deleted_at` column on this table. Cleanup via FK cascade on parent trade hard-delete.

---

## Gotchas (accumulated across S1–S10)

1. **`docker exec` heredoc piping fails on Windows** — write SQL to a host file, then `cat file.sql | docker exec -i ... psql ...`

2. **Simulating auth in psql:**
   ```sql
   set local role authenticated;
   set local request.jwt.claims to '{"sub":"<uuid>"}';
   -- auth.uid() now returns the uuid
   ```

3. **`for all using (deleted_at is null)` blocks soft-delete** — see deviation #1 above.

4. **Soft-delete recovery friction** — owner can't see deleted rows via SELECT policy. Need service-role pathway or "show deleted" UI bypass for recovery.

5. **`auth.uid()` returns null in service role context** — pass user ID explicitly when needed.

6. **Prop firm pages return HTTP 403 from cloud/CI IPs** — seed data sourced from third-party rule summaries. All values with source conflicts or extrapolated data have `// TODO: confirm with firm` comments. Last full re-verification: 2026-05-19.

7. **TypeScript 6.0 (bumped from 5.9.3 via PR #35) requires explicit type declarations for CSS side-effect imports** — added `css.d.ts` to `apps/marketing` and `apps/web` to satisfy TS2882 on `import './globals.css'`.

8. **React upgraded to v19 (PRs #34, #40)** — `react-dom` must match. Dependabot bumped `react` but left `react-dom` on 18.x, causing `ReactCurrentDispatcher` crash at build time. Fixed by aligning both to `^19`.

---

## Next step: S11 (🟡 Medium — Claude Code executes this)

**Goal:** Create `.github/workflows/db.yml` that:
- Triggers on PR (not push to main)
- Uses `supabase/setup-cli` action to spin up Supabase locally in the runner
- Runs `pnpm --filter @fundededge/db test:unit`
- Caches Docker layers and pnpm store for speed
- Has a 15-minute timeout

See `docs/tasks/02-breakdown.md` § S11 for the verbatim prompt to paste.

---

## Tier reminder for remaining sessions

| Session | Tier | Who runs it |
|---------|------|-------------|
| S11 | 🟡 Medium | Claude Code (you) |
| S12 | 🟡 Medium | Claude Code (you) |
| S13 | 🟣 User | You — applies schema to production Supabase |
