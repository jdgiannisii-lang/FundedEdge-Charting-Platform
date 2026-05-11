# Context Handoff

## Repo
`jdgiannisii-lang/FundedEdge-Charting-Platform`
Branch: `claude/create-package-files-T3H8X`

## What was done
- `CLAUDE.md` rewritten as project source of truth
- `LEGACY.md` = old GC trading terminal context (preserved)
- Full planning package committed and pushed to the branch above

## Files created
```
CLAUDE.md                                        # project source of truth
LEGACY.md                                        # v0 GC terminal context
docs/roadmap.md                                  # 90-day phased plan
docs/architecture/system-design.md
docs/architecture/data-model.md
docs/architecture/interface-contracts.md
docs/architecture/adr/0001-monorepo-structure.md
docs/architecture/adr/0002-supabase-stack.md
docs/architecture/adr/0003-charting-strategy.md
docs/architecture/adr/0004-state-management.md
docs/standards/development.md
docs/standards/testing.md
docs/standards/design.md
docs/standards/git-workflow.md
docs/tasks/README.md
docs/tasks/01-monorepo-bootstrap.md              # full spec
docs/tasks/01-monorepo-bootstrap-daily.md        # 5-day routine prompts
docs/tasks/02-supabase-schema.md
docs/tasks/03-auth-system.md
docs/tasks/04-app-shell.md
docs/tasks/05-rules-engine.md
docs/tasks/06-account-management.md
docs/tasks/07-prop-dashboard.md
docs/tasks/08-chart-container.md
docs/tasks/09-checklist-system.md
docs/tasks/10-economic-calendar.md
docs/tasks/11-marketing-site.md
```

## Component registry (all 🔴 Not started)
| ID | Component | Depends On |
|---|---|---|
| 01 | Monorepo Bootstrap | — |
| 02 | Supabase Schema + RLS | 01 |
| 03 | Auth System | 01, 02 |
| 04 | App Shell | 01, 03 |
| 05 | Rules Engine | 01 |
| 06 | Account Management | 02, 03, 05 |
| 07 | Prop Dashboard Panel | 04, 05, 06 |
| 08 | Chart Container | 04 |
| 09 | Pre-Trade Checklist | 02, 04 |
| 10 | Economic Calendar | 04 |
| 11 | Marketing Site | 01 |

## Next action
Task 01 is next. The docs/planning files are committed but the actual monorepo
scaffold does not exist yet (no package.json, no pnpm-workspace.yaml, no apps/,
no packages/, etc.). Run the 5 daily prompts from
`docs/tasks/01-monorepo-bootstrap-daily.md` in order starting with Day 1, on
branch `feat/01-monorepo-bootstrap`. After Day 5 merges, Task 02 is unblocked.

## Stack (locked — no deviations without ADR)
Next.js 15, TypeScript strict, Tailwind v4, shadcn/ui, Zustand, TanStack Query, Supabase, TradingView Advanced Charts, Databento, Vercel, Resend, Sentry, PostHog, Turborepo, pnpm, Biome, Vitest, Playwright, Storybook 8

## Key rules
- No `any`, no `@ts-ignore` without comment + linked issue
- RLS on every Supabase table, always
- Server Components by default, `"use client"` only when needed
- Zod validation at every boundary
- `packages/rules-engine` is pure TS — zero side effects, zero deps beyond Zod
- Zustand = ephemeral UI state. TanStack Query = server state. Never mix.
