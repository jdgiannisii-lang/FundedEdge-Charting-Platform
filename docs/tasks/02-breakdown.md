# Task 02 — Session Breakdown

> Task 02 (Supabase Schema, RLS, Migrations, and Types) is large, security-critical, and touches many files. This document splits it into **14 independently-runnable sessions** so each one is small enough to finish in a single chat, fail safely, and be done by the right tier of model — or by you when human action is required.
>
> **Read this whole document before starting.** Each session links to the one before and after. Don't skip ahead — Session 7 depends on Session 6 having actually been verified.

---

## 0. Glossary of tiers

| Tier | Who runs it | Use for |
|------|-------------|--------|
| 🟣 **User** | You, in a browser / terminal | Account creation, secret handling, anything that can't be code-reviewed |
| 🟢 **Light** | Local model (Ollama: `qwen2.5-coder:14b`, `deepseek-coder-v2`, or cloud `nemotron-3-super`) via OpenCode | Mechanical scaffolding, file creation from exact templates, running CLI commands. No architecture, no security code. |
| 🟡 **Medium** | Claude Sonnet 4.6 in Claude Code | Code with judgment but not novel design: client wrappers, docs, CI wiring, test scaffolds. |
| 🔴 **Heavy** | Claude Sonnet 4.6 (default) or Opus 4.7 (when explicitly hard) in Claude Code | Schema design, RLS policies, RLS test suite, prop firm rules research. Anything where being wrong = data leak. |

**Rule of thumb:** if getting it wrong silently lets one user read another user's data, it's 🔴 Heavy.

**Claude Code rule:** When the next session to run is 🟢 Light, do NOT execute it. Instead, print the session's "Prompt to paste" block verbatim and tell the user to run it in their local Ollama model. Then stop. Only pick up again when the user confirms the Light session is done.

---

## 1. Dependency graph

```
S0 (you) ──┬─► S1 (light) ──► S2 (heavy) ──► S3 (medium) ──► S4 (heavy) ──► S5 (light)
           │                                                                   │
           └───────────────────────────────────────────────────────────────────┤
                                                                               ▼
                                                                      S6 (you) ──► S7 (light)
                                                                                      │
                                                                                      ▼
                                                                              S8 (medium)
                                                                                      │
                                                                                      ▼
                                                                              S9 (heavy)
                                                                                      │
                                                                                      ▼
                                                                              S10 (heavy)
                                                                                      │
                                                                                      ▼
                                                                              S11 (medium)
                                                                                      │
                                                                                      ▼
                                                                              S12 (medium)
                                                                                      │
                                                                                      ▼
                                                                              S13 (you)
```

Each session marks **🟢 Done** in the table at the bottom of this file when it's complete. Don't start a session whose dependency isn't 🟢.

---

## 2. Session index

| # | Title | Tier | Est. time | Depends on |
|---|-------|------|-----------|----------|
| S0 | Supabase project + CLI bootstrap | 🟣 You | 15 min | — |
| S1 | Scaffold `packages/db` skeleton | 🟢 Light | 20 min | S0 |
| S2 | Migration 1 — initial schema (tables) | 🔴 Heavy | 45 min | S1 |
| S3 | Migration 2 — triggers | 🟡 Medium | 25 min | S2 |
| S4 | Migration 3 — RLS policies | 🔴 Heavy | 60 min | S2 |
| S5 | Migrations 4 + 5 — realtime + indexes | 🟢 Light | 20 min | S4 |
| S6 | Local migration smoke test | 🟣 You | 10 min | S5 |
| S7 | Generate TypeScript types | 🟢 Light | 10 min | S6 |
| S8 | Build Supabase client wrappers | 🟡 Medium | 40 min | S7 |
| S9 | Prop firm research + seed data | 🔴 Heavy | 90 min | S2 (can run in parallel with S3–S8) |
| S10 | RLS test suite | 🔴 Heavy | 90 min | S7, S8 |
| S11 | CI wiring for Supabase | 🟡 Medium | 30 min | S10 |
| S12 | Migrations docs + registry update | 🟡 Medium | 20 min | S11 |
| S13 | Apply schema to production Supabase | 🟣 You | 15 min | S12 |

Total: ~8 hours of effort, but spread across however many days you want.

---

## 3. Conventions used in this doc

- **`> Prompt to paste:`** — copy the indented block verbatim into the session's chat. Don't paraphrase.
- **`> User runs:`** — a command **you** run in your terminal between sessions.
- **`> Verify:`** — exact check that should pass before marking the session done.
- **`> Common failures:`** — known gotchas with recovery.
- File paths are repo-relative.

---

## S0 — Supabase project + CLI bootstrap 🟣

### Why
Everything downstream needs a real Supabase project to point at, and the CLI tool to run migrations locally.

### Steps

