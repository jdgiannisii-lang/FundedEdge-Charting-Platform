# Git Workflow

## Branches

- **`main`** — production. Always deployable. Protected: no direct pushes, requires passing CI + 1 approval.
- **`feat/<id>-<name>`**, **`fix/<name>`**, **`chore/<name>`**, **`refactor/<name>`** — feature branches.
- **No long-lived dev branches.** Trunk-based: branch from main, PR back to main.

## Commits

Conventional Commits, enforced by commitlint pre-push hook.

```
feat(rules-engine): add Apex trailing drawdown lock-at-target
fix(prop-dashboard): correct daily loss calculation across DST
chore(deps): bump @supabase/ssr to 0.8.0
docs(architecture): add ADR for chart datafeed protocol
test(rules-engine): cover TPT consistency rule edge cases
refactor(checklist): extract reusable item input component
```

Scope is the package or feature affected. Use lowercase. Subject in imperative mood, no period.

## Pull requests

PR template:

```markdown
## What this PR does
<one-line summary>

## Why
<context — link to task file or issue>

## How
<key implementation notes — what changed and why this approach>

## Testing
<what tests cover this, how to manually verify>

## Screenshots
<for any UI change>

## Checklist
- [ ] CI green
- [ ] Tests added/updated
- [ ] Storybook story added/updated (UI changes)
- [ ] CLAUDE.md component registry updated
- [ ] Docs updated if behavior changed
- [ ] No new `any`, no new `@ts-ignore`
```

## Releases

- **Internal:** every merge to main deploys to production via Vercel. No manual release step.
- **Database migrations:** ship in their own PR, deployed manually via `supabase db push` after review. Never auto-apply migrations from CI to production until we have v1.0 launched and a rollback playbook.
- **Versioning:** Changesets manages package versions. Run `pnpm changeset` when changing a package's public API.
