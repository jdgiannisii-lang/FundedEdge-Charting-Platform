# Session Handoff

**Branch:** `claude/epic-carson-58v70`
**Date written:** 2026-05-13
**Written by:** Claude Sonnet 4.6 (session_011NJw2L4Ykx8JE9Vg2USf7o)

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

| Session | Status | Notes |
|---------|--------|-------|
| S0 — Supabase project + CLI | 🟡 In progress | User is doing this now (creating project on supabase.com, installing CLI on Windows, verifying Docker). Come back when user confirms `supabase --version` and `docker ps` both work. |
| S1 — Scaffold `packages/db` | 🟢 Done | All files created, `supabase init` run, typecheck passes, committed + pushed |
| S2–S13 | 🔴 Not started | — |

### What exists in `packages/db` right now

```
packages/db/
├── .gitignore                        # ignores supabase/.branches, .temp, .env
├── MIGRATIONS.md                     # placeholder — filled in S12
├── package.json                      # full scripts + deps (@supabase/ssr, supabase CLI, vitest)
├── tsconfig.json                     # extends base, excludes supabase/
├── src/
│   ├── index.ts                      # empty `export {}` stub — filled in S8
│   └── generated/
│       └── .gitkeep                  # types.ts written here in S7
└── supabase/
    ├── .gitignore                    # created by supabase init
    ├── config.toml                   # created by supabase init
    └── migrations/
        └── .gitkeep                  # empty — migrations written in S2–S5
```

### Root-level changes made this session

- `.gitignore` — added `*.tsbuildinfo` (TypeScript build artifacts were showing as untracked)
- `package.json` — added `"pnpm": { "onlyBuiltDependencies": [..., "supabase"] }` so the Supabase CLI binary downloads automatically on `pnpm install`

---

## Important rule added this session

In `docs/tasks/02-breakdown.md` § 0 (Glossary of tiers), we added:

> **Claude Code rule:** When the next session to run is 🟢 Light, do NOT execute it. Instead, print the session's "Prompt to paste" block verbatim and tell the user to run it in their local Ollama model. Then stop. Only pick up again when the user confirms the Light session is done.

**Enforce this.** The user wants to save Claude Code credits for Medium/Heavy sessions only. Light sessions (S5, S7) must be handed to Ollama.

---

## What failed / gotchas discovered

1. **`pnpm install` silently skipped the Supabase CLI binary download** — pnpm blocks postinstall scripts by default. Fixed by adding `supabase` to `pnpm.onlyBuiltDependencies` in root `package.json`. Without this, `supabase` installs as a package but the binary doesn't exist.

2. **`supabase init` does not create a `migrations/` directory** — the spec says it does but it only creates `config.toml`. Created `supabase/migrations/.gitkeep` manually.

3. **Commit message hook enforces lowercase subject** — `feat(db): S1 — scaffold...` failed commitlint because "S1" is considered sentence-case. Must use fully lowercase subjects like `feat(db): scaffold packages/db skeleton (s1)`.

4. **`supabase start` requires Docker running** — do not run `supabase start` until S6. The CLI is installed and `supabase init` is done, but the local DB stack hasn't been started yet. That's intentional per the spec.

---

## Next step: S2 (yours to run — 🔴 Heavy)

**Wait for user to confirm S0 is done first** (they're installing CLI + creating Supabase project on supabase.com right now).

Once S0 is confirmed, run **S2 — Migration 1: initial schema**.

The S2 prompt is in `docs/tasks/02-breakdown.md` § S2. Summary of what it does:

- Create `packages/db/supabase/migrations/20260101000001_initial_schema.sql`
- Include `CREATE TABLE` for every table in `docs/architecture/data-model.md` § Tables: `profiles`, `prop_firms`, `prop_firm_account_types`, `accounts`, `trades`, `trade_screenshots`, `checklists`, `checklist_items`, `checklist_runs`, `chart_layouts`, `user_preferences`, `economic_events`
- Enable `citext` extension at top of file (needed for `profiles.email`)
- **Do NOT include** triggers, RLS, realtime publication, or non-inline indexes — those are S3, S4, S5
- **Do NOT include** `subscriptions` table — deferred to v1.x
- Verify with `supabase db reset` (requires Docker + `supabase start`)

Read `docs/architecture/data-model.md` carefully before writing any SQL — every column type, constraint, and FK is specified there. If anything is ambiguous, stop and ask the user rather than guessing.

**S2 depends on `supabase start` working locally**, which requires Docker running and the Supabase project created (S0). Do not attempt S2 until the user confirms S0.

---

## Tier reminder for upcoming sessions

| Session | Tier | Who runs it |
|---------|------|-------------|
| S2 | 🔴 Heavy | Claude Code (you) |
| S3 | 🟡 Medium | Claude Code (you) |
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
