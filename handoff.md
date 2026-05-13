# Session Handoff

**Branch:** `feat/02-s3-triggers` (PR #29 — in review)
**Date written:** 2026-05-13
**Written by:** Claude Sonnet 4.6

---

## What we are building

FundedEdge — a trading cockpit for ICT-style prop firm traders. The product helps traders stay funded by surfacing rule violations before they happen.

This session was working on **Task 02: Supabase Schema, RLS, Migrations, and Types**. Task 02 is the database foundation everything else builds on. It is broken into 14 sessions documented in `docs/tasks/02-breakdown.md`. That doc is the source of truth for what's done, what's next, and what tier runs each session.

---

## Files to read before doing anything

In this order:

1. `CLAUDE.md` — project rules, stack, architectural principles, component registry
2. `docs/tasks/02-breakdown.md` — the 14-session plan for Task 02; contains session status table
3. `docs/architecture/data-model.md` — every table, column, constraint, trigger, RLS policy, and index
4. `docs/tasks/02-supabase-schema.md` — acceptance criteria and file structure for Task 02
5. This file

---

## Current state

### Session status (from `docs/tasks/02-breakdown.md` § 6)

| Session | Status | PR | Notes |
|---------|--------|----|-------|
| S0 — Supabase project + CLI | 🟢 Done | — | Project `fundededge-prod` provisioned, CLI v2.98.2, Docker verified |
| S1 — Scaffold `packages/db` | 🟢 Done | #27 | Files created, `supabase init` run, typecheck passes |
| S2 — Migration 1 (schema) | 🟢 Done | #28 | 12 public tables, applies cleanly on fresh local DB |
| S3 — Migration 2 (triggers) | 🔵 In review | #29 | Three triggers verified locally; awaiting CI + merge |
| S4 — Migration 3 (RLS) | 🔴 Not started | — | — |
| S5–S13 | 🔴 Not started | — | — |

### What exists in `packages/db` right now

```
packages/db/
├── .gitignore
├── MIGRATIONS.md                                  # placeholder — filled in S12
├── package.json                                   # full scripts + deps
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
        └── 20260101000002_triggers.sql           # S3 — 3 trigger functions
```

### S3 verification results (already passed locally)

All four spec-mandated trigger tests confirmed:

| Trigger | Test | Result |
|---|---|---|
| `tg_create_profile` | Insert into `auth.users` | ✅ 1 profile + 1 user_preferences row |
| `tg_update_highest_balance` (up) | current 50k → 52k | ✅ highest jumped to 52000 |
| `tg_update_highest_balance` (down) | current 52k → 49k | ✅ highest stayed at 52000 |
| `tg_set_updated_at` | Update profile | ✅ updated_at advanced |

Plus `supabase db reset` applied both migrations with zero errors.

---

## Important rules carried forward

From the previous handoff — these are still in effect:

> **Claude Code rule:** When the next session to run is 🟢 Light, do NOT execute it. Instead, print the session's "Prompt to paste" block verbatim and tell the user to run it in their local Ollama model. Then stop. Only pick up again when the user confirms the Light session is done.

S5 and S7 are the upcoming 🟢 Light sessions — those get handed to Ollama.

---

## Gotchas discovered this session

1. **Migration columns differ from data-model.md naming** — when running manual verification SQL, note that the `accounts` table uses `account_type_id` (not `prop_firm_account_type_id`) and has no `broker_account_id` column. Source of truth is the actual S2 migration file or `\d public.accounts` in psql, not memory.

2. **`drop trigger if exists` produces NOTICE lines on a fresh DB** — that's fine. They prove the migration is re-runnable; on an empty DB the drops are no-ops.

3. **`security definer` triggers need `set search_path = public`** — added to `tg_create_profile` defensively so the trigger cannot be exploited by a malicious search_path. The data-model spec didn't require it but it's a Postgres-trigger best practice.

---

## Next step: S4 (yours to run — 🔴 Heavy)

**Wait for PR #29 to merge into `main` first.** Then run **S4 — Migration 3: RLS policies**.

The S4 prompt is in `docs/tasks/02-breakdown.md` § S4. Summary of what it does:

- Create `packages/db/supabase/migrations/20260101000003_rls_policies.sql`
- `alter table ... enable row level security;` on every one of the 12 public tables
- Create the policies specified in `docs/architecture/data-model.md` § RLS Policies
- Public reference tables (`prop_firms`, `prop_firm_account_types`, `economic_events`) → `for select using (true)`
- User-owned tables → `auth.uid() = user_id` (note `profiles` keyed on `id`, not `user_id` — read the schema)
- Soft-delete tables (`accounts`, `trades`, `trade_screenshots`) need `deleted_at is null` on SELECT policy
- Output a markdown cross-check table mapping each table to its policies and audit against `data-model.md` line by line before reporting done

**S4 is the most security-critical migration in the entire codebase.** A missing policy = data leak. The cross-check step is non-negotiable.

After S4 merges, the Studio security advisor warning count should drop from 37 to 0.

---

## Tier reminder for remaining sessions

| Session | Tier | Who runs it |
|---------|------|-------------|
| S4 | 🔴 Heavy | Claude Code (you) |
| S5 | 🟢 Light | **Ollama** — print prompt, stop, wait for user |
| S6 | 🟣 User | User verifies in Supabase Studio UI |
| S7 | 🟢 Light | **Ollama** — print prompt, stop, wait for user |
| S8 | 🟡 Medium | Claude Code (you) |
| S9 | 🔴 Heavy | Claude Code (you) — needs web access for prop firm research |
| S10 | 🔴 Heavy | Claude Code (you) |
| S11 | 🟡 Medium | Claude Code (you) |
| S12 | 🟡 Medium | Claude Code (you) |
| S13 | 🟣 User | User applies to production Supabase |
