# Task 05 — Session Breakdown

> Task 05 (Rules Engine) is the product's differentiator and its single most correctness-critical
> package. It's a zero-dependency, pure-TypeScript engine with **7 rule types**, **4 firm presets
> covering 29 account sizes**, fixtures, and three test layers (unit, preset, property/perf) at
> **100% branch coverage**. This document splits it into **13 independently-runnable sessions** so
> each one is small enough to finish in a single chat, fail safely, and be done by the right tier of
> model — or by you when human action is required.
>
> **Read this whole document before starting.** Each session links to the one before and after. Don't
> skip ahead — S7 depends on every rule (S3–S6) actually existing, and the test sessions depend on the
> presets and fixtures being real.

---

## 0. Glossary of tiers

| Tier | Who runs it | Use for |
|------|-------------|---------|
| 🟣 **User** | You, in a browser / terminal | Founder rule re-verification, anything that needs human judgment on real firm rules |
| 🟢 **Light** | Local model (Ollama: `qwen2.5-coder:14b`, `deepseek-coder-v2`, or cloud `nemotron-3-super`) via OpenCode | Mechanical scaffolding, file creation from exact templates, running CLI commands. No architecture, no rule logic. |
| 🟡 **Medium** | Claude Sonnet 4.6 in Claude Code | Code with judgment but not novel design: straightforward rules, helpers, fixtures, CI wiring, docs. |
| 🔴 **Heavy** | Claude Sonnet 4.6 (default) or Opus 4.7 (when explicitly hard) in Claude Code | Type/contract design, the trailing-drawdown rule, the evaluate orchestrator, presets, and the test suites. Anything where being wrong silently corrupts a verdict. |

**Rule of thumb:** if getting it wrong silently lets the engine **mis-flag a non-breach as a breach —
or, worse, fail to flag a real breach** — it's 🔴 Heavy. The whole product promise ("help traders stay
funded") rides on this engine being right.

**Claude Code rule:** When the next session to run is 🟢 Light, do NOT execute it. Instead, print the
session's "Prompt to paste" block verbatim and tell the user to run it in their local Ollama model.
Then stop. Only pick up again when the user confirms the Light session is done.

---

## 1. Dependency graph

```
S0 (light: scaffold pkg + deps + stub file tree)
  └─► S1 (heavy: types.ts + schemas.ts — REPLACE drifted stub to match interface-contracts.md)
        ├─► S2 (medium: helpers math.ts / time.ts / format.ts)
        │     ├─► S3 (heavy:  trailing-drawdown.ts)   ─┐
        │     ├─► S4 (medium: static-drawdown + daily-loss) │
        │     ├─► S5 (medium: profit-target + consistency)  ├─► S7 (heavy: evaluate.ts orchestrator)
        │     └─► S6 (medium: contract-scaling + news)     ─┘
        │
        └─► S8 (heavy: presets apex/tpt/tradeify/lucid + index; getPreset/listPresets)
               │
   (S7 + S8) ──┴─► S9 (medium: __fixtures__ per firm)
                      └─► S10 (heavy: per-rule + per-preset unit tests)
                             └─► S11 (heavy: property/invariants + perf tests)
                                    └─► S12 (medium: 100% coverage gate + CI + README + registry)
```

After **S1**, two tracks run in parallel:
- the **rules track** — S2 → {S3, S4, S5, S6 in parallel} → S7, and
- the **presets track** — S8.

S9 (fixtures) needs both S7 (a working `evaluate`) and S8 (presets) before it's useful. Each session
marks **🟢 Done** in the status table at the bottom of this file before the next session starts.

---

## 2. Session index

| # | Title | Tier | Est. time | Depends on |
|---|-------|------|-----------|------------|
| S0 | Scaffold package + deps + stub tree | 🟢 Light | 20 min | — |
| S1 | Types + schemas (contract alignment) | 🔴 Heavy | 45 min | S0 |
| S2 | Helpers: math / time / format | 🟡 Medium | 40 min | S1 |
| S3 | Rule: trailing drawdown | 🔴 Heavy | 60 min | S1, S2 |
| S4 | Rules: static drawdown + daily loss | 🟡 Medium | 45 min | S1, S2 |
| S5 | Rules: profit target + consistency | 🟡 Medium | 45 min | S1, S2 |
| S6 | Rules: contract scaling + news trading | 🟡 Medium | 45 min | S1, S2 |
| S7 | `evaluate()` orchestrator + alerts | 🔴 Heavy | 50 min | S3, S4, S5, S6 |
| S8 | Presets (apex / tpt / tradeify / lucid) | 🔴 Heavy | 75 min | S1 |
| S9 | Fixtures (5 states per firm) | 🟡 Medium | 40 min | S7, S8 |
| S10 | Unit tests: per-rule + per-preset | 🔴 Heavy | 90 min | S9 |
| S11 | Property invariants + performance tests | 🔴 Heavy | 50 min | S10 |
| S12 | Coverage gate + CI + README + registry | 🟡 Medium | 40 min | S11 |

Total: ~10 hours of effort, spread across however many days you want.

---

## 3. Conventions used in this doc

- **`> Prompt to paste:`** — copy the indented block verbatim into the session's chat. Don't paraphrase.
- **`> User runs:`** — a command **you** run in your terminal between sessions.
- **`> Verify:`** — exact check that should pass before marking the session done.
- **`> Common failures:`** — known gotchas with recovery.
- File paths are repo-relative.

> **Two pieces of drift every session must respect** (resolved here once so no session re-litigates them):
>
> 1. **The package already exists with a throwaway prototype.** `packages/rules-engine/src/engine.ts`,
>    `src/types.ts`, `src/index.ts`, and `src/index.test.ts` currently export a prototype
>    `evaluate(state, config) → { passed, violations, warnings }`. **This is not the contract.** The
>    real API is in `docs/architecture/interface-contracts.md` § Rules Engine API:
>    `evaluate(state: AccountState): EngineVerdict`, `getPreset(slug)`, `listPresets()`. We **replace**
>    the prototype, we do not extend it.
> 2. **The spec's preset counts are stale.** `05-rules-engine.md` says "Apex (5), TPT (4), Tradeify (4),
>    Lucid (3)". The real source of truth — named in the same acceptance criterion — is
>    `packages/db/supabase/seed/prop-firms.ts`, which defines **Apex 4, TPT 5, Tradeify 8, Lucid 12 =
>    29 account types**. Presets mirror the seed, not the parenthetical.

---

## S0 — Scaffold package + deps + stub tree 🟢 Light

### Why
Pure mechanical work. Get dependencies installed and every file from the spec's "Files to create" tree
on disk as a typed stub so the Heavy/Medium sessions have a clean canvas and can run without collisions.

