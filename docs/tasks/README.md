# Task Files

Each component of FundedEdge is specified as an independently buildable task. A task file contains everything Claude Code (or a human developer) needs to build that component without touching any other.

## How to use

1. Pick a task whose dependencies are all `🟢 Done` (check `CLAUDE.md` registry)
2. Read the task file end-to-end
3. Read any referenced architecture docs
4. Create a feature branch
5. Build per the acceptance criteria
6. Open a PR; ensure CI is green
7. Update CLAUDE.md registry on merge

## Task index

| ID | Task | File |
|---|---|---|
| 01 | Monorepo Bootstrap | `01-monorepo-bootstrap.md` |
| 02 | Supabase Schema + RLS | `02-supabase-schema.md` |
| 03 | Auth System | `03-auth-system.md` |
| 04 | App Shell | `04-app-shell.md` |
| 05 | Rules Engine | `05-rules-engine.md` |
| 06 | Account Management | `06-account-management.md` |
| 07 | Prop Dashboard Panel | `07-prop-dashboard.md` |
| 08 | Chart Container | `08-chart-container.md` |
| 09 | Pre-Trade Checklist | `09-checklist-system.md` |
| 10 | Economic Calendar | `10-economic-calendar.md` |
| 11 | Marketing Site | `11-marketing-site.md` |

## Task file structure

Every task file has these sections:

- **Goal** — one-line description of what this component is
- **Out of scope** — what this task does *not* do
- **Dependencies** — task IDs that must be done first
- **Acceptance criteria** — bulleted list, each independently verifiable
- **Files to create** — exact paths
- **Public API** — types and exports
- **Implementation notes** — guidance, not pseudo-code
- **Testing requirements** — what tests must pass
- **Definition of done** — final checklist

## Critical path

Tasks 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 must complete in order for v1.0. Tasks 09, 10, 11 can be parallelized after 04.
