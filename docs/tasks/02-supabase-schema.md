# Task 02: Supabase Schema, RLS, Migrations, and Types

## Goal
Define the complete Postgres schema (every table, every index, every trigger, every RLS policy) per `docs/architecture/data-model.md`, version it as migrations, generate TypeScript types, and seed reference data.

## Out of scope
- Application code that calls these tables (later tasks)
- Stripe-related tables (deferred to v1.x)
- Live broker integration tables (deferred to v2)

## Dependencies
- Task 01

## Acceptance criteria

- [ ] Local Supabase via `supabase start` runs all migrations cleanly from a fresh DB
- [ ] All tables from `data-model.md` exist with correct columns, types, indexes, constraints
- [ ] RLS enabled on every public table
- [ ] Every RLS policy has a corresponding test in `packages/db/src/__tests__/rls.test.ts` that proves it permits what it should and blocks what it shouldn't
- [ ] Triggers for `updated_at`, `tg_create_profile`, `tg_update_highest_balance` exist and work
- [ ] Realtime publication includes `accounts` and `trades` only
- [ ] Seed data: 4 prop firms (Apex, TPT, Tradeify, Lucid) + their account types based on currently published rules — sourced and cited in seed file comments
- [ ] `packages/db/src/generated/types.ts` regenerated and committed
- [ ] `packages/db` exports `createServerClient`, `createBrowserClient`, `createServiceClient`, plus typed table helpers
- [ ] Migration rollback path documented in `packages/db/MIGRATIONS.md`

## Files to create

```
packages/db/
├── package.json
├── tsconfig.json
├── MIGRATIONS.md
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   ├── 20260101000001_initial_schema.sql
│   │   ├── 20260101000002_triggers.sql
│   │   ├── 20260101000003_rls_policies.sql
│   │   ├── 20260101000004_realtime.sql
│   │   └── 20260101000005_indexes.sql
│   ├── seed.sql
│   └── seed/
│       └── prop-firms.ts
├── src/
│   ├── index.ts
│   ├── client/
│   │   ├── server.ts
│   │   ├── browser.ts
│   │   └── service.ts
│   ├── generated/
│   │   └── types.ts
│   └── __tests__/
│       └── rls.test.ts
```

## Implementation notes

### Migration files

Use `supabase migration new <name>` to create migrations with proper timestamps. Migrations are immutable once merged — never edit a merged migration. Roll forward only.

### Type generation

```json
{
  "scripts": {
    "gen:types": "supabase gen types typescript --local > src/generated/types.ts",
    "test:unit": "vitest run"
  }
}
```

### RLS testing

```typescript
describe('RLS: accounts table', () => {
  let userA: { id: string; client: ReturnType<typeof createClient> }
  let userB: { id: string; client: ReturnType<typeof createClient> }

  beforeAll(async () => {
    userA = await createTestUser('a@test.com')
    userB = await createTestUser('b@test.com')
  })

  it('user A cannot read user B accounts', async () => {
    await userB.client.from('accounts').insert({ /* ... */ })
    const { data } = await userA.client.from('accounts').select('*')
    expect(data).toEqual([])
  })

  it('user A cannot update user B accounts', async () => {
    const { data: bAccount } = await userB.client.from('accounts').insert({}).select().single()
    await userA.client.from('accounts').update({ nickname: 'pwned' }).eq('id', bAccount.id)
    const { data: stillB } = await userB.client.from('accounts').select('*').eq('id', bAccount.id).single()
    expect(stillB.nickname).not.toBe('pwned')
  })
})
```

### Seed data sourcing

Each preset firm's rules in `packages/db/supabase/seed/prop-firms.ts` includes a comment with:
- Source URL (firm's official rules page)
- Date checked
- Rules version

```typescript
// Apex Trader Funding — checked 2026-01-15 from https://apextraderfunding.com/rules
// Trailing drawdown locks at +$3K profit (lock-at-target)
// 30% consistency rule applies to PA accounts only
const APEX = {
  slug: 'apex',
  name: 'Apex Trader Funding',
  accountTypes: [
    { slug: 'apex-25k', name: 'Apex $25K', starting_balance: 25_000, profit_target: 1_500, trailing_drawdown: 1_500 },
    // 50K, 75K, 100K, 150K, 250K
  ],
}
```

**Important:** Real prop firm rules change. The seed data is a starting point for v1.0 launch — at launch time, the founder must verify each firm's current published rules and update the seed if they've drifted. A reminder lives at the top of `seed/prop-firms.ts`.

## Testing requirements

- RLS test for every table with policies (~12 tables)
- Trigger test confirming `tg_create_profile` runs on `auth.users` insert
- Trigger test confirming `tg_update_highest_balance` updates correctly
- Migration rollback test: roll forward, roll back, confirm clean state

## Definition of done

- [ ] All acceptance criteria checked
- [ ] `supabase db push` works against the production project
- [ ] Types generated and committed
- [ ] RLS test suite green
- [ ] CLAUDE.md component registry updated: 02 → 🟢 Done