### Recommended model
`qwen2.5-coder:14b` (Ollama) or `deepseek-coder-v2:16b`. Any local model can follow exact file-write +
CLI instructions.

### Prompt to paste

> You are working in the FundedEdge monorepo. The working directory is the repo root. Do exactly the
> following — no improvisation, no extra files, no logic.
>
> **Step 1 — Add dependencies.** Edit `packages/rules-engine/package.json`:
> - Add to a new `dependencies` block: `"zod": "^3.23.0"` (input validation — the only allowed runtime dep).
> - Add to `devDependencies`: `"fast-check": "^3.22.0"` and `"@vitest/coverage-v8": "^2.1.0"`.
> - In `scripts`, add: `"test:cov": "vitest run --coverage"`.
> - Leave the existing `build` / `typecheck` / `lint` / `test:unit` scripts untouched.
>
> **Step 2 — Install.**
> ```bash
> pnpm install
> ```
>
> **Step 3 — Delete the prototype files** (they will be replaced, not extended):
> ```bash
> rm packages/rules-engine/src/engine.ts
> rm packages/rules-engine/src/index.test.ts
> ```
> Leave `src/index.ts` and `src/types.ts` in place — S1 overwrites them.
>
> **Step 4 — Create the full stub file tree.** Rules:
> - `.ts` source files (types, rules, helpers, presets, fixtures, schemas) → `export {};`
> - `evaluate.ts` → `export {};`
> - test files (`*.test.ts`) → a single placeholder so Vitest doesn't choke:
>   ```ts
>   import { describe, it, expect } from 'vitest';
>   describe('placeholder', () => { it('todo', () => { expect(true).toBe(true); }); });
>   ```
>
> Create every file below with the matching stub rule. Create parent directories as needed.
> ```
> packages/rules-engine/README.md                                  (empty heading: "# @fundededge/rules-engine")
> packages/rules-engine/src/evaluate.ts
> packages/rules-engine/src/schemas.ts
> packages/rules-engine/src/rules/trailing-drawdown.ts
> packages/rules-engine/src/rules/static-drawdown.ts
> packages/rules-engine/src/rules/daily-loss.ts
> packages/rules-engine/src/rules/profit-target.ts
> packages/rules-engine/src/rules/consistency.ts
> packages/rules-engine/src/rules/contract-scaling.ts
> packages/rules-engine/src/rules/news-trading.ts
> packages/rules-engine/src/presets/index.ts
> packages/rules-engine/src/presets/apex.ts
> packages/rules-engine/src/presets/tpt.ts
> packages/rules-engine/src/presets/tradeify.ts
> packages/rules-engine/src/presets/lucid.ts
> packages/rules-engine/src/helpers/math.ts
> packages/rules-engine/src/helpers/time.ts
> packages/rules-engine/src/helpers/format.ts
> packages/rules-engine/src/__fixtures__/apex-states.ts
> packages/rules-engine/src/__fixtures__/tpt-states.ts
> packages/rules-engine/src/__fixtures__/tradeify-states.ts
> packages/rules-engine/src/__fixtures__/lucid-states.ts
> packages/rules-engine/src/__tests__/evaluate.test.ts
> packages/rules-engine/src/__tests__/rules/trailing-drawdown.test.ts
> packages/rules-engine/src/__tests__/rules/static-drawdown.test.ts
> packages/rules-engine/src/__tests__/rules/daily-loss.test.ts
> packages/rules-engine/src/__tests__/rules/profit-target.test.ts
> packages/rules-engine/src/__tests__/rules/consistency.test.ts
> packages/rules-engine/src/__tests__/rules/contract-scaling.test.ts
> packages/rules-engine/src/__tests__/rules/news-trading.test.ts
> packages/rules-engine/src/__tests__/presets/apex.test.ts
> packages/rules-engine/src/__tests__/presets/tpt.test.ts
> packages/rules-engine/src/__tests__/presets/tradeify.test.ts
> packages/rules-engine/src/__tests__/presets/lucid.test.ts
> packages/rules-engine/src/__tests__/property/invariants.test.ts
> ```
>
> **Step 5 — Reset `src/index.ts` and `src/types.ts` to empty stubs** (`export {};`) — S1 fills them.
>
> **Step 6 — Verify:**
> ```bash
> pnpm --filter @fundededge/rules-engine typecheck
> pnpm --filter @fundededge/rules-engine test:unit
> ```
> Both must pass (typecheck clean; tests pass with the placeholder specs).
>
> **Step 7 — Stop and report.** List every file created. Do not proceed further.

### Verify
```bash
ls packages/rules-engine/src/rules/ packages/rules-engine/src/presets/ packages/rules-engine/src/helpers/
ls packages/rules-engine/src/__tests__/rules/ packages/rules-engine/src/__tests__/presets/
pnpm --filter @fundededge/rules-engine typecheck
pnpm --filter @fundededge/rules-engine test:unit
```
All files present. Both commands pass.

### Common failures
- **`engine.ts` still referenced** — the old `src/index.ts` re-exported `./engine`. Make sure Step 5
  reset `index.ts` to `export {};` so nothing imports the deleted file.
- **Vitest "no test files found"** — the placeholder spec in each `*.test.ts` prevents this; confirm
  each test file has the placeholder block, not `export {};`.
- **Model invented extra files** — delete them and re-prompt with "ONLY create the files in the list."

### Handoff to S1
> S0 is done. Package deps installed, prototype removed, full stub tree created, typecheck + tests pass.
> Move to S1 (heavy — types & contract alignment).

---

## S1 — Types + schemas (contract alignment) 🔴 Heavy

### Why
Every downstream file imports `AccountState`, `RuleVerdict`, `EngineVerdict`, and `RulesConfig` from
`types.ts`. If these drift from `docs/architecture/interface-contracts.md`, the engine won't compose
with task 06 (accounts) or task 07 (dashboard). The existing prototype `types.ts` has the **wrong**
shape — this session replaces it. **Heavy tier mandatory: this is the contract.**

### Recommended model
**Claude Sonnet 4.6 in Claude Code.** Opus 4.7 if the `RulesConfig` union design needs extra rigor.

### Prompt to paste

