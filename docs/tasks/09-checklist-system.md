# Task 09: Pre-Trade Checklist System

## Goal
Right-sidebar tab content. User can build custom checklists, run them daily, and have them persist. Includes ICT-style template presets to start.

## Dependencies
- Task 02, 04

## Acceptance criteria

- [ ] User can create/edit/delete checklists (each named)
- [ ] User can mark one checklist as default
- [ ] User can build items: prompt + input type (boolean / text / number)
- [ ] User can reorder items via drag-handle
- [ ] Each trading day (resets at user's preferred reset time), checklist runs are fresh
- [ ] User can fill out checklist; responses persist
- [ ] Quick actions: "all yes", "reset for new day"
- [ ] Pre-built ICT templates: London open, NY AM, NY PM session checklists

## Files to create

```
apps/web/src/features/checklist/
├── components/
│   ├── checklist-panel.tsx
│   ├── checklist-runner.tsx
│   ├── checklist-item-row.tsx
│   ├── checklist-list.tsx
│   ├── checklist-editor.tsx
│   ├── item-editor.tsx
│   └── template-picker.tsx
├── data/
│   └── templates.ts
├── actions.ts
├── queries.ts
└── index.ts
```

## Implementation notes

Template seed:

```typescript
export const ICT_LONDON_OPEN: ChecklistTemplate = {
  name: 'London Open Setup',
  items: [
    { prompt: 'HTF bias confirmed (1H+ aligned with daily)', input_type: 'boolean', is_required: true },
    { prompt: 'Liquidity sweep on Asia session?', input_type: 'boolean', is_required: true },
    { prompt: 'FVG present in zone of interest?', input_type: 'boolean', is_required: true },
    { prompt: 'No high-impact news in next 30 min', input_type: 'boolean', is_required: true },
    { prompt: 'Risk amount confirmed in dollars', input_type: 'number', is_required: true },
    { prompt: 'Stop loss placement', input_type: 'text', is_required: false },
    { prompt: 'Daily loss limit not approached', input_type: 'boolean', is_required: true },
  ],
}
```

Plus NY AM, NY PM, custom blank.

## Testing requirements
- Playwright: create custom checklist, run it, refresh, see responses persist
- Playwright: switch days, see fresh run

## Definition of done
- [ ] All acceptance criteria checked
- [ ] CLAUDE.md component registry updated: 09 → 🟢 Done
