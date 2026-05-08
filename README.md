# FundedEdge

> The trading cockpit for ICT futures traders running prop firm capital.

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development servers (web + marketing)
pnpm dev

# Build all apps and packages
pnpm build

# Type check all workspaces
pnpm typecheck

# Lint via Biome
pnpm lint

# Run unit tests
pnpm test:unit

# Run E2E tests
pnpm test:e2e

# Open Storybook
pnpm storybook
```

## Repository Structure

```
fundededge/
├── apps/
│   ├── web/          # Main Next.js 15 cockpit application
│   └── marketing/    # Marketing site
├── packages/
│   ├── ui/           # shadcn/ui components, design tokens
│   ├── rules-engine/ # Pure-TS prop firm rules engine
│   ├── data/         # Market data clients
│   ├── types/        # Shared TypeScript types
│   ├── db/           # Supabase types, migrations, RLS policies
│   ├── chart/        # TradingView Advanced Charts wrapper
│   ├── config/       # Shared tsconfig, biome config, Vitest config
│   └── utils/        # Shared pure utilities
└── docs/             # Architecture docs, task specs, standards
```

## Requirements

- Node >= 20.0.0
- pnpm >= 9.0.0

## Documentation

- `CLAUDE.md` — Developer context and architectural principles
- `docs/roadmap.md` — Shipping timeline
- `docs/architecture/system-design.md` — System overview
- `docs/tasks/` — Per-component specs
