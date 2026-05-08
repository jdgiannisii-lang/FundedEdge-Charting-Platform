# ADR 0001: Turborepo monorepo with pnpm

**Date:** 2026-Day-0
**Status:** Accepted

## Context

FundedEdge will have multiple distinct applications (web app, marketing site, possibly mobile later) and many shared packages (rules engine, UI library, types, data clients). We need a structure that:

1. Lets us share code between apps without npm publishing overhead
2. Has fast, cached builds so CI doesn't take 20 minutes
3. Lets independent components be developed and reviewed independently
4. Scales to a small team, not just solo dev

## Decision

Turborepo + pnpm workspaces.

```
fundededge/
├── apps/
│   ├── web/
│   └── marketing/
├── packages/
│   ├── ui/
│   ├── rules-engine/
│   ├── data/
│   ├── types/
│   ├── db/
│   ├── chart/
│   ├── config/
│   └── utils/
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

Pinned to:
- `pnpm` 9.x (10x faster installs than npm, deterministic)
- `turbo` 2.x (fast incremental builds, remote caching, per-task dependency graph)

## Alternatives considered

- **Nx** — more powerful but heavier and steeper learning curve. Turborepo is enough for our needs.
- **Single repo, no monorepo tooling** — fine for one app but we already have a marketing site planned + want to publish the rules engine eventually.
- **Multi-repo (separate repos for app, marketing, packages)** — what the legacy `verc` split tried. Painful to keep in sync, painful for cross-repo refactors. Hard pass.

## Consequences

**Good:**
- Cross-package refactors atomic in one PR
- Single CI pipeline, single deploy command
- Shared tooling configs across all packages
- Turbo's caching cuts CI time to <2min on cached changes

**Bad:**
- Onboarding has a higher floor — devs must learn pnpm + turbo
- Initial setup more complex than `npx create-next-app` (~1 day vs ~1 hour)
- Editor performance can degrade in very large monorepos (we're nowhere near that scale)

## Implementation notes

See `docs/tasks/01-monorepo-bootstrap.md` for the implementation guide.
