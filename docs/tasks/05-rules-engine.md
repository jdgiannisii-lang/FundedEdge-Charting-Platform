# Task 05: Rules Engine

## Goal
The pure-TypeScript engine that evaluates a prop firm account state against its configured rules and returns verdicts. This is the differentiator. It must be 100% correct, exhaustively tested, and zero-dependency (no Supabase, no React, no DOM).

## Out of scope
- The UI that displays verdicts (task 07)
- The persistence layer that stores rules (task 02)
- AI-driven rule analysis (v1.2)

## Dependencies
- Task 01

## Acceptance criteria

- [ ] `packages/rules-engine` package with zero runtime dependencies (only `zod` for input validation, optional)
- [ ] `evaluate(state: AccountState): EngineVerdict` exported and matches the contract in `docs/architecture/interface-contracts.md`
- [ ] Presets implemented for Apex (5 account sizes), TPT (4), Tradeify (4), Lucid (3) — every published account size as of `packages/db/supabase/seed/prop-firms.ts`
- [ ] Custom rules supported — engine doesn't care if a rule came from a preset or custom config
- [ ] Every rule type implemented:
  - Trailing drawdown (EOD, intraday, lock-at-target variants)
  - Static drawdown (max loss limit)
  - Daily loss limit (with timezone-aware reset)
  - Profit target (absolute and EOD variants)
  - Consistency (best-day-pct and min-trading-days)
  - Contract scaling (multi-tier thresholds)
  - News trading restriction (window calculation)
- [ ] Verdicts include: status (ok/warning/danger/breached), distance to threshold, % of limit, message
- [ ] Overall status is the worst of all individual verdicts
- [ ] Alerts generated when crossing thresholds (warning at 20% remaining, danger at 5% remaining — both configurable)
- [ ] 100% branch coverage on the engine
- [ ] Each preset firm has fixture cases covering: fresh account, mid-evaluation, near-breach, breached, target-hit
- [ ] Performance: `evaluate()` runs in <2ms for typical state
- [ ] Engine deterministic — same input always yields same output

## Files to create

```
packages/rules-engine/
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── index.ts
│   ├── types.ts
│   ├── evaluate.ts
│   ├── rules/
│   │   ├── trailing-drawdown.ts
│   │   ├── static-drawdown.ts
│   │   ├── daily-loss.ts
│   │   ├── profit-target.ts
│   │   ├── consistency.ts
│   │   ├── contract-scaling.ts
│   │   └── news-trading.ts
│   ├── presets/
│   │   ├── index.ts
│   │   ├── apex.ts
│   │   ├── tpt.ts
│   │   ├── tradeify.ts
│   │   └── lucid.ts
│   ├── schemas.ts
│   ├── helpers/
│   │   ├── math.ts
│   │   ├── time.ts
│   │   └── format.ts
│   └── __fixtures__/
│       ├── apex-states.ts
│       ├── tpt-states.ts
│       ├── tradeify-states.ts
│       └── lucid-states.ts
└── src/__tests__/
    ├── evaluate.test.ts
    ├── rules/
    │   ├── trailing-drawdown.test.ts
    │   ├── static-drawdown.test.ts
    │   ├── daily-loss.test.ts
    │   ├── profit-target.test.ts
    │   ├── consistency.test.ts
    │   ├── contract-scaling.test.ts
    │   └── news-trading.test.ts
    ├── presets/
    │   ├── apex.test.ts
    │   ├── tpt.test.ts
    │   ├── tradeify.test.ts
    │   └── lucid.test.ts
    └── property/
        └── invariants.test.ts
```

## Implementation notes

### Trailing drawdown — Apex variant

The hardest rule. Apex's specifics (verified against firm's published rules at seed time, but founder must re-verify before launch):

- Drawdown trails the highest balance reached since the account started
- It locks at `starting_balance + profit_target` once that mark is hit
- Drawdown is checked intraday (not just EOD)
- If `current_balance` (including open P&L) drops below `highest_balance - drawdown_amount`, the account is breached

```typescript
export function evaluateTrailingDrawdown(state: AccountState): RuleVerdict {
  const config = state.rulesConfig.drawdown
  if (config.type !== 'trailing') return notApplicable()

  const ddAmount = config.amount
  let trailFromBalance = state.highestBalance

  if (config.lock_at_balance && state.highestBalance >= state.startingBalance + config.lock_at_balance) {
    trailFromBalance = state.startingBalance + config.lock_at_balance
  }

  const limit = trailFromBalance - ddAmount
  const equity = state.currentBalance + state.openPnl
  const distance = equity - limit

  let status: RuleVerdict['status'] = 'ok'
  if (equity <= limit) status = 'breached'
  else if (distance <= ddAmount * 0.05) status = 'danger'
  else if (distance <= ddAmount * 0.20) status = 'warning'

  return {
    ruleId: 'trailing-drawdown',
    ruleName: 'Trailing Drawdown',
    status,
    message: status === 'breached'
      ? `Drawdown breached. Equity $${equity.toFixed(0)} below limit $${limit.toFixed(0)}.`
      : `$${distance.toFixed(0)} until trailing drawdown breach.`,
    currentValue: equity,
    threshold: limit,
    distance,
    percentOfLimit: clamp(distance / ddAmount, 0, 1),
  }
}
```

### Daily loss with timezone

```typescript
export function isSameTradingDay(a: Date, b: Date, tz: string, resetTime: string): boolean {
  // resetTime is "HH:mm Area/City" — e.g., "17:00 America/Chicago"
  // A trading day starts at resetTime and ends 24h later
}
```

### Property-based tests

Use `fast-check` to generate thousands of random states and assert invariants:

- Engine never crashes
- `overallStatus === 'breached'` ⟹ at least one rule is breached
- `evaluate(s)` is deterministic: `evaluate(s) === evaluate(s)`
- Adding a positive trade never worsens any rule's status

### Performance

```typescript
test('evaluate runs in under 2ms', () => {
  const state = apex50kMidEvaluation()
  const N = 1000
  const start = performance.now()
  for (let i = 0; i < N; i++) evaluate(state)
  const avg = (performance.now() - start) / N
  expect(avg).toBeLessThan(2)
})
```

## Testing requirements

Per rule:
- Happy path
- At warning threshold
- At danger threshold
- Just breached
- Edge cases specific to that rule

Per preset:
- Fresh account state
- Mid-evaluation passing
- Near breach
- Breached
- Target achieved

Engine-wide:
- Determinism
- Performance
- Property invariants

**Coverage requirement: 100% branches, no exceptions.**

## Definition of done

- [ ] All acceptance criteria checked
- [ ] Coverage report shows 100% branch coverage
- [ ] Performance test green
- [ ] Property tests stable for 1000 iterations
- [ ] Founder reviewed each preset against firm's current published rules
- [ ] CLAUDE.md component registry updated: 05 → 🟢 Done
