# Task 01 — Daily Routines (5 Days)

> Companion to `01-monorepo-bootstrap.md`. The full task is split into five
> small, self-contained prompts you can drop into a Claude Code routine /
> scheduled session. Each routine runs end-to-end without follow-up
> questions, produces a single commit, and verifies itself before exiting.
>
> **Do not edit the parent task file.** This is the runbook; that is the spec.

## How to use

1. Pick a routine slot in your scheduler. Run **Day 1** first; it is a
   precondition for every later day.
2. Paste the prompt for that day verbatim. Do not add extra instructions —
   each prompt is tuned to stay within a tight context budget.
3. Run them in order, one per day. If a day's verification step fails, the
   prompt instructs Claude to fix the failure within the same routine
   rather than push broken state.

## Credit-saving rules (built into every prompt)

- No web searches, no `WebFetch`, no `Agent` sub-launches.
- No re-reading files that were just written.
- No `find /` filesystem-wide scans.
- A pre-declared, finite file list per day. No exploration.
- Verification = a single `pnpm` command at the end, not a full test matrix.
- One commit per day. No PRs (open the PR yourself when Day 5 is green).

## Branch

Each routine works on `feat/01-monorepo-bootstrap`. Day 1 creates the
branch from `main`; Days 2–5 check it out.

---

## Day 1 — Workspace skeleton

```
You are continuing Task 01 from docs/tasks/01-monorepo-bootstrap.md.
Today is Day 1 of 5: workspace skeleton only. Do not create app code,
package code, CI, or tooling configs beyond what is listed.

Steps, in order:
1. git checkout main && git pull --ff-only
2. git checkout -b feat/01-monorepo-bootstrap (or check it out if exists)
3. Create EXACTLY these files at repo root, with content per
   docs/tasks/01-monorepo-bootstrap.md "Implementation notes":
     - package.json (root, workspace scripts, devDeps pinned)
     - pnpm-workspace.yaml
     - turbo.json
     - biome.json
     - .gitignore (Node, Next.js, Turbo, .env*, .DS_Store)
     - .editorconfig
     - .nvmrc (contents: 20)
     - .npmrc (auto-install-peers=true, strict-peer-dependencies=false)
     - commitlint.config.cjs (extends @commitlint/config-conventional)
     - README.md (quick-start: install, dev, build, test)
4. Do not run pnpm install. Do not create apps/ or packages/ today.
5. git add -A && git commit -m "chore(repo): add workspace skeleton (Day 1/5)"
6. git push -u origin feat/01-monorepo-bootstrap

If any step fails, fix it before committing. Do not open a PR. Stop after
the push completes. Do not summarize the spec back — just confirm the
commit SHA in one line.
```

---

## Day 2 — Apps placeholders

```
You are continuing Task 01 from docs/tasks/01-monorepo-bootstrap.md.
Today is Day 2 of 5: create apps/web and apps/marketing placeholders only.
Packages, tooling beyond Tailwind, and CI are out of scope.

Preconditions: Day 1 commit is on feat/01-monorepo-bootstrap.

Steps:
1. git checkout feat/01-monorepo-bootstrap && git pull --ff-only
2. Create apps/web as a Next.js 15 App Router app, TypeScript strict:
     - package.json, tsconfig.json (extends a future @fundededge/config
       base; for now inline strict settings)
     - next.config.ts, tailwind.config.ts, postcss.config.mjs
     - src/app/layout.tsx, src/app/page.tsx (renders "FundedEdge")
     - src/app/app/page.tsx (renders "Cockpit (placeholder)")
     - src/app/globals.css, src/styles/tokens.css (empty :root {})
     - src/lib/utils.ts (export cn() using clsx + tailwind-merge)
3. Create apps/marketing similarly:
     - package.json, tsconfig.json, next.config.ts, tailwind.config.ts
     - src/app/layout.tsx, src/app/page.tsx ("FundedEdge — coming soon")
     - src/app/globals.css
4. Do not run pnpm install. Do not add Playwright or Storybook today.
5. git add -A && git commit -m "feat(apps): add web + marketing placeholders (Day 2/5)"
6. git push

Confirm the commit SHA in one line. Stop.
```

---

## Day 3 — Packages skeleton

