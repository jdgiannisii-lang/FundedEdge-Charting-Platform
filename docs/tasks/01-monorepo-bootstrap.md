# Task 01: Monorepo Bootstrap

## Goal
Stand up the Turborepo + pnpm monorepo with Next.js 15 web app, marketing site placeholder, all empty packages, tooling (Biome, Vitest, Playwright, Storybook), CI pipeline, and Vercel deployment. After this task, every subsequent component has somewhere to live.

## Out of scope
- Supabase integration (task 02)
- Auth flows (task 03)
- Any business logic
- Content for marketing site beyond a placeholder

## Dependencies
None.

## Acceptance criteria

- [ ] Repository structure matches `CLAUDE.md` § Repository structure
- [ ] `pnpm install` from repo root installs all workspaces
- [ ] `pnpm dev` runs both `apps/web` and `apps/marketing` concurrently with hot reload
- [ ] `pnpm build` builds all apps and packages, with Turbo cache hit on second run
- [ ] `pnpm typecheck` passes across all workspaces
- [ ] `pnpm lint` passes via Biome
- [ ] `pnpm test:unit` runs Vitest across all packages (no tests required yet, just config)
- [ ] `pnpm test:e2e` runs Playwright (smoke test confirming homepage loads)
- [ ] `pnpm storybook` runs Storybook with one example component
- [ ] `apps/web` is a Next.js 15 app using App Router with TypeScript strict mode
- [ ] `apps/web/src/app/page.tsx` shows "FundedEdge" placeholder
- [ ] `apps/web/src/app/app/page.tsx` shows "Cockpit (placeholder)"
- [ ] `apps/marketing` is a separate Next.js 15 app
- [ ] All `packages/*` have a `package.json`, `tsconfig.json`, and `src/index.ts` with a placeholder export
- [ ] `packages/config` exports shared `tsconfig.json`, `biome.json`, and Vitest config
- [ ] `.github/workflows/ci.yml` runs typecheck, lint, unit, and build on every PR
- [ ] `.github/workflows/e2e.yml` runs Playwright on every PR
- [ ] Vercel project created for `apps/web` with preview deploys per PR
- [ ] Vercel project created for `apps/marketing` (can be configured separately)
- [ ] Conventional Commits enforced via `commitlint` + Husky
- [ ] `README.md` updated with quick-start commands

## Files to create

```
package.json                      # root, with workspace scripts
pnpm-workspace.yaml
turbo.json
biome.json
.gitignore
.npmrc                            # pnpm config
.editorconfig
.nvmrc                            # Node 20.x
README.md

apps/web/
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── app/
│   │       └── page.tsx
│   ├── lib/
│   │   └── utils.ts
│   └── styles/
│       └── tokens.css
├── playwright.config.ts
└── e2e/
    └── smoke.spec.ts

apps/marketing/
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── src/app/
    ├── layout.tsx
    ├── page.tsx
    └── globals.css

packages/
├── ui/
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts
│   │   └── components/
│   │       └── button.tsx
│   └── stories/
│       └── button.stories.tsx
├── rules-engine/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       └── index.test.ts
├── data/
│   ├── package.json
│   └── src/index.ts
├── types/
│   ├── package.json
│   └── src/index.ts
├── db/
│   ├── package.json
│   └── src/index.ts
├── chart/
│   ├── package.json
│   └── src/index.ts
├── config/
│   ├── package.json
│   ├── tsconfig.base.json
│   ├── biome.json
│   └── vitest.config.base.ts
└── utils/
    ├── package.json
    └── src/index.ts

.github/
├── workflows/
│   ├── ci.yml
│   └── e2e.yml
├── pull_request_template.md
└── dependabot.yml

.husky/
├── pre-commit
├── commit-msg
└── pre-push

.storybook/
├── main.ts
└── preview.ts

commitlint.config.cjs
```

## Implementation notes

### `package.json` (root)

```json
{
  "name": "fundededge",
  "private": true,
  "engines": { "node": ">=20.0.0", "pnpm": ">=9.0.0" },
  "packageManager": "pnpm@9.15.0",
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "typecheck": "turbo typecheck",
    "lint": "turbo lint",
    "lint:fix": "turbo lint:fix",
    "test:unit": "turbo test:unit",
    "test:e2e": "turbo test:e2e",
    "storybook": "turbo storybook",
    "format": "biome format --write .",
    "clean": "turbo clean && rm -rf node_modules"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "@changesets/cli": "^2.27.0",
    "@commitlint/cli": "^19.0.0",
    "@commitlint/config-conventional": "^19.0.0",
    "husky": "^9.0.0",
    "turbo": "^2.3.0",
    "typescript": "^5.6.0"
  }
}
```

### `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### `turbo.json`

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": [".next/**", "!.next/cache/**", "dist/**"] },
    "dev": { "cache": false, "persistent": true },
    "typecheck": { "dependsOn": ["^build"] },
    "lint": {},
    "lint:fix": {},
    "test:unit": { "dependsOn": ["^build"], "outputs": ["coverage/**"] },
    "test:e2e": { "dependsOn": ["^build"] },
    "storybook": { "cache": false, "persistent": true },
    "clean": { "cache": false }
  }
}
```

### Biome config (`biome.json`)

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "ignoreUnknown": false, "ignore": ["**/.next", "**/dist", "**/node_modules", "**/.turbo"] },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": { "noExplicitAny": "error" },
      "style": { "noNonNullAssertion": "warn" },
      "correctness": { "noUnusedVariables": "error" }
    }
  }
}
```

### CI (`.github/workflows/ci.yml`)

```yaml
name: CI
on: { pull_request: {}, push: { branches: [main] } }
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9.15.0 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test:unit
      - run: pnpm build
```

### Vercel setup

Two projects, both pointing at this repo:

| Project | Root Directory | Build Command | Output Directory |
|---|---|---|---|
| `fundededge-web` | `apps/web` | `cd ../.. && pnpm build --filter=web` | `apps/web/.next` |
| `fundededge-marketing` | `apps/marketing` | `cd ../.. && pnpm build --filter=marketing` | `apps/marketing/.next` |

## Testing requirements

- One Vitest test in `packages/rules-engine/src/index.test.ts` confirming the placeholder export works
- One Playwright test in `apps/web/e2e/smoke.spec.ts` confirming the homepage renders the word "FundedEdge"
- One Storybook story in `packages/ui/stories/button.stories.tsx` rendering the placeholder Button

## Definition of done

- [ ] All acceptance criteria checked
- [ ] CI green on PR
- [ ] Vercel preview deploy of `apps/web` shows the placeholder homepage
- [ ] Vercel preview deploy of `apps/marketing` shows the coming-soon page
- [ ] Storybook hosted somewhere showing the Button story
- [ ] CLAUDE.md component registry updated: 01 → 🟢 Done
- [ ] PR description includes the deployed preview URLs