> You are working on Task 05 (Rules Engine) in the FundedEdge monorepo. S0 is complete. Read these
> before writing anything:
> 1. `docs/architecture/interface-contracts.md` § "Rules Engine API" — the **exact** public types and
>    function signatures. This is the source of truth.
> 2. `docs/tasks/05-rules-engine.md` — the task spec (note: its `evaluateTrailingDrawdown` reference
>    shows the `RuleVerdict` fields in use; match them).
> 3. `packages/db/supabase/seed/prop-firms.ts` — the rule parameters each preset will carry
>    (`trailing_drawdown`, `static_max_loss`, `daily_loss_limit`, `profit_target`, `max_contracts`,
>    `consistency_rule_pct`). Your `RulesConfig` must be able to represent every one of these.
>
> **The existing `src/types.ts` is a throwaway prototype with the WRONG shape** (`dailyPnl`,
> `{passed, violations, warnings}`). Replace it entirely. Do not preserve any of it.
>
> **Goal 1 — `packages/rules-engine/src/types.ts`:**
> - `AccountState`, `RuleVerdict`, `EngineVerdict` **exactly** as in interface-contracts.md (field names,
>   union members, `Date` types — all of it).
> - `RulesConfig` — design the shape the rules need. Use a **discriminated union for drawdown**:
>   `{ type: 'trailing'; amount: number; mode: 'eod' | 'intraday'; lock_at_balance: number | null }`
>   versus `{ type: 'static'; amount: number }`. Include optional sub-configs for the other rules:
>   `dailyLoss` (amount + `resetTime` like `"17:00 America/Chicago"`), `profitTarget`
>   (amount + `mode: 'absolute' | 'eod'`), `consistency` (`bestDayPct` and/or `minTradingDays`),
>   `contractScaling` (tiered thresholds → max contracts), `newsTrading` (restriction window minutes).
>   Each sub-config is optional/nullable so a rule reports `notApplicable` when its config is absent.
> - Add a `thresholds` field on `RulesConfig` (or a top-level constant) for the warning/danger cut-offs,
>   defaulting to warning at 20% remaining and danger at 5% remaining (the spec makes these configurable).
> - Export a shared `RuleVerdict['status']` helper type and a `notApplicable()`-style sentinel if useful.
>
> **Goal 2 — `packages/rules-engine/src/schemas.ts`:**
> - Zod schemas mirroring `AccountState` and `RulesConfig` (`accountStateSchema`, `rulesConfigSchema`).
>   These validate untrusted input at the boundary (per CLAUDE.md principle 6). `zod` is the **only**
>   permitted runtime dependency.
> - Use `z.infer` round-trips or `satisfies` to assert the schemas stay in lockstep with the TS types —
>   a drift between schema and type should fail typecheck.
>
> **Goal 3 — `packages/rules-engine/src/index.ts`:**
> - Export the public surface exactly as interface-contracts.md specifies:
>   ```ts
>   export { evaluate } from './evaluate';
>   export { getPreset, listPresets } from './presets';
>   export type { AccountState, RuleVerdict, EngineVerdict, RulesConfig } from './types';
>   ```
>   (`evaluate` / `getPreset` / `listPresets` are still stubs from S0 — that's fine, they exist.)
>
> **Verify before reporting done:**
> ```bash
> pnpm --filter @fundededge/rules-engine typecheck
> ```
> Must pass with zero errors. **No `any`, no `@ts-ignore`** (CLAUDE.md principle 7).

### Verify
```bash
pnpm --filter @fundededge/rules-engine typecheck
grep -n "export function evaluate\|export type { AccountState" packages/rules-engine/src/index.ts
```
Typecheck passes. Public exports match the contract.

### Common failures
- **`RuleVerdict` fields don't match the contract** — it must have `ruleId, ruleName, status, message,
  currentValue, threshold, distance, percentOfLimit`. The trailing-drawdown reference in the spec uses
  all of them.
- **`evaluate` re-imports the deleted `engine.ts`** — `index.ts` must point at `./evaluate`.
- **Zod added as a `devDependency`** — it's a runtime dep; it must be in `dependencies`.

### Handoff to S2 and S8
> S1 done. Contract types + zod schemas land, typecheck green. The **rules track** (S2) and the
> **presets track** (S8) can now run in parallel.

---

## S2 — Helpers: math / time / format 🟡 Medium

### Why
The rules share math (clamping, percent-of-limit), money formatting, and — the hard part — a
timezone-aware "is this the same trading day?" check. Getting `time.ts` wrong silently breaks the daily
loss reset across DST boundaries. Medium tier, but `time.ts` gets Heavy-level care.

### Recommended model
**Claude Sonnet 4.6 in Claude Code.**

### Prompt to paste

> Continue Task 05 in the FundedEdge monorepo. S0 and S1 are complete. Read `docs/tasks/05-rules-engine.md`
> § "Daily loss with timezone" and § "Performance" first.
>
> **`packages/rules-engine/src/helpers/math.ts`:**
> - `clamp(value: number, min: number, max: number): number`
> - `percentOfLimit(distance: number, limit: number): number` — returns `clamp(distance / limit, 0, 1)`,
>   guarding `limit === 0` (return 0, never `NaN`/`Infinity`).
> - `worstStatus(statuses: RuleVerdict['status'][]): RuleVerdict['status']` — ordering
>   `ok < warning < danger < breached`. (S7 reuses this.)
> - Keep everything pure and total — no throwing on weird input; clamp/guard instead.
>
> **`packages/rules-engine/src/helpers/time.ts`:**
> - `isSameTradingDay(a: Date, b: Date, tz: string, resetTime: string): boolean` per the spec. A trading
>   day starts at `resetTime` (e.g. `"17:00 America/Chicago"`) and runs 24h. Two instants are the same
>   trading day iff they fall in the same `[reset, reset+24h)` window **in the given timezone**.
> - **Use `Intl.DateTimeFormat` with `timeZone` to read wall-clock parts** — do NOT use `Date.getHours()`
>   (that's the host TZ) or manual UTC-offset arithmetic (breaks on DST). Parse `resetTime` into
>   `"HH:mm"` + IANA zone.
> - Add a small private helper that returns the "trading-day key" (e.g. the date-string of the window
>   start) so equality is a string compare — easier to test and reason about.
>
> **`packages/rules-engine/src/helpers/format.ts`:**
> - `money(n: number): string` → `"$1,234"` (no decimals for whole dollars, matching the spec's
>   `toFixed(0)` style in messages).
> - `breachMessage(...)` / `distanceMessage(...)` builders so rule files don't hand-roll strings.
>
> **Inline-verify `time.ts` before reporting done.** Write a few throwaway assertions (or a scratch
> Vitest block) covering: same window → true; across the reset boundary → false; a US DST spring-forward
> day (e.g. 2026-03-08 America/Chicago) → still correct. Remove the scratch block before finishing (real
> tests come in S10), but confirm it passed.
>
> **Verify:**
> ```bash
> pnpm --filter @fundededge/rules-engine typecheck
> ```
> Must pass.

### Verify
```bash
pnpm --filter @fundededge/rules-engine typecheck
grep -n "Intl.DateTimeFormat" packages/rules-engine/src/helpers/time.ts
```
Typecheck passes. `time.ts` uses `Intl.DateTimeFormat` (not `getHours`).

### Common failures
- **DST off-by-one** — a fixed `±06:00` offset for Chicago is wrong half the year. `Intl` with a named
  zone handles it; manual offsets don't.
- **`percentOfLimit` returns `NaN`** — guard `limit === 0`.

### Handoff to S3–S6
> S2 done. Helpers ready and `time.ts` spot-verified across DST. S3 (trailing drawdown), S4, S5, and S6
> can now run — in parallel if you like.

---

## S3 — Rule: trailing drawdown 🔴 Heavy

### Why
The hardest rule and the one most likely to mis-flag real money. Apex's trailing drawdown trails the
highest balance, locks at `starting + profit_target`, and is checked intraday against equity
(`currentBalance + openPnl`). A wrong comparison here breaches a funded account that's actually fine, or
clears one that's actually blown. **Heavy tier mandatory.**

### Recommended model
**Claude Sonnet 4.6 minimum. Opus 4.7** recommended — this is the rule the whole product is named for.

### Prompt to paste

> Continue Task 05 in the FundedEdge monorepo. S1 and S2 are complete. Read
> `docs/tasks/05-rules-engine.md` § "Trailing drawdown — Apex variant" — it contains a reference
> implementation. Use it as your baseline, then generalize.
>
> **Goal — `packages/rules-engine/src/rules/trailing-drawdown.ts`:**
> Export `evaluateTrailingDrawdown(state: AccountState): RuleVerdict`.
> - Return a `notApplicable` verdict (status `'ok'`, neutral message) when
>   `state.rulesConfig.drawdown.type !== 'trailing'`.
> - Trail from `state.highestBalance`, but **lock** the trail at `startingBalance + lock_at_balance`
>   once `highestBalance` reaches that mark (the spec's reference shows the exact comparison).
> - Support both `mode: 'eod'` and `mode: 'intraday'`. For `intraday`, equity =
>   `currentBalance + openPnl`. For `eod`, evaluate against `currentBalance` only (open P&L doesn't count
>   until close).
> - `status`: `breached` when equity `<=` limit; `danger` within 5% of `ddAmount`; `warning` within 20%;
>   else `ok`. Read the warning/danger percentages from `rulesConfig.thresholds` (default 20/5), don't
>   hardcode.
> - Fill every `RuleVerdict` field: `ruleId: 'trailing-drawdown'`, `ruleName: 'Trailing Drawdown'`,
>   `currentValue` = equity, `threshold` = limit, `distance` = equity − limit,
>   `percentOfLimit` = `percentOfLimit(distance, ddAmount)` from `helpers/math.ts`.
> - Use `helpers/format.ts` for the messages. Keep the function pure and deterministic.
>
> **Verify:**
> ```bash
> pnpm --filter @fundededge/rules-engine typecheck
> ```
> Must pass. (Tests come in S10 — but if you want a sanity scratch run, do it and remove it.)

### Verify
```bash
pnpm --filter @fundededge/rules-engine typecheck
```
Typecheck passes; the function handles trailing, lock-at-target, intraday vs EOD, and the four statuses.

### Common failures
- **Lock applied too early/late** — lock only once `highestBalance >= startingBalance + lock_at_balance`,
  and after locking the trail is fixed at that balance, not the running high.
- **EOD using open P&L** — EOD must ignore `openPnl`; only intraday includes it.
- **Hardcoded 0.05 / 0.20** — read thresholds from config.

### Handoff to S7
> S3 done. Trailing drawdown implemented and typechecking. Move to S7 once S4, S5, S6 are also done.

---

## S4 — Rules: static drawdown + daily loss 🟡 Medium

### Why
Two simpler rules. Static drawdown is a flat max-loss floor; daily loss resets on a timezone schedule
using `helpers/time.ts`. Mechanical given S2, but the daily reset is easy to get subtly wrong.

### Recommended model
**Claude Sonnet 4.6 in Claude Code.**

### Prompt to paste

> Continue Task 05. S1, S2 complete. Implement two rule files. Each exports a single
> `evaluate<Name>(state: AccountState): RuleVerdict` and returns a `notApplicable` verdict when its
> config slice is absent. Read `docs/architecture/interface-contracts.md` for the `RuleVerdict` shape
> and reuse `helpers/math.ts` + `helpers/format.ts`.
>
> **`packages/rules-engine/src/rules/static-drawdown.ts`** — `evaluateStaticDrawdown`:
> - Applies when `rulesConfig.drawdown.type === 'static'`.
> - Limit = `startingBalance - amount`. Compare against equity (`currentBalance + openPnl`).
> - Same status ladder (breached/danger/warning/ok) and `RuleVerdict` fields as trailing drawdown,
>   `ruleId: 'static-drawdown'`.
>
> **`packages/rules-engine/src/rules/daily-loss.ts`** — `evaluateDailyLoss`:
> - Applies when `rulesConfig.dailyLoss` is present.
> - Sum the P&L of trades that fall in the **current trading day** (use `isSameTradingDay` against
>   `state.evaluatedAt`, `state.timezone`, and `rulesConfig.dailyLoss.resetTime`), plus `openPnl`.
> - Breach when the day's loss `<= -limit`; danger/warning per thresholds; `ruleId: 'daily-loss'`.
> - `currentValue` = day's net P&L, `threshold` = `-limit`, `distance` = how far from the limit.
>
> **Verify:**
> ```bash
> pnpm --filter @fundededge/rules-engine typecheck
> ```

### Verify
```bash
pnpm --filter @fundededge/rules-engine typecheck
```
Typecheck passes.

### Common failures
- **Daily loss counts all trades, not just today's** — must filter by `isSameTradingDay`.
- **Sign errors** — a loss is negative P&L; the limit is a positive magnitude. Be explicit.

### Handoff to S7
> S4 done. Static drawdown + daily loss implemented. Move to S7 once S3, S5, S6 are also done.

---

## S5 — Rules: profit target + consistency 🟡 Medium

### Why
Profit target has absolute and EOD variants; consistency covers best-day-percentage and
minimum-trading-days. Both read `state.trades`. Medium tier — judgment on the consistency math, no novel
design.

### Recommended model
**Claude Sonnet 4.6 in Claude Code.**

### Prompt to paste

> Continue Task 05. S1, S2 complete. Implement two rule files, same conventions as S4 (single
> `evaluate<Name>` export, `notApplicable` when config absent, reuse helpers).
>
> **`packages/rules-engine/src/rules/profit-target.ts`** — `evaluateProfitTarget`:
> - Applies when `rulesConfig.profitTarget` is present.
> - `absolute` mode: progress = `currentBalance - startingBalance` (+ `openPnl` only if the firm counts
>   open P&L toward target — default no). `eod` mode: closed P&L only.
> - This is a "good" rule: `status` is `ok` until target hit, then surface a positive/`ok` verdict that
>   says the target is reached (don't model "exceeding profit" as danger). Still fill all `RuleVerdict`
>   fields; `ruleId: 'profit-target'`, `threshold` = target amount, `distance` = remaining to target.
>
> **`packages/rules-engine/src/rules/consistency.ts`** — `evaluateConsistency`:
> - Applies when `rulesConfig.consistency` is present.
> - **best-day-pct**: no single trading day's net profit may exceed `bestDayPct` of total net profit.
>   Group `state.trades` into trading days (use `helpers/time.ts`), find the max positive day, compute
>   its share of total profit. `warning`/`danger`/`breached` as the share approaches/exceeds the cap.
> - **min-trading-days**: if `minTradingDays` is set, count distinct trading days with activity; surface
>   `warning` while under the minimum (it's a payout gate, not a hard breach — never emit `breached` for
>   this sub-rule).
> - `ruleId: 'consistency'`. If both sub-rules are configured, return the worse of the two (reuse
>   `worstStatus` from `helpers/math.ts`) in a single verdict, with a message naming the binding one.
>
> **Verify:**
> ```bash
> pnpm --filter @fundededge/rules-engine typecheck
> ```

### Verify
```bash
pnpm --filter @fundededge/rules-engine typecheck
```
Typecheck passes.

### Common failures
- **Consistency divides by zero** when total profit is 0 or negative — guard it (rule is `ok`/N-A when
  there's no profit to be inconsistent about).
- **Profit target modeled as a loss-style limit** — exceeding the target is good, not a breach.

### Handoff to S7
> S5 done. Profit target + consistency implemented. Move to S7 once S3, S4, S6 are also done.

---

## S6 — Rules: contract scaling + news trading 🟡 Medium

### Why
Contract scaling enforces a max-position size that steps up as the account grows; news trading enforces
a no-trade window around high-impact events. Both are deterministic given the state. Medium tier.

### Recommended model
**Claude Sonnet 4.6 in Claude Code.**

### Prompt to paste

> Continue Task 05. S1, S2 complete. Implement two rule files, same conventions as S4/S5.
>
> **`packages/rules-engine/src/rules/contract-scaling.ts`** — `evaluateContractScaling`:
> - Applies when `rulesConfig.contractScaling` is present (a list of tiers: `{ minBalance, maxContracts }`
>   sorted ascending, or a single `maxContracts`).
> - Resolve the allowed max for the current balance, compare to `state.currentPositionContracts`.
> - `breached` when current contracts exceed the allowed max; `warning` when at the cap; else `ok`.
>   `ruleId: 'contract-scaling'`, `currentValue` = current contracts, `threshold` = allowed max.
>
> **`packages/rules-engine/src/rules/news-trading.ts`** — `evaluateNewsTrading`:
> - Applies when `rulesConfig.newsTrading` is present (a restriction window in minutes, plus a list of
>   restricted event times — pass these in via `AccountState` if present, or treat as a pure window
>   calculation if the state carries an "is currently in a news window" flag; keep the function a pure
>   function of its inputs, no clock reads — use `state.evaluatedAt`).
> - When `evaluatedAt` falls within `windowMinutes` before/after a restricted event and the account has
>   an open position, surface `danger`/`breached` per config; else `ok`. `ruleId: 'news-trading'`.
> - **No `Date.now()` / `new Date()` inside the rule** — determinism requires reading time only from
>   `state.evaluatedAt`.
>
> **Verify:**
> ```bash
> pnpm --filter @fundededge/rules-engine typecheck
> ```

### Verify
```bash
pnpm --filter @fundededge/rules-engine typecheck
grep -rn "Date.now\|new Date()" packages/rules-engine/src/rules/ || echo "no wall-clock reads — good"
```
Typecheck passes; rules read time only from `state.evaluatedAt`.

### Common failures
- **News rule reads the wall clock** — breaks determinism (a property test in S11 will catch it). Use
  `state.evaluatedAt`.
- **Scaling tiers unsorted** — sort defensively before resolving the tier.

### Handoff to S7
> S6 done. Contract scaling + news trading implemented. All seven rules now exist — move to S7.

---

## S7 — `evaluate()` orchestrator + alerts 🔴 Heavy

### Why
`evaluate()` is the package's front door and the contract function task 06/07 depend on. It runs every
rule, computes the overall status as the **worst** of all verdicts, and generates threshold-crossing
alerts. A bug here (e.g. overall status not reflecting a breached rule) defeats the whole engine.
**Heavy tier mandatory.**

### Recommended model
**Claude Sonnet 4.6 minimum. Opus 4.7** for the alert-generation edge cases.

### Prompt to paste

> Continue Task 05. S3–S6 complete (all seven rules exist). Read
> `docs/architecture/interface-contracts.md` § "Rules Engine API" for the `EngineVerdict` shape and
> `docs/tasks/05-rules-engine.md` § acceptance criteria for the alert rules.
>
> **Goal — `packages/rules-engine/src/evaluate.ts`:** `export function evaluate(state: AccountState): EngineVerdict`.
> 1. Validate input with `rulesConfigSchema` / `accountStateSchema` from `schemas.ts` at the boundary
>    (parse, don't trust). On invalid input, throw a clear error (this is the one boundary that may throw).
> 2. Run all seven rule evaluators. Collect the non-`notApplicable` verdicts into `verdicts[]`.
> 3. `overallStatus` = `worstStatus(verdicts.map(v => v.status))` from `helpers/math.ts`
>    (`ok < warning < danger < breached`). Empty → `ok`.
> 4. Build `alerts[]`: for each verdict whose status is `warning`/`danger`/`breached`, push an alert
>    with matching `severity` (`warning|danger`; `breached` → `severity: 'danger'`), the verdict's
>    `message`, and `ruleId`. The acceptance criterion frames these as "warning at 20% remaining, danger
>    at 5% remaining, both configurable" — the per-rule status already encodes those thresholds, so the
>    orchestrator just maps status → alert.
> 5. Return `{ overallStatus, verdicts, alerts, evaluatedAt: state.evaluatedAt }`.
> 6. **Deterministic, zero side effects** — no `Date.now()`, no logging, no mutation of `state`.
>
> **Verify:**
> ```bash
> pnpm --filter @fundededge/rules-engine typecheck
> ```
> Must pass. Then a quick scratch call with one fixture-like state to confirm a breached rule yields
> `overallStatus: 'breached'`. Remove the scratch code before finishing.

### Verify
```bash
pnpm --filter @fundededge/rules-engine typecheck
```
Typecheck passes; `overallStatus` reflects the worst verdict; alerts map from rule statuses.

### Common failures
- **`overallStatus` ignores a breached rule** — must be the strict worst-of; the S11 property test
  asserts `breached ⟹` some rule breached.
- **`evaluatedAt` re-derived from the clock** — copy it from `state.evaluatedAt` for determinism.

### Handoff to S9
> S7 done. `evaluate()` orchestrates all rules with worst-of status and alerts. Move to S9 once S8
> (presets) is also done.

---

## S8 — Presets (apex / tpt / tradeify / lucid) 🔴 Heavy

### Why
Presets translate each firm's published rules into a `RulesConfig`. Wrong numbers here mis-flag every
user on that account size. The numbers already live, vetted-with-citations, in the DB seed — this
session mirrors them into engine configs. **Heavy tier mandatory** (correctness + the firm-rules
nuance).

### Recommended model
**Claude Sonnet 4.6 in Claude Code.** Opus 4.7 if any firm's drawdown semantics are ambiguous.

### Prompt to paste

> Continue Task 05. S1 complete. **Source of truth: `packages/db/supabase/seed/prop-firms.ts`** — it has
> all four firms, every account size, with cited values for `starting_balance`, `profit_target`,
> `trailing_drawdown`, `static_max_loss`, `daily_loss_limit`, `max_contracts`, `consistency_rule_pct`,
> `rules_version`, and per-firm comment blocks explaining drawdown type, DLL applicability, consistency,
> and min trading days.
>
> **Important — the task spec's counts are stale.** `05-rules-engine.md` says "Apex (5), TPT (4),
> Tradeify (4), Lucid (3)". The seed is authoritative and has **29 account types**:
> - **Apex** (4): `apex-25k`, `apex-50k`, `apex-100k`, `apex-150k`
> - **TPT** (5): `tpt-25k`, `tpt-50k`, `tpt-75k`, `tpt-100k`, `tpt-150k`
> - **Tradeify** (8): `tradeify-select-{25,50,100,150}k`, `tradeify-growth-{25,50,100,150}k`
> - **Lucid** (12): `lucid-pro-{25,50,100,150}k`, `lucid-flex-{...}`, `lucid-direct-{...}`
> Implement **all 29**, keyed by the seed's account-type `slug`.
>
> **Goal — one file per firm** (`src/presets/apex.ts`, `tpt.ts`, `tradeify.ts`, `lucid.ts`):
> - Each exports its account configs as `{ slug, name, firm, accountSize, rulesConfig }` objects, where
>   `rulesConfig` is a valid `RulesConfig` built from the seed numbers. Translate each seed field into
>   the right `RulesConfig` slice (e.g. `trailing_drawdown` → `drawdown: { type: 'trailing', amount, mode, lock_at_balance: profit_target }`;
>   `static_max_loss` → `drawdown: { type: 'static', amount }`; `daily_loss_limit` → `dailyLoss`;
>   `consistency_rule_pct` → `consistency.bestDayPct`; `max_contracts` → `contractScaling`).
> - **Honor the seed's comment-block nuances**: e.g. Apex consistency applies to PA payouts not eval (so
>   eval presets leave `consistency` null per the seed's `consistency_rule_pct: null`); TPT removed the
>   daily loss limit (so `dailyLoss` is null) and has a 50% consistency + 5 min trading days; choose the
>   default product per firm exactly as the seed comments state.
> - Copy the citation comments (source URLs + "checked" date) from the seed into each preset file so the
>   provenance travels with the code.
>
> **Goal — `src/presets/index.ts`:**
> - Aggregate all four firms into one registry.
> - `getPreset(slug: string): RulesConfig` — throws on unknown slug.
> - `listPresets(): Array<{ slug; name; firm; accountSize }>` — returns all 29.
>
> **Cross-check before reporting done:** print a table of every seed account-type slug next to whether a
> preset exists for it. `listPresets()` must return exactly 29 entries and every seed slug must resolve
> via `getPreset`. If any seed value is ambiguous, **stop and ask the user** — do not guess firm rules.
>
> **Verify:**
> ```bash
> pnpm --filter @fundededge/rules-engine typecheck
> ```

### Verify
```bash
pnpm --filter @fundededge/rules-engine typecheck
node -e "const {listPresets}=require('./packages/rules-engine/src/presets'); console.log(listPresets().length)" 2>/dev/null || echo "(count via the S10 test instead)"
```
Typecheck passes. `listPresets()` returns 29; every seed slug resolves.

### Common failures
- **Used the spec's stale counts** — implement all 29 from the seed, not 16.
- **Drawdown type swapped** — most accounts are trailing; check each firm's seed comment. Static is the
  exception, not the default.
- **Citations dropped** — keep the seed's source URLs/dates in the preset files (CLAUDE.md requires firm
  rules to cite their source).

### Handoff to S9
> S8 done. All 29 presets implemented from the seed with `getPreset`/`listPresets`. Move to S9.

---

## S9 — Fixtures (5 states per firm) 🟡 Medium

### Why
The preset and property tests need realistic `AccountState` objects. Five canonical states per firm
(fresh / mid-evaluation / near-breach / breached / target-hit) double as the perf-test input
(`apex50kMidEvaluation()`). Medium tier — constructs data, no engine logic.

### Recommended model
**Claude Sonnet 4.6 in Claude Code.**

### Prompt to paste

> Continue Task 05. S7 and S8 complete. Build fixture states, one file per firm, using the real preset
> `RulesConfig` from `src/presets/*` so fixtures never drift from the configs they exercise.
>
> **Each of `src/__fixtures__/{apex,tpt,tradeify,lucid}-states.ts`** exports factory functions returning
> `AccountState` for, at minimum, one representative account size per firm:
> - `fresh*()` — brand-new account, no trades, balance = starting.
> - `mid*Evaluation()` — partway to target, comfortably `ok`. (Apex's must be named
>   `apex50kMidEvaluation()` — the spec's perf test imports exactly that.)
> - `near*Breach()` — equity within the danger band of the drawdown limit.
> - `breached*()` — equity below the limit (overall `breached`).
> - `target*Hit()` — profit target reached.
>
> Each factory builds a valid `AccountState` (all contract fields populated: `startingBalance`,
> `currentBalance`, `highestBalance`, `currentPnl`, `openPnl`, `currentPositionContracts`, `status`,
> `trades`, `rulesConfig` from the matching preset, `evaluatedAt` as a **fixed** `Date` for determinism,
> `timezone`). Keep `evaluatedAt` a hardcoded constant, never `new Date()`.
>
> **Verify:**
> ```bash
> pnpm --filter @fundededge/rules-engine typecheck
> ```

### Verify
```bash
pnpm --filter @fundededge/rules-engine typecheck
grep -rn "apex50kMidEvaluation" packages/rules-engine/src/__fixtures__/apex-states.ts
```
Typecheck passes; `apex50kMidEvaluation` exists (the perf test needs it).

### Common failures
- **Fixtures hand-roll `rulesConfig`** — import from the presets so they can't drift.
- **`evaluatedAt: new Date()`** — must be a fixed constant or the perf/property determinism breaks.

### Handoff to S10
> S9 done. Five canonical states per firm. Move to S10 — the test suites.

---

## S10 — Unit tests: per-rule + per-preset 🔴 Heavy

### Why
These tests are the **proof** the engine is correct. The spec demands per-rule coverage (happy /
warning / danger / just-breached / edge) and per-preset coverage (the 5 fixture states), all toward
100% branch coverage. **Heavy tier mandatory** — table-driven, exhaustive, the real work of this task.

### Recommended model
**Claude Sonnet 4.6 minimum. Opus 4.7** for the trailing-drawdown and consistency edge tables.

### Prompt to paste

> Continue Task 05. S9 complete. Read `docs/tasks/05-rules-engine.md` § "Testing requirements". Replace
> the placeholder specs created in S0 with real tests.
>
> **Per-rule tests** — `src/__tests__/rules/<rule>.test.ts`, one per rule (7 files). For each rule:
> - Happy path (`ok`).
> - At warning threshold (exactly on the 20%-remaining boundary).
> - At danger threshold (exactly on the 5%-remaining boundary).
> - Just breached (one cent past the limit).
> - `notApplicable` path (config slice absent → neutral verdict).
> - Rule-specific edges: trailing → lock-at-target engaged vs not, intraday vs EOD; daily-loss → trades
>   spanning the reset boundary + a DST day; consistency → zero/negative total profit guard, min-days
>   under/over; contract-scaling → exactly at the cap, between tiers; news → inside vs outside the window.
> - Use **boundary values** so the `<=` vs `<` branches are both hit (this is what gets branch coverage
>   to 100%).
>
> **Per-preset tests** — `src/__tests__/presets/<firm>.test.ts`, one per firm (4 files):
> - Run `evaluate()` on each of the firm's 5 fixture states (fresh/mid/near-breach/breached/target-hit)
>   and assert the expected `overallStatus` and the binding rule.
> - Assert `listPresets()` contains every account size for that firm and `getPreset(slug)` returns a
>   valid config for each. (Across all four firm tests, all 29 slugs are covered.)
>
> **`src/__tests__/evaluate.test.ts`:**
> - Overall status = worst of verdicts (construct a state where rule A is `warning` and rule B is
>   `danger` → overall `danger`).
> - Alerts generated for every non-`ok` verdict; none for an all-`ok` state.
> - Invalid input throws (schema boundary).
>
> **Verify:**
> ```bash
> pnpm --filter @fundededge/rules-engine test:unit
> ```
> All tests pass. Report the test count.

### Verify
```bash
pnpm --filter @fundededge/rules-engine test:unit
```
All green. Expect a high test count (dozens of cases across 12 spec files).

### Common failures
- **Boundary tests use `<` where the rule uses `<=`** — match the rule's comparison so the exact-boundary
  case lands on the intended status.
- **Preset tests assert wrong binding rule** — e.g. a TPT breach is drawdown, not daily-loss (TPT removed
  the DLL — see the seed). Re-read the firm's seed comment.

### Handoff to S11
> S10 done. Per-rule + per-preset suites green. Move to S11 — property + performance.

---

## S11 — Property invariants + performance tests 🔴 Heavy

### Why
Table-driven tests cover the cases we thought of; property tests cover the millions we didn't, and the
perf test enforces the `<2ms` budget (CLAUDE.md principle 10). **Heavy tier mandatory** — `fast-check`
arbitraries that generate valid states without trivializing the invariants take real care.

### Recommended model
**Claude Sonnet 4.6 minimum. Opus 4.7** for the arbitrary design.

### Prompt to paste

> Continue Task 05. S10 complete. Read `docs/tasks/05-rules-engine.md` § "Property-based tests" and
> § "Performance".
>
> **`src/__tests__/property/invariants.test.ts`** using `fast-check`:
> - Build an `AccountState` arbitrary that generates realistic-but-random balances, P&L, trades, and a
>   randomly chosen real preset `rulesConfig` (use `listPresets()` + `getPreset`). Keep `evaluatedAt`
>   fixed or generated within a bounded range.
> - Assert the invariants:
>   1. `evaluate(s)` never throws for any valid state.
>   2. `overallStatus === 'breached'` ⟹ at least one verdict has status `'breached'`.
>   3. Determinism: `evaluate(s)` deep-equals `evaluate(s)` for the same input.
>   4. Monotonicity: adding a **positive** closed trade never worsens any rule's status (compare verdict
>      statuses before/after; map status→ordinal and assert non-increasing severity).
> - Run each property for ≥1000 iterations (`fc.assert(..., { numRuns: 1000 })`).
>
> **Performance test** (in `evaluate.test.ts` or a dedicated `perf` spec) — exactly the spec's pattern:
> ```ts
> import { apex50kMidEvaluation } from '../__fixtures__/apex-states';
> test('evaluate runs in under 2ms', () => {
>   const state = apex50kMidEvaluation();
>   const N = 1000;
>   const start = performance.now();
>   for (let i = 0; i < N; i++) evaluate(state);
>   const avg = (performance.now() - start) / N;
>   expect(avg).toBeLessThan(2);
> });
> ```
>
> **Verify:**
> ```bash
> pnpm --filter @fundededge/rules-engine test:unit
> ```
> Property tests stable across at least 3 consecutive runs (no flaky shrinks); perf test green.

### Verify
```bash
for i in 1 2 3; do pnpm --filter @fundededge/rules-engine test:unit || break; done
```
All green on three consecutive runs. Perf test under 2ms average.

### Common failures
- **Monotonicity property fails on the profit-target rule** — a positive trade moving you past target is
  not "worsening"; model profit target so more profit never increases severity.
- **Arbitrary generates impossible states** (e.g. `highestBalance < currentBalance`) that trivially
  break an invariant — constrain the arbitrary to the valid manifold (`highestBalance >= max(starting, current)`).
- **Perf test flaky in CI** — keep the engine allocation-light; if CI is slow, the `<2ms` budget still
  holds because it's an average over 1000 runs, but avoid per-call array re-allocation in hot paths.

### Handoff to S12
> S11 done. Property invariants stable, perf under budget. Move to S12 — coverage gate + CI + docs.

---

## S12 — Coverage gate + CI + README + registry 🟡 Medium

### Why
100% branch coverage is an acceptance criterion, and without CI enforcement it rots on the first PR.
This session locks coverage in, wires the package into CI, documents the public API, and updates the
registry. Medium tier — config + docs, no engine logic.

### Recommended model
**Claude Sonnet 4.6 in Claude Code.**

### Prompt to paste

> Continue Task 05. S11 complete. Final session.
>
> **Goal 1 — 100% branch coverage gate.** In `packages/rules-engine/vitest.config.ts`, enable v8
> coverage with thresholds set to 100 for branches/functions/lines/statements, scoped to `src/**` and
> excluding `__tests__`, `__fixtures__`, and `*.config.ts`:
> ```ts
> test: {
>   coverage: {
>     provider: 'v8',
>     include: ['src/**'],
>     exclude: ['src/**/__tests__/**', 'src/**/__fixtures__/**', '**/*.config.ts'],
>     thresholds: { branches: 100, functions: 100, lines: 100, statements: 100 },
>   },
> }
> ```
> Run `pnpm --filter @fundededge/rules-engine test:cov`. If any branch is uncovered, **add a test**
> (do NOT lower the threshold, do NOT add `/* istanbul ignore */`). Report the final coverage table.
>
> **Goal 2 — CI wiring.** Ensure the rules-engine tests run in CI. Check `.github/workflows/ci.yml`
> first — if it already runs `turbo run test:unit` across the workspace, the package is covered and you
> just confirm it. If a dedicated coverage gate is wanted, add a job (follow the existing workflow's
> pnpm/turbo setup style) that runs `pnpm --filter @fundededge/rules-engine test:cov`. No external
> services or secrets are needed — the engine is pure and offline. Report which path you took.
>
> **Goal 3 — README.** Write `packages/rules-engine/README.md`: what the engine is, the public API
> (`evaluate`, `getPreset`, `listPresets`) with a short usage example, the `AccountState`/`RulesConfig`
> shape summary (link to `docs/architecture/interface-contracts.md` as canonical), the zero-runtime-deps
> rule (only `zod`), and a "presets mirror `packages/db/supabase/seed/prop-firms.ts`" note. Add TSDoc to
> the exported functions in `src/index.ts` / `src/evaluate.ts` / `src/presets/index.ts`.
>
> **Goal 4 — Registry.** Update `CLAUDE.md` component registry: row 05 → 🟢 Done. **Note in the PR** that
> the acceptance item "Founder reviewed each preset against firm's current published rules" is a 🟣 User
> gate that remains open until you (the founder) sign off — the code is complete, the human verification
> is yours.
>
> **Verify:**
> ```bash
> pnpm --filter @fundededge/rules-engine typecheck
> pnpm --filter @fundededge/rules-engine test:cov
> pnpm biome lint packages/rules-engine/src
> ```
> All pass; coverage 100% on all four metrics. Fix any Biome findings (don't disable rules).

### Verify
```bash
pnpm --filter @fundededge/rules-engine test:cov
grep "05.*Done" CLAUDE.md
```
Coverage 100% across branches/functions/lines/statements. CLAUDE.md shows 🟢 Done for component 05.

### Common failures
- **A `notApplicable` branch in a rule is never hit** — add a test where that rule's config slice is
  absent; that's the most common uncovered branch.
- **Coverage excludes too much** — don't exclude `src/rules` or `src/presets`; they must be 100%.
- **Lowering the threshold to pass** — forbidden. The criterion is 100%, no exceptions.

### Task 05 complete ✅ (pending founder rule re-verification)
Update `CLAUDE.md` registry one final time if S12 missed it. The founder review of presets against each
firm's live rules is the last gate before this is truly production-trusted.

---

## 4. Quality gates between sessions

Don't move from session N to session N+1 until:

1. The verify step for N passes.
2. The session's output is committed to git on a branch.
3. If the session opened a PR, it is merged OR the next session continues on the same branch.
4. The status table below has N marked 🟢.

---

## 5. Failure recovery

If a session goes sideways (model made a mess, build broke, etc.):

1. **Don't merge anything.** Close the PR, delete the branch.
2. Run `git status` and `git stash` any work-in-progress.
3. Restart the session with the same prompt — be explicit about what went wrong last time: "Last attempt
   did X which was wrong because Y. Try again without doing X."
4. If two attempts fail, **escalate the tier**: light → medium → heavy.

---

## 6. Session status

Update this table as each session completes.

| # | Session | Status | PR | Notes |
|---|---------|--------|----|-------|
| S0 | Scaffold package + deps + stub tree | 🔴 Not started | — | |
| S1 | Types + schemas (contract alignment) | 🔴 Not started | — | |
| S2 | Helpers: math / time / format | 🔴 Not started | — | |
| S3 | Rule: trailing drawdown | 🔴 Not started | — | |
| S4 | Rules: static drawdown + daily loss | 🔴 Not started | — | |
| S5 | Rules: profit target + consistency | 🔴 Not started | — | |
| S6 | Rules: contract scaling + news trading | 🔴 Not started | — | |
| S7 | `evaluate()` orchestrator + alerts | 🔴 Not started | — | |
| S8 | Presets (apex / tpt / tradeify / lucid) | 🔴 Not started | — | |
| S9 | Fixtures (5 states per firm) | 🔴 Not started | — | |
| S10 | Unit tests: per-rule + per-preset | 🔴 Not started | — | |
| S11 | Property invariants + performance tests | 🔴 Not started | — | |
| S12 | Coverage gate + CI + README + registry | 🔴 Not started | — | |

**Status legend:** 🔴 Not started · 🟡 In progress · 🔵 In review · 🟢 Done

---

## 7. Future-proofing notes

- **The spec (`05-rules-engine.md`) drifts from reality in two places** — its preset counts ("5/4/4/3")
  and its existing prototype code. This breakdown resolves both: presets follow
  `packages/db/supabase/seed/prop-firms.ts` (29 account types), and the prototype `engine.ts` is
  replaced by the contract API. If the spec is ever updated, reconcile it with this doc in the same PR.
- **Prop firm rules change.** When a firm updates its rules, the change flows seed → preset → fixtures →
  tests. Update `packages/db/supabase/seed/prop-firms.ts` first (it carries the citations), then mirror
  into `src/presets/*`, then refresh the affected fixtures and preset tests. Version, don't mutate, when
  existing users are pinned to an older rule set.
- **`time.ts` and DST.** The daily-loss reset is the most fragile piece. Any change to `isSameTradingDay`
  must keep the `Intl.DateTimeFormat` + named-zone approach and re-run the DST boundary tests (S10).
- **If S8 (presets) is too large** — split it per firm: S8a Apex+TPT, S8b Tradeify+Lucid. The Heavy
  rating stands for both halves. Same for S10 if 12 test files in one session is too much: do rules
  (S10a) and presets (S10b) separately.
- **Founder re-verification is a standing 🟣 gate.** Even at 🟢 Done, treat the presets as
  "verified as of the seed's checked date" until the founder signs off against each firm's live rules.
