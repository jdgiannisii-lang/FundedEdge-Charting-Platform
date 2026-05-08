# Task 06: Account Management

## Goal
UI for users to create, edit, archive, and switch between prop firm accounts. Choose a preset firm and account size, or build a fully custom rule set. The active account drives everything else in the cockpit.

## Out of scope
- The dashboard that *displays* the account (task 07)
- Trade entry (later)
- Subscription gating (when monetization launches)

## Dependencies
- Task 02, 03, 05

## Acceptance criteria

- [ ] User can list all their accounts on `/app/accounts`
- [ ] User can create a new account via:
  - Quick preset (pick firm → pick size → confirm)
  - Custom (build rule config field by field)
- [ ] User can edit an existing account's nickname, current balance, current P&L, and rules
- [ ] User can archive an account (soft delete, hidden from main UI but recoverable)
- [ ] User can switch the active account via the top bar account picker
- [ ] Active account ID stored in `user_preferences.default_account_id`
- [ ] Form validation: client + server, with friendly errors
- [ ] After creating an account, user lands on `/app` with that account active and the dashboard pulling its data
- [ ] Loading states everywhere; optimistic updates where safe
- [ ] All forms keyboard-navigable, accessible, screen-reader friendly

## Files to create

```
apps/web/src/
├── app/
│   └── (app)/
│       └── accounts/
│           ├── page.tsx
│           ├── new/page.tsx
│           └── [id]/edit/page.tsx
├── features/
│   └── accounts/
│       ├── components/
│       │   ├── account-list.tsx
│       │   ├── account-card.tsx
│       │   ├── create-account-wizard.tsx
│       │   ├── preset-picker.tsx
│       │   ├── custom-rules-form.tsx
│       │   ├── rule-section-drawdown.tsx
│       │   ├── rule-section-daily-loss.tsx
│       │   ├── rule-section-profit-target.tsx
│       │   ├── rule-section-consistency.tsx
│       │   ├── rule-section-scaling.tsx
│       │   ├── account-picker.tsx
│       │   └── account-edit-form.tsx
│       ├── actions.ts
│       ├── queries.ts
│       ├── schemas.ts
│       └── index.ts
```

## Implementation notes

### Wizard flow

```
Step 1: "Are you on a known prop firm?"
   ├─ Yes → preset picker (Apex / TPT / Tradeify / Lucid)
   │        → account size picker (e.g., Apex 50K / 100K / 150K)
   │        → "Configure starting balance" (defaults to preset)
   │        → confirm → create
   │
   └─ No → custom rules form
            → all rule sections, each with a help tooltip explaining the rule
            → confirm → create
```

### Custom rules form

A long form using React Hook Form + Zod. Each rule section is collapsible (default expanded for required, collapsed for optional like news-trading). Each field has:
- A label
- A short description
- A help tooltip with a longer explanation and an example
- Validation with friendly errors

Reuses `RulesConfig` Zod schema from `packages/rules-engine/src/schemas.ts`.

### Account picker (top bar)

Dropdown showing all accounts, grouped by status:
- Evaluation (active first)
- Funded (active first)
- Archived (collapsed)

Selecting an account:
1. Updates `user_preferences.default_account_id` via server action
2. Invalidates the active-account query
3. Cockpit updates immediately

### Edit page

Same form as create, prefilled. Saving triggers a server action that:
1. Validates input
2. Updates the account
3. Returns updated account
4. Invalidates relevant queries

## Testing requirements

- Playwright: full flow create-account-from-preset
- Playwright: full flow create-account-custom
- Playwright: edit account
- Playwright: archive and unarchive
- Vitest: every Zod schema parses valid + rejects invalid examples

## Definition of done

- [ ] All acceptance criteria checked
- [ ] All flows tested in Playwright
- [ ] Edge cases covered: max accounts, duplicate nicknames (allow), archived accounts (hidden)
- [ ] CLAUDE.md component registry updated: 06 → 🟢 Done