**1. Create the Supabase project**
1. Go to [supabase.com](https://supabase.com) → sign in
2. Click **New project**
3. Settings:
   - **Name:** `fundededge-prod`
   - **Database password:** generate a strong one and **save it in your password manager** — you cannot recover it
   - **Region:** `us-east-1` (Vercel's main region — keep them close)
   - **Pricing plan:** Free tier is fine for now
4. Wait ~2 minutes for provisioning.

**2. Capture the credentials**
Go to **Project Settings → API**. Copy these four values into your password manager:
- **Project URL** (e.g. `https://abcdef.supabase.co`)
- **Project ref** (the `abcdef` part of the URL)
- **anon public key**
- **service_role secret key** — *never put this in client code or git*

**3. Install the Supabase CLI**

On Windows (PowerShell):
```powershell
scoop install supabase
# OR if you don't have scoop:
winget install Supabase.CLI
```

Verify:
```powershell
supabase --version   # should print 1.x or newer
```

**4. Install Docker Desktop if you don't have it**
Local Supabase runs the entire stack (Postgres, GoTrue auth, PostgREST, Studio) in Docker. Download from [docker.com](https://www.docker.com/products/docker-desktop). Start it and confirm `docker ps` runs without error.

### Verify
```powershell
supabase --version
docker ps
```
Both must succeed.

### Handoff to S1
Paste this into Claude Code (Sonnet) or your light model:

> Session S1 in `docs/tasks/02-breakdown.md` is ready to run. The Supabase project is created and the CLI is installed.

---

## S1 — Scaffold `packages/db` skeleton 🟢 Light

### Why
Pure mechanical file creation. A small local model can do this without judgment.

### Recommended model
`qwen2.5-coder:14b` (Ollama, ~9GB) **or** `deepseek-coder-v2:16b` **or** `nemotron-3-super:cloud` via OpenCode. Any of them can follow exact file-write instructions.

### Prompt to paste

> You are working in the FundedEdge monorepo. The working directory is the repo root. Create the following files exactly as specified — no improvisation, no extra files.
>
> **1. Create `packages/db/package.json`:**
> ```json
> {
>   "name": "@fundededge/db",
>   "version": "0.0.0",
>   "private": true,
>   "main": "./src/index.ts",
>   "types": "./src/index.ts",
>   "sideEffects": false,
>   "scripts": {
>     "build": "tsc",
>     "typecheck": "tsc --noEmit",
>     "lint": "biome lint ./src",
>     "lint:fix": "biome lint --write ./src",
>     "test:unit": "vitest run --passWithNoTests",
>     "clean": "rm -rf dist .turbo",
>     "supabase:start": "supabase start",
>     "supabase:stop": "supabase stop",
>     "supabase:reset": "supabase db reset",
>     "supabase:status": "supabase status",
>     "gen:types": "supabase gen types typescript --local > src/generated/types.ts"
>   },
>   "dependencies": {
>     "@supabase/ssr": "^0.5.0",
>     "@supabase/supabase-js": "^2.45.0"
>   },
>   "devDependencies": {
>     "@fundededge/config": "workspace:*",
>     "supabase": "^1.200.0",
>     "typescript": "^5.6.0",
>     "vitest": "^2.1.0"
>   }
> }
> ```
>
> **2. Create `packages/db/tsconfig.json`:**
> ```json
> {
>   "extends": "@fundededge/config/tsconfig.base.json",
>   "compilerOptions": {
>     "outDir": "./dist",
>     "rootDir": "./src"
>   },
>   "include": ["src/**/*.ts"],
>   "exclude": ["node_modules", "dist", "supabase"]
> }
> ```
>
> **3. Create `packages/db/.gitignore`:**
> ```
> supabase/.branches
> supabase/.temp
> supabase/.env
> ```
>
> **4. Create `packages/db/src/index.ts`:**
> ```ts
> // Re-exports the public API of @fundededge/db.
> // Populated in S8 once client wrappers exist.
> export {};
> ```
>
> **5. Create `packages/db/src/generated/.gitkeep`:** empty file. Types will be written here by `supabase gen types`.
>
> **6. Create `packages/db/MIGRATIONS.md`:** with this exact content:
> ```md
> # Database Migrations
>
> Placeholder. Populated in S12.
> ```
>
> **7. Run from repo root:**
> ```bash
> pnpm install
> cd packages/db
> supabase init
> ```
>
> The `supabase init` command will create `packages/db/supabase/config.toml` and an empty `packages/db/supabase/migrations/` directory.
>
> **8. Do NOT run `supabase start` yet.** That happens in S6.
>
> **9. Stop and report.** Tell the user: "S1 complete. Files created. Ready for S2." Do not proceed further.

### Verify (you, after the model finishes)
```powershell
ls packages/db/
ls packages/db/supabase/
```
You should see `package.json`, `tsconfig.json`, `src/`, `MIGRATIONS.md`, `supabase/config.toml`, `supabase/migrations/`.

### Common failures
- **"supabase: command not found"** — S0 wasn't completed. Go back.
- **Model invented extra files** — delete them and re-prompt with "ONLY create the files listed".

### Handoff to S2
> S1 is done. `packages/db` skeleton exists. Move to S2 (heavy — schema migration).

---

## S2 — Migration 1: initial schema 🔴 Heavy

### Why
This SQL file defines every table the product will ever rely on. Wrong column type, missing constraint, or fat-fingered FK = months of pain. **Heavy tier mandatory.**

### Recommended model
**Claude Sonnet 4.6 in Claude Code** (default). Use Opus 4.7 only if Sonnet pushes back on the task or asks for review.

### Prompt to paste (in Claude Code session)

> You are working on Task 02 (Supabase Schema) in the FundedEdge monorepo. Read these in order before writing anything:
>
> 1. `docs/tasks/02-supabase-schema.md` — the task spec
> 2. `docs/architecture/data-model.md` — every table, column, and constraint to implement
> 3. `CLAUDE.md` § Core architectural principles
>
> Your job in this session is **migration 1 only**: the `CREATE TABLE` statements for every public table.
>
> **Out of scope for this session (do NOT include):**
> - Triggers (those go in migration 2 — S3)
> - RLS policies (those go in migration 3 — S4)
> - Realtime publication (migration 4 — S5)
> - Indexes beyond the ones declared inline with table creation (those go in migration 5 — S5)
> - The `subscriptions` table — defer to v1.x per the data-model doc
>
> **Steps:**
> 1. Create the migration file `packages/db/supabase/migrations/20260101000001_initial_schema.sql` (use that exact timestamp prefix — `supabase` orders by filename).
> 2. Include every table from `data-model.md` § Tables (profiles, prop_firms, prop_firm_account_types, accounts, trades, trade_screenshots, checklists, checklist_items, checklist_runs, chart_layouts, user_preferences, economic_events).
> 3. Enable `citext` extension at the top of the file (the `profiles.email` column needs it).
> 4. Strip RLS / publication / trigger statements from each table block — those are deferred. Keep only `create table` and any inline `unique` constraints.
> 5. Verify every FK references the right table.
> 6. Verify every CHECK constraint matches the data-model doc.
> 7. Add a comment block at the top of the file documenting what this migration does and why it's split this way.
>
> **Verification before reporting done:**
> - Run `cd packages/db && supabase db reset` — this will start a fresh local DB and apply your migration. Fix any SQL errors that surface.
> - Run `supabase db diff` and confirm it reports no schema drift.
>
> If you discover anything in `data-model.md` that is ambiguous, contradictory, or needs clarification, **stop and ask the user** before writing SQL — do not guess on a schema.

### Verify
After Claude reports done, you run:
```powershell
cd packages/db
supabase db reset
```
Output should end with "Finished supabase db reset." and zero errors.

### Common failures
- **Docker not running** — start Docker Desktop.
- **Port 54322 in use** — another Supabase project is running. `supabase stop --project-id <other>` or run `supabase stop --all`.
- **`citext` extension missing** — Claude should have added `create extension if not exists citext;` at the top. If not, add it and re-run reset.

### Handoff to S3
> S2 done. Schema applies cleanly on a fresh local DB. Move to S3 (triggers).

---

## S3 — Migration 2: triggers 🟡 Medium

### Why
Three trigger functions, all clearly specified in `data-model.md` § Triggers. Mechanical translation, but trigger errors corrupt data silently — needs a Claude tier, not a local model.

### Recommended model
**Claude Sonnet 4.6 in Claude Code.**

### Prompt to paste

> Continue Task 02 in the FundedEdge monorepo. S1 and S2 are complete. Read `docs/tasks/02-breakdown.md` § S3 for context.
>
> **Goal:** create `packages/db/supabase/migrations/20260101000002_triggers.sql` containing:
>
> 1. `public.tg_set_updated_at()` — generic function, attached to every table that has an `updated_at` column (profiles, accounts, trades, checklists, checklist_runs, chart_layouts, user_preferences). Verify the actual list of `updated_at`-bearing tables by reading the migration from S2.
> 2. `public.tg_create_profile()` — runs `after insert on auth.users`, inserts into both `profiles` and `user_preferences` for the new user. `security definer` so it can write to public tables on behalf of an auth event.
> 3. `public.tg_update_highest_balance()` — `before insert or update on public.accounts`. Sets `new.highest_balance = greatest(new.highest_balance, new.current_balance)`. (Note: spec says "if new.current_balance > new.highest_balance, set highest_balance = current_balance" — that's equivalent.)
>
> **Important:**
> - Wrap each `create function` in `create or replace`.
> - Each `create trigger` should use `if not exists` semantics where possible — `drop trigger if exists` then `create trigger`.
> - Top-of-file comment block explaining what each trigger does.
>
> **Verify before reporting done:**
> ```bash
> cd packages/db
> supabase db reset
> ```
> Should apply both migrations clean.
>
> Then manually test triggers via `supabase db query`:
> - Inserting into `auth.users` should produce a row in `profiles` and `user_preferences`.
> - Updating `accounts.current_balance` upward should bump `highest_balance` to match.
> - Updating any table with `updated_at` should bump that column.
>
> Report results of those three manual tests before declaring done.

### Verify (mirror Claude's test report)
You run:
```powershell
cd packages/db
supabase db reset
```
Then in the local Studio UI (http://localhost:54323) try the three checks above.

### Common failures
- **"function uuid_generate_v4() does not exist"** — `gen_random_uuid()` is what we use; if any leaked into the schema, replace it.
- **Trigger runs but `highest_balance` doesn't update** — likely the trigger fires `after` instead of `before`. Must be `before`.

### Handoff to S4
> S3 done. Triggers tested manually. Move to S4 — the security-critical one.

---

## S4 — Migration 3: RLS policies 🔴 Heavy

### Why
**This is the single most security-critical file in the entire codebase.** Every RLS policy is the line between one user reading their own accounts and one user reading everyone's accounts. A missing policy = data leak.

### Recommended model
**Claude Sonnet 4.6 minimum. Consider Opus 4.7** because the cost of an error here is unbounded.

### Prompt to paste

> Continue Task 02 in the FundedEdge monorepo. S1–S3 are complete. This is the security-critical session.
>
> **Read first:**
> 1. `docs/architecture/data-model.md` — every policy clause is specified there
> 2. The migration from S2 — you must enable RLS on every table that S2 created
> 3. `CLAUDE.md` § principle 5 ("RLS is the security boundary. Always.")
>
> **Goal:** create `packages/db/supabase/migrations/20260101000003_rls_policies.sql` that:
>
> 1. For every public table created in S2, runs `alter table <table> enable row level security;`.
> 2. For each table, creates the policies specified in `data-model.md`. Use `create policy` statements named exactly as in the spec (e.g. `"users see own accounts"`).
> 3. **Carefully audit:** for each table you must determine which operations (`select`, `insert`, `update`, `delete`) need policies. If a table only specifies `for all`, that covers all four. If it specifies separate select/insert/update/delete, write all four.
> 4. **Public reference tables** (`prop_firms`, `prop_firm_account_types`, `economic_events`) get a `for select using (true)` policy — readable by everyone, no writes from app.
> 5. **User-owned tables** use `auth.uid() = user_id`. The `profiles` table is keyed on `id` (not `user_id`) — read the schema carefully.
> 6. **Soft-delete tables** (`accounts`, `trades`, `trade_screenshots`) need `deleted_at is null` in their `select` policy so soft-deleted rows are invisible. Other operations don't need that clause.
>
> **Required cross-check before reporting done:**
> Output a markdown table listing every table from S2 and which policies it has. Compare against `data-model.md` line by line. If you find a table in S2 with no policy clause in `data-model.md`, **stop and ask the user** — never default to "no policy" (the table would still have RLS enabled and be unreachable).
>
> **Verify with:**
> ```bash
> cd packages/db
> supabase db reset
> # Then in psql:
> supabase db query "select tablename, rowsecurity from pg_tables where schemaname = 'public';"
> ```
> Every table must show `rowsecurity = true`.
>
> Also:
> ```bash
> supabase db query "select tablename, policyname from pg_policies where schemaname = 'public' order by tablename;"
> ```
> Compare against your cross-check table.

### Verify
The two queries above must match the cross-check table Claude produces.

### Common failures
- **Forgot to enable RLS on a table** — the table is created in S2, you enable RLS in S4. A table can exist without RLS enabled and that's an *invisible* security hole. The verification queries catch it.
- **Policy uses `user_id` where the column is `id`** — happens with `profiles` and `user_preferences`. Read the schema, don't assume.
- **`prop_firms` writeable by users** — should be read-only via RLS. Service role bypasses RLS for seed inserts.

### Handoff to S5
> S4 done. RLS enabled on every public table with audited policies. Move to S5 — realtime + indexes.

---

## S5 — Migrations 4 + 5: realtime + indexes 🟢 Light

### Why
Two short, mechanical migrations. Realtime is two lines; indexes are a list specified in `data-model.md`.

### Recommended model
Local model is fine. **`qwen2.5-coder:14b`** or **`nemotron-3-super:cloud`**.

### Prompt to paste

> Working in the FundedEdge monorepo. S1–S4 complete. Create two short migration files exactly as specified.
>
> **1. `packages/db/supabase/migrations/20260101000004_realtime.sql`:**
> ```sql
> -- Realtime publication: only accounts and trades broadcast changes to subscribed clients.
> alter publication supabase_realtime add table public.accounts;
> alter publication supabase_realtime add table public.trades;
> ```
>
> **2. `packages/db/supabase/migrations/20260101000005_indexes.sql`:**
> Read `docs/architecture/data-model.md` and copy every `create index` and `create unique index` statement into this file. Specifically these are mentioned in the doc:
> ```sql
> create index accounts_user_id_idx on public.accounts(user_id) where deleted_at is null;
> create index trades_user_account_idx on public.trades(user_id, account_id, entry_at desc) where deleted_at is null;
> create unique index one_default_checklist_per_user on public.checklists(user_id) where is_default;
> create index economic_events_scheduled_idx on public.economic_events(scheduled_for, impact);
> ```
> Use `create index if not exists` and `create unique index if not exists` to be safe.
>
> **3. Run:**
> ```bash
> cd packages/db
> supabase db reset
> ```
> Should apply all 5 migrations cleanly.
>
> **4. Report done.** Do NOT proceed to anything else.

### Verify
```powershell
cd packages/db
supabase db reset
supabase db query "select indexname from pg_indexes where schemaname = 'public' and indexname like '%_idx' or indexname like 'one_%';"
```
You should see all 4 named indexes plus the implicit primary key indexes.

### Handoff to S6
> S5 done. All 5 migrations apply cleanly. Move to S6 — you (the user) verify locally.

---

## S6 — Local migration smoke test 🟣 You

### Why
Before you spend an afternoon writing client wrappers and tests against a schema, **you personally** confirm the schema looks right in the Supabase Studio UI. This is cheap insurance.

### Steps

1. From repo root:
   ```powershell
   cd packages/db
   supabase start
   ```
   First run takes ~2 minutes (pulls Docker images).
2. After it finishes, open the **Studio URL** it prints (usually http://localhost:54323).
3. Navigate to **Table editor**. Confirm you see every table from `data-model.md`:
   - profiles
   - prop_firms
   - prop_firm_account_types
   - accounts
   - trades
   - trade_screenshots
   - checklists
   - checklist_items
   - checklist_runs
   - chart_layouts
   - user_preferences
   - economic_events
4. Click into 2–3 tables and confirm columns + types look right (e.g. `accounts.current_balance` is `numeric`).
5. Navigate to **Authentication → Policies**. Confirm every table shows policies.
6. Run a sanity insert: in the SQL editor, try:
   ```sql
   insert into auth.users (id, email) values (gen_random_uuid(), 'test@example.com');
   select * from public.profiles;
   ```
   The trigger should have populated a profile row.

### If anything looks wrong
Don't proceed. Tell the next Claude session what's off ("table X is missing column Y") and have them fix the migration file. Then run `supabase db reset` and re-verify.

### Verify
You're satisfied that the schema is correct.

### Handoff to S7
> S6 done. Schema visually verified. Move to S7 — type generation.

---

## S7 — Generate TypeScript types 🟢 Light

### Why
One command. Output committed to git. Nothing to design.

### Recommended model
Anything. Even a tiny local model.

### Prompt to paste

> S6 complete. Supabase is running locally with all 5 migrations applied. Run:
>
> ```bash
> cd packages/db
> pnpm gen:types
> ```
>
> This writes `packages/db/src/generated/types.ts` based on the live local schema.
>
> Then verify the file is non-empty and contains expected names by running:
>
> ```bash
> head -50 packages/db/src/generated/types.ts
> ```
>
> You should see types like `accounts`, `profiles`, `trades`, `Database`, etc.
>
> Report done. Do not modify the generated file by hand.

### Verify
```powershell
cat packages/db/src/generated/types.ts | findstr /C:"accounts" /C:"profiles" /C:"trades"
```

### Handoff to S8
> S7 done. Types generated. Move to S8 — client wrappers.

---

## S8 — Supabase client wrappers 🟡 Medium

### Why
Modern Next.js 15 App Router requires three different Supabase client constructors (browser, server-component, service-role). The pattern is documented but easy to get wrong — wrong cookie handling = sessions don't persist. Medium tier.

### Recommended model
**Claude Sonnet 4.6 in Claude Code.**

### Prompt to paste

> Continue Task 02 in the FundedEdge monorepo. S1–S7 complete; generated types now exist at `packages/db/src/generated/types.ts`.
>
> **Goal:** Build the three Supabase client wrappers per the Supabase + Next.js 15 SSR pattern. Read the official Supabase docs for `@supabase/ssr` (specifically the Next.js App Router quickstart) if you're not certain of the latest API.
>
> Create these files:
>
> **1. `packages/db/src/client/browser.ts`** — `createBrowserClient()` using `@supabase/ssr`. Reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Typed with the generated `Database` type.
>
> **2. `packages/db/src/client/server.ts`** — `createServerClient()` using `@supabase/ssr`, accepting Next.js `cookies()` from `next/headers`. Typed with `Database`. **Important:** this file imports from `next/headers` so it can ONLY be used in Server Components / Server Actions / Route Handlers. Add a comment at the top stating that.
>
> **3. `packages/db/src/client/service.ts`** — `createServiceClient()` using `@supabase/supabase-js` directly (not `@supabase/ssr`) because service-role bypasses cookie auth. Reads `SUPABASE_SERVICE_ROLE_KEY`. **Add a runtime check** that throws if the function is invoked in a context that has `window` defined (this prevents accidental client-side use that would leak the service key). Typed with `Database`.
>
> **4. Update `packages/db/src/index.ts` to export:**
> ```ts
> export { createBrowserClient } from './client/browser';
> export { createServerClient } from './client/server';
> export { createServiceClient } from './client/service';
> export type { Database } from './generated/types';
> ```
>
> **5. Add to `packages/db/package.json` `peerDependencies`:**
> ```json
> "peerDependencies": {
>   "next": ">=15.0.0"
> }
> ```
> The browser client is framework-agnostic but the server client imports `next/headers`. Document this in a `README.md` for the package.
>
> **6. Type-check:**
> ```bash
> pnpm --filter @fundededge/db typecheck
> ```
> Must pass.
>
> **7. Add `apps/web/.env.example`** updates listing the two new public env vars (URL + anon key) and the service-role key. Do NOT commit any real values.
>
> Report done.

### Verify
```powershell
pnpm --filter @fundededge/db typecheck
```
Zero errors.

### Common failures
- **`Cannot find module 'next/headers'`** — `next` is a peer dep. Make sure it's installed in `apps/web` (which it is) and that the `packages/db/package.json` lists it as `peerDependencies` only.
- **Service client used in browser bundle** — the runtime check catches it but you should also configure the file to not be re-exported in a browser bundle. The `index.ts` re-export is fine because tree-shaking will drop it when only browser-client is imported.

### Handoff to S9
> S8 done. Clients build and typecheck. Move to S9 — seed data (heavy, can run in parallel with S10).

---

## S9 — Prop firm research + seed data 🔴 Heavy

### Why
Encoding wrong prop-firm rules = the rules engine flags violations that aren't violations (or worse, *doesn't* flag real ones). This requires reading each firm's current published rules carefully and translating them to numeric values with citations. **Heavy tier mandatory — also requires web access.**

### Recommended model
**Claude Sonnet 4.6 with WebSearch + WebFetch enabled.** Opus 4.7 if the firm's docs are ambiguous and you want a second opinion.

### Prompt to paste

> Continue Task 02 in the FundedEdge monorepo. Your job is the seed file for the four prop firms.
>
> **Read first:**
> - `docs/architecture/data-model.md` § `prop_firms` and § `prop_firm_account_types`
> - `docs/tasks/02-supabase-schema.md` § "Seed data sourcing"
>
> **Firms to seed:** Apex Trader Funding, Take Profit Trader (TPT), Tradeify, Lucid Trading.
>
> **For each firm:**
> 1. WebFetch the firm's current rules page (search if you don't know the URL).
> 2. Capture: trailing drawdown amount and method, daily loss limit, profit target, consistency rule, contract scaling rules, news trading restrictions, account types offered.
> 3. **Cite everything.** Every numeric value gets a comment with the source URL, date checked, and the version (if the firm publishes one).
> 4. If a firm's docs are ambiguous on any point, write the conservative interpretation and add a `// TODO: confirm with firm` comment. Don't silently guess.
>
> **Create `packages/db/supabase/seed/prop-firms.ts`:**
> - One module-level constant per firm
> - Exports a single `PROP_FIRMS` array of all four
> - Each account type matches the `prop_firm_account_types` schema exactly
> - The TypeScript should `import type { Database }` and use `Database['public']['Tables']['prop_firm_account_types']['Insert']` so type drift is caught
>
> **Create `packages/db/supabase/seed.sql`:**
> A SQL file that runs after migrations on `db reset`. It can either:
> - (Option A) Inline the prop firm INSERTs in SQL, OR
> - (Option B) Be a stub that says "run pnpm db:seed instead"
>
> Pick whichever is simpler given the Supabase CLI's seed conventions. Prefer A — SQL seeds run automatically.
>
> **Add a top-of-file warning** to `prop-firms.ts`:
> ```ts
> /**
>  * ⚠️ PROP FIRM RULES CHANGE OFTEN.
>  *
>  * Before any v1.0 production push, re-verify every firm's current rules
>  * against their official documentation and update this file. Out-of-date
>  * rules in production will silently mis-flag user trades.
>  *
>  * Last full re-verification: <YYYY-MM-DD by Claude during S9>
>  */
> ```
>
> **Verify before reporting done:**
> 1. `pnpm --filter @fundededge/db typecheck` passes.
> 2. `supabase db reset` re-applies migrations AND seed data.
> 3. `supabase db query "select slug, name from public.prop_firms order by slug;"` returns 4 rows.
> 4. `supabase db query "select count(*) from public.prop_firm_account_types;"` returns >= 20 (typically 5–8 account types per firm).
>
> **Report:** the firms seeded, the URLs used, the dates checked, and any TODOs left for the user.

### Verify
The four post-seed queries above match Claude's reported output.

### Common failures
- **Firm doc is behind a login** — note that and either skip the firm with a TODO or ask the user to paste the relevant text from inside the dashboard.
- **Numeric value can't be parsed clearly** — e.g. "trailing drawdown of $1,500–$3,500 depending on account size". Each account type stores its own number, so split per type.

### Handoff to S10
> S9 done. Seed data committed with citations. Move to S10 — RLS test suite.

---

## S10 — RLS test suite 🔴 Heavy

### Why
This is the **proof** that S4's policies actually work. Without these tests, RLS is theatre — you have policies but no evidence they block what they should. **Heavy tier mandatory.**

### Recommended model
**Claude Sonnet 4.6 minimum, Opus 4.7 strongly recommended.**

### Prompt to paste

> Continue Task 02 in FundedEdge. S1–S9 complete. Local Supabase running with schema + seed.
>
> **Goal:** Build an exhaustive RLS test suite that proves every policy from S4 works.
>
> **Read first:**
> - `docs/tasks/02-supabase-schema.md` § "RLS testing" — has an example pattern
> - `packages/db/supabase/migrations/20260101000003_rls_policies.sql` (your S4 output) — the source of truth for what to test
>
> **Create `packages/db/src/__tests__/rls.test.ts`:**
>
> 1. Vitest tests using the Supabase local instance (`http://localhost:54321`).
> 2. A `createTestUser(email)` helper that creates an auth user via the service-role admin API and returns a *user-scoped* client (authenticated as that user, NOT service role).
> 3. A `cleanup` helper that runs after all tests to delete test users.
> 4. For each **user-owned table** (accounts, trades, trade_screenshots, checklists, checklist_items, checklist_runs, chart_layouts, user_preferences, profiles), write tests for:
>    - User A can read their own rows ✓
>    - User A **cannot** read user B's rows ✗
>    - User A **cannot** insert a row claiming to be user B ✗
>    - User A **cannot** update user B's rows ✗
>    - User A **cannot** delete user B's rows ✗
>    - Soft-deleted rows (where applicable) are invisible even to the owner ✓
> 5. For each **public reference table** (prop_firms, prop_firm_account_types, economic_events):
>    - Anonymous (no auth) can read ✓
>    - Authenticated user can read ✓
>    - Authenticated user **cannot** insert/update/delete ✗
> 6. For triggers:
>    - Inserting an auth user creates a profiles row ✓
>    - Inserting an auth user creates a user_preferences row ✓
>    - Updating accounts.current_balance upward bumps highest_balance ✓
>    - Updating accounts.current_balance downward does NOT touch highest_balance ✓
>
> **Test isolation:**
> - Each `describe` block uses unique emails (`crypto.randomUUID() + '@test.com'`) so parallel test files don't collide.
> - Use a `beforeAll` to create users, `afterAll` to delete them.
> - **Never** call the production Supabase URL — assert the URL contains `localhost` at test setup.
>
> **`packages/db/package.json` test scripts:**
> ```json
> "test:unit": "vitest run",
> "test:unit:watch": "vitest"
> ```
> Add `"test:unit": "pnpm --filter @fundededge/db test:unit"` semantics already exist via turbo.
>
> **Verify before reporting done:**
> 1. `pnpm --filter @fundededge/db test:unit` passes with at least ~50 tests (it'll be a lot).
> 2. Deliberately introduce a bug: temporarily comment out the `"users see own accounts"` policy in the migration, run `db reset`, re-run tests. You should see at least one test fail. Then put the policy back and confirm tests pass again.
> 3. Report the total test count and that the "deliberate bug" check passed.

### Verify
You can repeat the deliberate-bug check yourself if you want extra confidence.

### Common failures
- **Service role client used to create test users, then accidentally used for assertions** — the test thinks RLS is working when it's actually bypassed. The helper must hand back an anon-key client signed in as the test user.
- **Tests pass against a stale DB** — always `db reset` before the test run, or have the suite reset itself in `beforeAll`.

### Handoff to S11
> S10 done. RLS test suite green. Move to S11 — CI wiring.

---

## S11 — CI wiring for Supabase 🟡 Medium

### Why
Local tests are great. CI tests are non-negotiable — they're the only thing that catches regressions in PRs. Medium tier.

### Recommended model
**Claude Sonnet 4.6.**

### Prompt to paste

> Continue Task 02. S1–S10 complete. Wire up GitHub Actions to run the RLS test suite on every PR.
>
> **Goal:** create `.github/workflows/db.yml`:
> - Triggers on PR
> - Spins up Supabase locally in the runner (Supabase CLI supports `supabase start` in CI via Docker; the official `supabase/setup-cli` action handles this)
> - Runs `pnpm --filter @fundededge/db test:unit`
> - Caches Docker layers and pnpm store for speed
>
> **Reference:** the existing `.github/workflows/ci.yml` and `.github/workflows/e2e.yml` for style and pnpm setup.
>
> **Important:**
> - Do NOT run this on `push: main` — it's slow. PR-only.
> - Set a 15-minute timeout.
> - If the workflow needs Supabase service-role keys, use GitHub Actions secrets — never inline. (For local-only Supabase, you don't need cloud secrets; the CLI generates ephemeral keys at startup that the test suite reads via env.)
>
> **Verify:**
> Open a draft PR with a trivial change to `packages/db` and confirm the new workflow runs and goes green. Report the PR URL.

### Verify
You see the workflow run pass on a real PR.

### Handoff to S12
> S11 done. CI wired. Move to S12.

---

## S12 — Migrations docs + registry update 🟡 Medium

### Why
Future-you needs to know how to roll forward, what's immutable, and how to apply migrations to prod. Closing this out makes Task 02 officially done.

### Recommended model
**Claude Sonnet 4.6.**

### Prompt to paste

> Continue Task 02. S1–S11 complete. Final cleanup session.
>
> **Goal 1:** Write `packages/db/MIGRATIONS.md` covering:
> 1. How to create a new migration (`supabase migration new <name>`)
> 2. The rule: migrations are immutable once merged. Roll forward only.
> 3. How to apply migrations to prod (`supabase link --project-ref <ref>` + `supabase db push`)
> 4. How to regenerate types after a new migration
> 5. Rollback policy: we don't write down migrations. If a migration is wrong, we write a new one that fixes the wrongness. Document this explicitly.
> 6. Naming convention: `YYYYMMDDhhmmss_short_description.sql`
>
> **Goal 2:** Update `CLAUDE.md` § Component Registry to set Task 02 to 🟢 Done.
>
> **Goal 3:** Update the description of Task 02 in `CLAUDE.md` if anything materially changed (e.g. we deferred subscriptions, decided RLS test approach, etc.).
>
> **Goal 4:** Open a final PR that bundles up any unmerged S2–S11 work into a single landable unit. (Ideally each session opened its own small PR — if they did, this session just confirms they're all merged and updates the registry on `main`.)
>
> Report done with the final PR URL.

### Handoff to S13
> S12 done. Task 02 is code-complete. Move to S13 — apply to production.

---

## S13 — Apply schema to production Supabase 🟣 You

### Why
This is the moment local work meets reality. You do it personally because it touches the production DB password and you'll want to be looking at the output.

### Steps

**1. Link the local repo to your remote Supabase project**
```powershell
cd packages/db
supabase link --project-ref <YOUR_PROJECT_REF>
```
Enter your **database password** when prompted (the one you saved in S0).

**2. Dry-run to see what will be applied**
```powershell
supabase db push --dry-run
```
Output should list all 5 migrations + seed. If anything else shows up (e.g. drift), stop and investigate.

**3. Push for real**
```powershell
supabase db push
```
Takes ~30 seconds.

**4. Generate prod types and commit them**
```powershell
supabase gen types typescript --project-id <YOUR_PROJECT_REF> > src/generated/types.ts
git add src/generated/types.ts
git commit -m "chore(db): regenerate types from production schema"
git push
```
*(In theory local + prod types are identical. In practice it's good hygiene to regenerate against prod after the first push.)*

**5. Set Vercel env vars**

For BOTH Vercel projects (`fundededge-web` and `fundededge-marketing`), go to **Project Settings → Environment Variables** and add:

| Name | Value | Environments |
|------|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | (from S0 credentials) | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (from S0 credentials) | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | (from S0 credentials) | Production, Preview *only* — never Development |

Redeploy both projects after saving.

**6. Verify the deployed apps can talk to Supabase**
For now they don't actually use Supabase (Task 03 is auth), but you can confirm env vars are wired by visiting the deploy and checking the build log for "Supabase URL configured: yes" (you'll add this log line in a later task).

### Verify
- Supabase dashboard for the prod project shows all 12 tables in the Table editor.
- Vercel deployment logs show no missing-env-var warnings.
- A query against the prod project's SQL editor returns 4 rows from `prop_firms`.

### Task 02 complete ✅
Update `CLAUDE.md` registry one final time (component 02 → 🟢 Done) if S12 didn't catch it.

---

## 4. Quality gates between sessions

Don't move from session N to session N+1 until:

1. The verify step for N passes
2. The session's output is committed to git on a branch
3. If session N opened a PR, the PR is merged OR the next session is told to keep working on the same branch
4. The table below has N marked 🟢

---

## 5. Failure recovery

If a session goes sideways (model made a mess, build broke, etc.):

1. **Don't merge anything.** Close the PR, delete the branch.
2. Run `git status` and `git stash` any work-in-progress.
3. Restart the session with the same prompt — be explicit about what went wrong last time: "Last attempt did X which was wrong because Y. Try again without doing X."
4. If two attempts fail, **escalate the tier**: light → medium → heavy.

---

## 6. Session status

Update this table as each session completes.

| # | Session | Status | PR | Notes |
|---|---------|--------|----|-------|
| S0 | Supabase project + CLI | 🟢 Done | — | Supabase project `fundededge-prod` provisioned on supabase.com, CLI v2.98.2 installed, Docker Desktop verified |
| S1 | Scaffold `packages/db` | 🟢 Done | #27 | All files created, supabase init run, typecheck passes |
| S2 | Migration 1 (schema) | 🟢 Done | #28 | Migration applies cleanly on fresh local DB; user verified `supabase db reset` end-to-end |
| S3 | Migration 2 (triggers) | 🟢 Done | #29 | Three trigger functions implemented and verified locally; merged |
| S4 | Migration 3 (RLS) | 🟢 Done | #30 | RLS enabled on all 12 public tables, 19 policies created. 10 adversarial tests pass: cross-user select/insert/update/delete blocked, anon writes blocked, soft-deleted rows hidden. Two intentional deviations from data-model.md documented in PR (trades 4-policy split; trade_screenshots has no deleted_at column). Merged 2026-05-13. |
| S5 | Migrations 4 + 5 | 🟢 Done | #33 | Realtime publication (accounts + trades) + 4 performance indexes. Merged 2026-05-14. |
| S6 | Local smoke test | 🟢 Done | — | All 12 tables verified in Supabase Studio; trigger tests (profile creation, highest_balance) confirmed working. |
| S7 | Type generation | 🟢 Done | #39 | Types generated from local schema, covers all 12 tables. Merged 2026-05-19. |
| S8 | Client wrappers | 🟢 Done | #40 | Browser, server, service-role clients typed with Database. React v19 react-dom alignment fix included. Merged 2026-05-19. |
| S9 | Seed data | 🟢 Done | #41 | 4 prop firms (Apex, TPT, Tradeify, Lucid), 29 account types with citations. Last verified 2026-05-19. Merged 2026-05-19. |
| S10 | RLS tests | 🟢 Done | #42 | 57 integration tests; all policies + triggers verified; deliberate-bug check passed. Merged 2026-05-19. |
| S11 | CI wiring | 🟢 Done | — | `.github/workflows/db.yml` committed. PR-triggered, 15-min timeout, supabase/setup-cli@v1. |
| S12 | Docs + registry | 🟢 Done | — | `packages/db/MIGRATIONS.md` written; CLAUDE.md registry updated to 🟢 Done |
| S13 | Apply to prod | 🟢 Done | — | Schema applied to production Supabase (`xiwypoeveknrackwjghp`) 2026-05-26. 12 tables, 4 prop firms + 29 account types seeded. Vercel env vars set on both projects, redeployed. |

---

## 7. Future-proofing notes

- **If a session's spec drifts from reality** (e.g. Supabase CLI changes a flag), update this file in the same PR as the fix. This doc is the playbook — keep it current.
- **If you find a better tier assignment** (e.g. S5 actually needed medium because a local model kept mangling the SQL), update the tier column in §2 and add a note.
- **If you want to split a session further**, do it. The 14 here are a starting point, not gospel.
