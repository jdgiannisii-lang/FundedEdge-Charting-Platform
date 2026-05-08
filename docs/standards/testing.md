# Testing Standards

We test what users (and calling code) experience. We don't test that one function calls another.

## Layers

### Unit tests (Vitest)
- Pure functions, especially in `packages/rules-engine`
- React component logic via `@testing-library/react` (rare — most components are integration-tested via Storybook + Playwright)
- Server action input/output via mocked Supabase

### Integration tests (Vitest + supabase-js + a local Supabase Docker)
- Server actions hitting a real local Supabase
- Migrations applying cleanly
- RLS policies enforcing correctly (try to do bad things, assert they fail)

### Component tests (Storybook + Playwright Component Testing)
- Visual regression on every component variant
- Interaction tests on every interactive component
- Accessibility audits via `@storybook/test-runner` + axe

### End-to-end tests (Playwright)
- Critical user flows: signup → onboarding → first account → first trade entry → logout
- Run against a deployed preview environment per PR
- Smoke test against production after every deploy

## Coverage targets

- `packages/rules-engine` — **100%** branch coverage. This is the differentiator. Every preset, every edge case, no exceptions.
- `packages/db` (RLS policies) — **every policy has a test** that proves it allows what it should and blocks what it shouldn't.
- Server actions — **happy path + every documented error case**.
- UI components — **visual regression on every story**, interaction tests on interactive ones.
- Overall app — **70% line coverage minimum**, but we don't fetishize the number.

## Test naming

```typescript
describe('evaluate', () => {
  describe('Apex 50K trailing drawdown', () => {
    it('flags warning when within 20% of trailing limit', () => { ... })
    it('flags danger when within 5% of trailing limit', () => { ... })
    it('flags breached when current balance below trailing limit', () => { ... })
    it('locks the trailing at +$3K profit (Apex specific behavior)', () => { ... })
  })
})
```

Test names are sentences a non-technical reader could understand.

## Fixtures

Fixtures live next to the code in `__fixtures__/` directories. Reuse aggressively.

```typescript
export const apex50kFreshAccount: AccountState = {
  startingBalance: 50_000,
  currentBalance: 50_000,
  highestBalance: 50_000,
  currentPnl: 0,
  openPnl: 0,
  currentPositionContracts: 0,
  status: 'evaluation',
  trades: [],
  rulesConfig: APEX_50K_RULES,
  evaluatedAt: new Date('2026-01-15T14:00:00Z'),
  timezone: 'America/New_York',
}
```

## Snapshot tests

Allowed for output of complex pure functions (rule verdicts in particular). Forbidden for React component HTML — use visual regression instead.

## Performance tests

A small Playwright suite measures critical-path render times. Fails CI if budgets in `system-design.md` are violated.

## CI configuration

```yaml
jobs:
  typecheck: pnpm typecheck
  lint: pnpm lint
  unit: pnpm test:unit
  build: pnpm build
  e2e: pnpm test:e2e (only on PRs against main)
```

All four required for merge. No bypass on red.
