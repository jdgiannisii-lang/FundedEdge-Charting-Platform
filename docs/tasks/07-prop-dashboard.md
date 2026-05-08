# Task 07: Prop Dashboard Panel

## Goal
The left panel content. Live readout of the active account: balance, P&L, every rule's status, "X until breach" for each, alert banners when thresholds cross. Updates in real time via Supabase Realtime + the rules engine.

## Out of scope
- The actual rules engine (task 05 — done)
- Account creation (task 06 — done)
- Trade entry (the panel reads, doesn't write — for now)

## Dependencies
- Task 02, 04, 05, 06

## Acceptance criteria

- [ ] Panel shows the active account's name, balance, today's P&L, status
- [ ] Each rule has a row showing: rule name, current value, threshold, distance, status pill, % bar
- [ ] Status pill colors match standards (ok=success, warning=warning, danger=danger, breached=danger with strikethrough effect)
- [ ] When a rule transitions to warning or danger, a toast fires (configurable, off by default for first 5 days of an account to avoid alarm fatigue)
- [ ] Updates within 200ms of a database change (via Supabase Realtime)
- [ ] Engine runs client-side on every state change for instant feedback
- [ ] Manual P&L override input — user can type their current realized + open P&L while we don't have broker integration
- [ ] Panel collapses to icon rail showing just overall status pill (good/warning/danger/breached)
- [ ] Empty state when no account selected: CTA to create one
- [ ] Errors handled gracefully — engine errors don't crash the panel
- [ ] Skeleton loading state on first paint

## Files to create

```
apps/web/src/features/prop-dashboard/
├── components/
│   ├── prop-dashboard-panel.tsx
│   ├── account-header.tsx
│   ├── overall-status-pill.tsx
│   ├── rule-row.tsx
│   ├── rule-progress-bar.tsx
│   ├── pnl-input.tsx
│   ├── alert-banner.tsx
│   ├── empty-state.tsx
│   └── collapsed-rail.tsx
├── hooks/
│   ├── use-active-account.ts
│   ├── use-account-evaluation.ts
│   └── use-account-realtime.ts
├── actions.ts
├── queries.ts
└── index.ts
```

## Implementation notes

### Real-time subscription

```typescript
export function useAccountRealtime(accountId: string | null) {
  const queryClient = useQueryClient()
  useEffect(() => {
    if (!accountId) return
    const supabase = createBrowserClient()
    const channel = supabase
      .channel(`account:${accountId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'accounts', filter: `id=eq.${accountId}` },
        (payload) => queryClient.setQueryData(['account', accountId], payload.new))
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [accountId, queryClient])
}
```

### Engine evaluation

```typescript
import { evaluate } from '@fundededge/rules-engine'

export function useAccountEvaluation(account: Account | null, trades: Trade[]) {
  return useMemo(() => {
    if (!account) return null
    const state: AccountState = {
      startingBalance: account.starting_balance,
      currentBalance: account.current_balance,
      highestBalance: account.highest_balance,
      currentPnl: account.current_pnl,
      openPnl: account.open_pnl,
      currentPositionContracts: account.current_position_contracts,
      status: account.status,
      trades: trades.map(/* ... */),
      rulesConfig: account.rules_config,
      evaluatedAt: new Date(),
      timezone: 'America/New_York',
    }
    return evaluate(state)
  }, [account, trades])
}
```

### Threshold transitions → toasts

Track previous status per rule in a ref; when it transitions warning↑ or danger↑, fire a toast.

### Density

In compact mode, rule rows show one line. In comfortable mode, two lines.

### Server-side notifications (deferred to v1.0 polish)

A Vercel cron route hits `/api/jobs/check-thresholds` every minute, runs the engine for every active account, and queues Resend emails for newly-warned users.

## Testing requirements

- Storybook: every panel state (empty, loading, ok, warning, danger, breached, collapsed)
- Playwright: change P&L → dashboard updates within 500ms
- Playwright: trigger a warning → toast appears
- Vitest: hooks tested in isolation with mock data

## Definition of done

- [ ] All acceptance criteria checked
- [ ] Visual sign-off from founder
- [ ] CLAUDE.md component registry updated: 07 → 🟢 Done
