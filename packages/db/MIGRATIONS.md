# Database Migrations

All migrations live in `packages/db/supabase/migrations/`. They are applied in filename order by the Supabase CLI.

---

## Creating a new migration

```bash
cd packages/db
supabase migration new <short_description>
```

This creates `supabase/migrations/<timestamp>_<short_description>.sql`. Write your SQL in that file, then verify it applies cleanly:

```bash
supabase db reset
```

### Naming convention

`YYYYMMDDhhmmss_short_description.sql` — the CLI generates the timestamp prefix automatically. Keep the description lowercase with underscores.

---

## Migrations are immutable once merged

Never edit a migration file after it has been merged to `main`. If a migration is wrong, write a new one that corrects it. Roll forward only.

This applies even for typos. The correction goes in a new file.

---

## Applying migrations to production

```bash
cd packages/db

# 1. Link the local CLI to the remote project (one-time per machine)
supabase link --project-ref <YOUR_PROJECT_REF>

# 2. Dry-run to see what will be applied
supabase db push --dry-run

# 3. Push for real
supabase db push
```

The project ref is the subdomain portion of your Supabase project URL (e.g. `abcdefgh` from `https://abcdefgh.supabase.co`).

---

## Regenerating TypeScript types

After any migration that changes the schema, regenerate the types:

```bash
# Against the local stack
cd packages/db
pnpm gen:types

# Against production (after db push)
supabase gen types typescript --project-id <YOUR_PROJECT_REF> > src/generated/types.ts
```

Commit the updated `src/generated/types.ts` in the same PR as the migration.

---

## Rollback policy

We do not write down migrations. There is no `down` migration. If a migration introduces a problem:

1. Write a new migration that corrects the schema.
2. Merge and deploy that migration.
3. Document the incident in the PR description.

This keeps the migration history linear and auditable.

---

## Current migrations

| File | What it does |
|------|-------------|
| `20260101000001_initial_schema.sql` | Creates all 12 public tables with constraints and FKs |
| `20260101000002_triggers.sql` | `updated_at` trigger, profile creation trigger, `highest_balance` trigger |
| `20260101000003_rls_policies.sql` | Enables RLS on all public tables; 19 policies across all tables |
| `20260101000004_realtime.sql` | Adds `accounts` and `trades` to the Supabase Realtime publication |
| `20260101000005_indexes.sql` | Performance indexes on `accounts`, `trades`, `checklists`, `economic_events` |

### Intentional deviations from `data-model.md`

- **`trades` RLS** — implemented as 4 separate per-operation policies instead of `for all`, to allow tighter future control per operation.
- **`trade_screenshots`** — no `deleted_at` column; screenshots are hard-deleted when the parent trade is deleted.
