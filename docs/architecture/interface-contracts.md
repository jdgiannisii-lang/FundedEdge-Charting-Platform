# Interface Contracts

These are the typed contracts between packages. Implement them exactly. If a component needs something not in here, add it here first, get review, then build.

## Rules Engine API

`packages/rules-engine/src/index.ts`

```typescript
import type { RulesConfig } from './types'

export type AccountState = {
  startingBalance: number
  currentBalance: number
  highestBalance: number
  currentPnl: number
  openPnl: number
  currentPositionContracts: number
  status: 'evaluation' | 'funded' | 'breached' | 'archived'
  trades: Array<{
    pnl: number
    closedAt: Date
    contracts: number
  }>
  rulesConfig: RulesConfig
  evaluatedAt: Date
  timezone: string
}

export type RuleVerdict = {
  ruleId: string
  ruleName: string
  status: 'ok' | 'warning' | 'danger' | 'breached'
  message: string
  currentValue: number
  threshold: number
  distance: number
  percentOfLimit: number
}

export type EngineVerdict = {
  overallStatus: 'ok' | 'warning' | 'danger' | 'breached'
  verdicts: RuleVerdict[]
  alerts: Array<{
    severity: 'info' | 'warning' | 'danger'
    message: string
    ruleId?: string
  }>
  evaluatedAt: Date
}

export function evaluate(state: AccountState): EngineVerdict
export function getPreset(slug: string): RulesConfig
export function listPresets(): Array<{ slug: string; name: string; firm: string; accountSize: number }>
```

## Market Data API

`packages/data/src/index.ts`

```typescript
export type Symbol = {
  alias: string
  resolved: string
  exchange: 'CME' | 'COMEX' | 'NYMEX'
  contractSize: number
  tickSize: number
  tickValue: number
  sessionHours: SessionConfig
}

export type Resolution = '1' | '5' | '15' | '30' | '60' | '240' | 'D' | 'W'

export type Bar = {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type Quote = {
  symbol: string
  bid: number
  ask: number
  last: number
  changeAbs: number
  changePct: number
  volume: number
  timestamp: number
}

export interface MarketDataClient {
  getSymbols(): Promise<Symbol[]>
  getCandles(input: { symbol: string; resolution: Resolution; from: number; to: number }): Promise<Bar[]>
  subscribeQuote(symbol: string, callback: (quote: Quote) => void): () => void
  subscribeBars(input: { symbol: string; resolution: Resolution }, callback: (bar: Bar) => void): () => void
}
```

## Chart Adapter API

`packages/chart/src/index.ts`

```typescript
export type ChartProps = {
  symbol: string
  resolution: Resolution
  layoutId?: string
  theme: 'light' | 'dark'
  timezone: string
  onLayoutChange?: (layout: unknown) => void
  onSymbolChange?: (symbol: string) => void
  onResolutionChange?: (resolution: Resolution) => void
}

export function FundedEdgeChart(props: ChartProps): JSX.Element
```

## Database Types

`packages/db/src/index.ts`

```typescript
export type { Database } from './generated/types'

export type Tables = Database['public']['Tables']
export type Account = Tables['accounts']['Row']
export type AccountInsert = Tables['accounts']['Insert']
export type AccountUpdate = Tables['accounts']['Update']

export { createClient } from './client/client'
export { createServerClient } from './client/server'
export { createBrowserClient } from './client/browser'
```

## UI Component Conventions

Every component in `packages/ui` exports through `packages/ui/src/index.ts`. No deep imports allowed.

```typescript
// Good
import { Button, Dialog, DialogTrigger, DialogContent } from '@fundededge/ui'

// Forbidden
import { Button } from '@fundededge/ui/src/components/button'
```

## Server Action Conventions

```typescript
'use server'

import { z } from 'zod'
import { authedAction } from '@/lib/safe-action'

const createAccountSchema = z.object({
  nickname: z.string().min(1).max(50),
  presetSlug: z.string().nullable(),
  startingBalance: z.number().positive(),
  rulesConfig: rulesConfigSchema,
})

export const createAccountAction = authedAction
  .schema(createAccountSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { data, error } = await ctx.supabase
      .from('accounts')
      .insert({ ...parsedInput, user_id: ctx.user.id })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  })
```

The `authedAction` wrapper enforces auth, validates with Zod, and provides typed context. Implementation in `apps/web/src/lib/safe-action.ts`.
