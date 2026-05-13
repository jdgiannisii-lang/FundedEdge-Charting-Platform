# Session Handoff

**Branch:** `feat/02-s4-rls-policies` (PR #30 — in review)
**Date written:** 2026-05-13
**Written by:** Claude Opus 4.7 (extra-high effort)

---

## What we are building

FundedEdge — a trading cockpit for ICT-style prop firm traders. The product helps traders stay funded by surfacing rule violations before they happen.

This session executed **S4 — RLS Policies**, the most security-critical migration in the entire codebase. Task 02 is broken into 14 sessions documented in `docs/tasks/02-breakdown.md`. That doc is the source of truth for what's done, what's next, and what tier runs each session.

---

## Files to read before doing anything

In this order:

1. `CLAUDE.md` — project rules, stack, architectural principles, component registry
2. `docs/tasks/02-breakdown.md` — the 14-session plan for Task 02; contains session status table
3. `docs/architecture/data-model.md` — every table, column, constraint, trigger, RLS policy, and index
4. `docs/tasks/02-supabase-schema.md` — acceptance criteria and file structure for Task 02
5. `docs/tasks/02-verify.md` — read-only end-to-end verification runbook
6. This file

---

## Current state

### Session status (from `docs/tasks/02-breakdown.md` § 6)

| Session | Status | PR | Notes |
|---------|--------|----|-------|
| S0 — Supabase project + CLI | 🟢 Done | — | Project `fundededge-prod` provisioned, CLI v2.98.2, Docker verified |
| S1 — Scaffold `packages/db` | 🟢 Done | #27 | Files created, `supabase init` run, typecheck passes |
| S2 — Migration 1 (schema) | 🟢 Done | #28 | 12 public tables, applies cleanly on fresh local DB |
| S3 — Migration 2 (triggers) | 🟢 Done | #29 | Three trigger functions verified locally; merged |
| S4 — Migration 3 (RLS) | 🔵 In review | #30 | 12 RLS-enabled tables, 19 policies, 10/10 adversarial tests pass |
| S5 — Migrations 4 + 5 | 🔴 Not started | — | 🟢 Light tier — hand to Ollama |
| S6 — Local smoke test | 🔴 Not started | — | 🟣 User — visual verification in Studio |
| S7–S13 | 🔴 Not started | — | — |

### What exists in `packages/db` right now

```
packages/db/
├── .gitignore
├── MIGRATIONS.md                                  # placeholder — filled in S12
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                                   # empty stub — filled in S8
│   └── generated/
│       └── .gitkeep                               # types.ts written here in S7
└── supabase/
    ├── .gitignore
    ├── config.toml
    └── migrations/
        ├── 20260101000001_initial_schema.sql     # S2 — 12 tables
        ├── 20260101000002_triggers.sql           # S3 — 3 trigger functions
        └── 20260101000003_rls_policies.sql       # S4 — RLS + 19 policies
```

### S4 verification results (already passed locally)

**Static checks:**
- `supabase db reset` applies all 3 migrations cleanly, zero errors
- `pg_tables.rowsecurity = true` for all 12 public tables
- `pg_policies` returns exactly 19 rows matching the per-table cross-check

**Adversarial tests — 10/10 pass:**

| # | Test | Result |
|---|---|---|
| 1 | User B reads accounts | ✅ 0 rows |
| 2 | User A reads own accounts | ✅ 1 row |
| 3 | User B insert spoofing user A's user_id | ✅ blocked |
| 4 | User B updates user A account | ✅ 0 rows affected |
| 5 | User B deletes user A account | ✅ 0 rows affected |
| 6 | Anon reads accounts | ✅ 0 rows |
| 7 | Anon reads prop_firms | ✅ unrestricted |
| 8 | Anon insert into prop_firms | ✅ blocked |
| 9 | Soft-deleted account hidden from owner | ✅ 0 rows |
| 10 | User B insert trade spoofing user A | ✅ blocked |

---

## Intentional deviations from `data-model.md` (called out in PR #30)

These need the user's explicit OK during PR review — the migration ships either way, but both can be reverted if the team disagrees.

### 1. `trades` is split into 4 policies (vs `for all` in data-model.md)

Reason: breakdown § S4 mandates `deleted_at is null` in SELECT for soft-delete tables. A `for all using (auth.uid() = user_id and deleted_at is null)` policy would block soft-deletion itself — the post-update row would fail the USING check when setting deleted_at to non-null. The split mirrors `accounts`'s 4-policy pattern with the filter only on SELECT. Names: `users see own trades`, `users insert own trades`, `users update own trades`, `users delete own trades`.

### 2. `trade_screenshots` does NOT have `deleted_at is null` filter

Reason: breakdown § S4 lists it as a soft-delete table, but the schema in `data-model.md` does not include a `deleted_at` column on this table. Including the filter would be a SQL error. Cleanup happens via FK cascade when the parent trade is hard-deleted.

---

## Important rules carried forward

> **Claude Code rule:** When the next session to run is 🟢 Light, do NOT execute it. Instead, print the session's "Prompt to paste" block verbatim and tell the user to run it in their local Ollama model. Then stop. Only pick up again when the user confirms the Light session is done.

**Next up is S5 (🟢 Light).** When the user is ready to proceed, paste the S5 prompt from `docs/tasks/02-breakdown.md` § S5 verbatim, then stop. Do not execute it from Claude Code.

---

## Gotchas discovered this session

1. **`docker exec` heredoc piping does not work on Windows** — `docker exec ... <<EOF` swallows the script. Workaround: write the SQL to a file in the host repo, then either `docker cp` it to the container OR `cat file.sql | docker exec -i ... psql ...`. The second is simpler and was used for the RLS adversarial test.

2. **`set local request.jwt.claims to '{"sub":"<uuid>"}'`** is the way to simulate an authenticated user in psql. `auth.uid()` reads from this. Use `set local role authenticated` (or `anon`) first to switch the session role to the one RLS policies are scoped to.

3. **`for all using (...)` with no `with check`** — Postgres uses the USING expression as the WITH CHECK for INSERT/UPDATE. This is the secure default, but for explicit safety the migration adds `with check (auth.uid() = user_id)` on every `for all` policy to prevent user_id rewrites on update.

4. **Soft-delete via RLS has a recovery friction point** — with `deleted_at is null` in the SELECT policy, the owner can't see their deleted rows. To recover, they need either an admin/service-role pathway to surface them, or an app-level "show deleted" view bypassed via direct ID lookup (UPDATE still works without the deleted_at filter). This is a known UX consideration for future sessions.

---

## Next step: S5 (🟢 Light — Ollama)

**Wait for PR #30 to merge into `main` first.** Then run **S5 — Migrations 4 + 5: realtime + indexes**.

This is a 🟢 Light tier session. Per the rules above, Claude Code should NOT execute this. Instead:

1. Print the S5 prompt from `docs/tasks/02-breakdown.md` § S5 verbatim
2. Tell the user to paste it into their local Ollama model
3. Stop and wait for user confirmation that S5 is done

S5 creates two short migration files:
- `20260101000004_realtime.sql` — adds `accounts` and `trades` to the realtime publication (2 lines)
- `20260101000005_indexes.sql` — copies the `create [unique] index` statements from `data-model.md` (4 indexes)

---

## Tier reminder for remaining sessions

| Session | Tier | Who runs it |
|---------|------|-------------|
| S5 | 🟢 Light | **Ollama** — print prompt, stop, wait for user |
| S6 | 🟣 User | User verifies in Supabase Studio UI |
| S7 | 🟢 Light | **Ollama** — print prompt, stop, wait for user |
| S8 | 🟡 Medium | Claude Code (you) |
| S9 | 🔴 Heavy | Claude Code (you) — needs web access for prop firm research |
| S10 | 🔴 Heavy | Claude Code (you) — exhaustive RLS test suite |
| S11 | 🟡 Medium | Claude Code (you) |
| S12 | 🟡 Medium | Claude Code (you) |
| S13 | 🟣 User | User applies to production Supabase |
