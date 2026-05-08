# ADR 0004: Zustand for client state, TanStack Query for server state

**Date:** 2026-Day-0
**Status:** Accepted

## Context

We need predictable state management for both ephemeral UI state and server-derived data, without the boilerplate of Redux.

## Decision

- **Zustand** for client-only state (sidebar collapse, modal open/closed, form drafts, theme)
- **TanStack Query** for server state (accounts, trades, calendar events) — backed by Supabase queries
- **Supabase Realtime** subscriptions write directly into the TanStack Query cache via `setQueryData`, so realtime updates are seamless

## Alternatives considered

- **Redux Toolkit** — overkill, lots of boilerplate
- **Recoil** — uncertain Facebook commitment, smaller ecosystem
- **Jotai** — great library, but Zustand is simpler for our patterns
- **Context only** — re-render hell at scale

## Consequences

Clean separation: if you can't reload the page and reproduce the state, it's Zustand; if you can, it's TanStack Query backed by Supabase.

## Implementation

```typescript
// Zustand store — apps/web/src/stores/ui.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type UiState = {
  leftPanelCollapsed: boolean
  rightPanelCollapsed: boolean
  rightTab: 'news' | 'checklist' | 'journal'
  setLeftPanelCollapsed: (v: boolean) => void
  setRightPanelCollapsed: (v: boolean) => void
  setRightTab: (t: UiState['rightTab']) => void
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      leftPanelCollapsed: false,
      rightPanelCollapsed: false,
      rightTab: 'checklist',
      setLeftPanelCollapsed: (v) => set({ leftPanelCollapsed: v }),
      setRightPanelCollapsed: (v) => set({ rightPanelCollapsed: v }),
      setRightTab: (t) => set({ rightTab: t }),
    }),
    { name: 'fundededge-ui' }
  )
)
```

```typescript
// TanStack Query — apps/web/src/features/accounts/queries.ts
export const accountsQuery = (userId: string) => ({
  queryKey: ['accounts', userId],
  queryFn: async () => {
    const supabase = createBrowserClient()
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
  staleTime: 30_000,
})
```
