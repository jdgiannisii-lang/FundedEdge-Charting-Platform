# Task 02 — End-to-End Verification Runbook

> Read-only checklist for confirming Task 02 sessions S0–S3 are correctly
> set up. Paste-friendly companion to `docs/tasks/02-breakdown.md`.
>
> **How to use:** in a fresh Claude Code session, run the prompt at the
> bottom of this file. Claude will execute every check below and report
> a pass/fail table.
>
> **Read-only:** these checks never modify files, commit, or push. The
> only writes happen inside the local Docker Postgres for the smoke test
> in §5, and they're cleaned up by the same script.

---

## Context to load first

Before any commands, the executing session should read:

1. `handoff.md` (repo root) — session status, verification results, and the
   auth.users + accounts column gotchas
2. `docs/tasks/02-breakdown.md` § 6 — session status table
3. `packages/db/supabase/migrations/20260101000002_triggers.sql` — the SQL
   under verification

---

## §1. Tooling (S0)

```powershell
supabase --version
docker ps
```

- `supabase --version` → expect `2.x` or higher
- `docker ps` → expect column header, no error

---

## §2. Repo state (S1)

From the repo root `C:\Users\jdgia\Documents\GitHub\FundedEdge-Charting-Platform`:

```powershell
git status
git rev-parse --abbrev-ref HEAD
git log --oneline -5
```

Confirm `packages/db/` contains:
- `package.json`
- `tsconfig.json`
- `MIGRATIONS.md`
- `src/index.ts`
- `src/generated/.gitkeep`
- `supabase/config.toml`
- `supabase/migrations/`

Then:

```powershell
pnpm --filter @fundededge/db typecheck
```

Expect zero errors.

---

## §3. Migrations on disk (S2 + S3)

`packages/db/supabase/migrations/` must contain **exactly** two `.sql` files:

- `20260101000001_initial_schema.sql`
- `20260101000002_triggers.sql`

---

## §4. Local DB state

Only run §4 and §5 if Supabase is already running. Check with:

```powershell
cd C:\Users\jdgia\Documents\GitHub\FundedEdge-Charting-Platform\packages\db
supabase status
```

If "Stopped services," **skip §4 and §5** and note in the report. Do **not** start the stack — that's a 2-minute Docker dance for what's optional.

If running, query the DB via:

```powershell
docker exec supabase_db_db psql -U postgres -d postgres -c "<SQL>"
```

### 4a. Public tables — expect 12

```sql
select count(*) from information_schema.tables where table_schema = 'public';
```

### 4b. Public triggers — expect 8

(7 `updated_at` triggers + 1 `accounts_highest_balance`)

```sql
select count(*) from pg_trigger t
join pg_class c on t.tgrelid = c.oid
where c.relnamespace = (select oid from pg_namespace where nspname = 'public')
  and not t.tgisinternal;
```

### 4c. Auth trigger — expect 1

(`on_auth_user_created` lives on `auth.users`, not `public`)

```sql
select count(*) from pg_trigger t
join pg_class c on t.tgrelid = c.oid
where c.relname = 'users'
  and t.tgname = 'on_auth_user_created'
  and not t.tgisinternal;
```

### 4d. Trigger functions — expect 3

```sql
select count(*) from pg_proc
where pronamespace = (select oid from pg_namespace where nspname = 'public')
  and proname in ('tg_set_updated_at', 'tg_create_profile', 'tg_update_highest_balance');
```

---

## §5. Live trigger smoke test

Use a unique email so reruns don't collide:

```sql
-- pick something like 'verify-' || floor(random()*1e9)::text || '@test.com'
```

### 5a. Auth → profile + user_preferences

The `auth.users` insert needs these columns at minimum (Supabase Auth schema):

```sql
insert into auth.users (
  id, instance_id, aud, role, email,
  encrypted_password, email_confirmed_at, created_at, updated_at
) values (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  '<unique-email>',
  '',
  now(), now(), now()
);
```

Then verify the trigger fired:

```sql
select count(*) from public.profiles where email = '<unique-email>';
-- expect 1

select count(*) from public.user_preferences up
join auth.users u on u.id = up.user_id
where u.email = '<unique-email>';
-- expect 1
```

### 5b. `tg_update_highest_balance` — bump up

The `accounts` table column names (per `handoff.md` gotchas):
- column is `account_type_id`, not `prop_firm_account_type_id`
- no `broker_account_id` column
- `rules_config` is `NOT NULL` — pass `'{}'::jsonb`

```sql
insert into public.accounts (
  user_id, nickname, status, rules_config,
  starting_balance, current_balance, highest_balance
)
select u.id, 'verify-test-acc', 'evaluation', '{}'::jsonb, 10000, 10000, 10000
from auth.users u where u.email = '<unique-email>';

update public.accounts
set current_balance = 15000
where nickname = 'verify-test-acc'
returning current_balance, highest_balance;
-- expect highest_balance = 15000
```

### 5c. `tg_update_highest_balance` — should NOT bump down

```sql
update public.accounts
set current_balance = 8000
where nickname = 'verify-test-acc'
returning current_balance, highest_balance;
-- expect highest_balance = 15000 (unchanged)
```

### 5d. Cleanup

`auth.users` delete cascades to `public.profiles` and `public.accounts`:

```sql
delete from auth.users where email = '<unique-email>';
```

---

## §6. PR status

GitHub CLI lives outside PATH on this machine — use:

```powershell
& "C:\Program Files\GitHub CLI\gh.exe" pr list --state open --json number,title,headRefName,statusCheckRollup
```

Confirm PR #29 (`feat/02-s3-triggers`) exists. Report its overall CI status.

---

## Report format

A markdown table with columns: **Session | Check | Pass/Fail | Notes**. Keep notes terse.

End with one line: either
- ✅ S0–S3 fully verified, or
- ⚠️ Issues found: `<short list>`

---

## The short prompt to paste into Claude Code

```
Execute every check in docs/tasks/02-verify.md in the repo at
C:\Users\jdgia\Documents\GitHub\FundedEdge-Charting-Platform. Read-only —
no edits, commits, or pushes. Report findings in the table format
specified at the bottom of that file.
```
