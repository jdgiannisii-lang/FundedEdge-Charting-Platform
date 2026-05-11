# Context Handoff — v2

## Repo
`jdgiannisii-lang/FundedEdge-Charting-Platform`

## Current state of branches
- `main` — has the legacy GC trading prototype (`index.html`, `api/`, `GC.html`, `vercel.json`) + the docs/planning package merged in from earlier work
- `claude/create-package-files-T3H8X` — open as PR #13, ahead of main by a few commits (handoff file + Day-1 clarification + merge conflict resolution). **Mergeable as of commit `2b0be39`.**

## What physically exists in the repo right now
Only docs and the legacy prototype. **No actual code scaffold yet.** Specifically missing:
- No root `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `biome.json`
- No `apps/` directory (no Next.js apps)
- No `packages/` directory (no shared packages)
- No `.github/workflows/` (no CI)
- No `.husky/`, `.nvmrc`, `.npmrc`, `commitlint.config.cjs`

## Files that DO exist (all docs)
```
CLAUDE.md                                        # project source of truth
LEGACY.md                                        # v0 GC terminal context
README.md
docs/roadmap.md
docs/context-handoff.md                          # the previous (v1) handoff
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

## Outstanding items the user is aware of
1. **PR #13** needs to be merged into `main` (no conflicts remaining).
2. **Task 01 not yet started** — the daily routines in `docs/tasks/01-monorepo-bootstrap-daily.md` are the next thing to run, beginning with Day 1.
3. **User has the repo cloned locally** and was asking how to sync local AI edits (Claude Code CLI, OpenCode, Ollama) with browser-Claude edits.

## User's local-vs-browser workflow rules (already explained to them)
- Browser Claude edits go directly to GitHub on `claude/*` branches.
- Local AI edits live on the user's machine until they `git push`.
- **Rule:** never work on the same branch from both places simultaneously.
- Standard sync flow:
  ```bash
  cd FundedEdge-Charting-Platform
  git status
  git fetch origin
  git pull origin <branch>
  ```
- Conflicts get pasted back here for resolution.
- User runs git in: Git Bash / Windows Terminal / VS Code terminal.

## Next action
1. Merge PR #13 on GitHub.
2. Run **Day 1** prompt from `docs/tasks/01-monorepo-bootstrap-daily.md` (creates root config files only — package.json, pnpm-workspace.yaml, turbo.json, biome.json, .gitignore, .editorconfig, .nvmrc, .npmrc, commitlint.config.cjs, README.md update — on branch `feat/01-monorepo-bootstrap`).
3. Days 2–5 follow in order, one per scheduled routine slot.

## Stack (locked — no deviations without ADR)
Next.js 15, TypeScript strict, Tailwind v4, shadcn/ui, Zustand, TanStack Query, Supabase, TradingView Advanced Charts, Databento, Vercel, Resend, Sentry, PostHog, Turborepo, pnpm, Biome, Vitest, Playwright, Storybook 8.

## Key rules
- No `any`, no `@ts-ignore` without comment + linked issue.
- RLS on every Supabase table, always.
- Server Components by default; `"use client"` only when needed.
- Zod validation at every boundary.
- `packages/rules-engine` is pure TS — zero side effects, zero deps beyond Zod.
- Zustand = ephemeral UI state. TanStack Query = server state. Never mix.

## How to start the next session
Paste this into a new Claude Code conversation:
```
Read docs/context-handoff-v2.md, then docs/tasks/01-monorepo-bootstrap-daily.md. Confirm current state, then wait for instructions.
```