```
You are continuing Task 01 from docs/tasks/01-monorepo-bootstrap.md.
Today is Day 3 of 5: create all 8 package directories with placeholder
exports. No real implementation. No tests beyond the one Vitest sample.

Preconditions: Day 2 commit is on feat/01-monorepo-bootstrap.

Steps:
1. git checkout feat/01-monorepo-bootstrap && git pull --ff-only
2. For each of these 8 packages, create package.json + tsconfig.json +
   src/index.ts with a single named placeholder export:
     - packages/ui          (export const Button = ...one-line stub)
     - packages/rules-engine (export function evaluate() { return null })
     - packages/data
     - packages/types
     - packages/db
     - packages/chart
     - packages/utils
     - packages/config (also: tsconfig.base.json, biome.json,
                        vitest.config.base.ts as siblings of package.json)
3. Add packages/rules-engine/src/index.test.ts with one Vitest test that
   imports evaluate and asserts it returns null.
4. Add packages/ui/stories/button.stories.tsx with one Storybook story
   for the placeholder Button (no Storybook config yet — that is Day 4).
5. Do not run pnpm install.
6. git add -A && git commit -m "feat(packages): scaffold 8 packages with placeholders (Day 3/5)"
7. git push

Confirm the commit SHA in one line. Stop.
```

---

## Day 4 — Tooling: Vitest, Playwright, Storybook, Husky

```
You are continuing Task 01 from docs/tasks/01-monorepo-bootstrap.md.
Today is Day 4 of 5: wire up local dev tooling. Do not touch CI today.

Preconditions: Day 3 commit is on feat/01-monorepo-bootstrap.

Steps:
1. git checkout feat/01-monorepo-bootstrap && git pull --ff-only
2. Vitest:
     - Confirm packages/config/vitest.config.base.ts exists; ensure each
       package's package.json has a "test:unit": "vitest run" script.
3. Playwright in apps/web:
     - playwright.config.ts (chromium project, baseURL http://localhost:3000)
     - e2e/smoke.spec.ts that visits "/" and asserts "FundedEdge" text
     - "test:e2e": "playwright test" script in apps/web/package.json
4. Storybook:
     - .storybook/main.ts (stories glob: packages/**/stories/*.stories.tsx)
     - .storybook/preview.ts (default export with empty parameters)
     - Root package.json: "storybook": "storybook dev -p 6006" via turbo
5. Husky + commitlint:
     - .husky/pre-commit  → pnpm exec biome check --write --staged
     - .husky/commit-msg  → pnpm exec commitlint --edit "$1"
     - .husky/pre-push    → pnpm typecheck
     - chmod +x on all three (use git update-index --chmod=+x)
6. Do not run pnpm install. Do not run any tests.
7. git add -A && git commit -m "chore(tooling): add vitest, playwright, storybook, husky (Day 4/5)"
8. git push

Confirm the commit SHA in one line. Stop.
```

---

## Day 5 — CI + verification + registry update

```
You are continuing Task 01 from docs/tasks/01-monorepo-bootstrap.md.
Today is Day 5 of 5: GitHub Actions, repo metadata, and final
verification. After today the task is done.

Preconditions: Day 4 commit is on feat/01-monorepo-bootstrap.

Steps:
1. git checkout feat/01-monorepo-bootstrap && git pull --ff-only
2. Create .github/workflows/ci.yml exactly as shown in
   docs/tasks/01-monorepo-bootstrap.md (typecheck, lint, test:unit, build).
3. Create .github/workflows/e2e.yml that runs Playwright on PRs (install
   browsers via "pnpm exec playwright install --with-deps chromium").
4. Create .github/pull_request_template.md (use the template from
   docs/standards/git-workflow.md).
5. Create .github/dependabot.yml (weekly npm + github-actions ecosystems).
6. Update CLAUDE.md component registry: row 01 status from 🔴 → 🟢.
7. git add -A && git commit -m "ci: add workflows + mark task 01 done (Day 5/5)"
8. git push

Do NOT open a PR — leave that to the human. Do NOT run pnpm install or
tests in this routine; CI will run them on push. Confirm the commit SHA
in one line. Stop.
```

---

## After Day 5

The branch `feat/01-monorepo-bootstrap` is ready for human review. Open
the PR yourself, watch CI go green, merge, and Task 02 is unblocked.

If any day's routine commits something that breaks a later day, run the
broken day's prompt again — each prompt is idempotent over its own file
list (it overwrites or no-ops on existing files with the same content).
