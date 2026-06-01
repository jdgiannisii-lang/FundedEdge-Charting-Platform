import { z } from 'zod'
import type {
  AccountState,
  RulesConfig,
  DrawdownConfig,
  DailyLossConfig,
  ProfitTargetConfig,
  ConsistencyConfig,
  ContractScalingConfig,
  NewsTradingConfig,
  Thresholds,
} from './types'

// ─── DrawdownConfig ───────────────────────────────────────────────────────────

const trailingDrawdownSchema = z.object({
  type: z.literal('trailing'),
  amount: z.number().positive(),
  mode: z.enum(['eod', 'intraday']),
  lock_at_balance: z.number().positive().nullable(),
})

const staticDrawdownSchema = z.object({
  type: z.literal('static'),
  amount: z.number().positive(),
})

export const drawdownConfigSchema = z.discriminatedUnion('type', [
  trailingDrawdownSchema,
  staticDrawdownSchema,
])

// ─── Sub-rule configs ─────────────────────────────────────────────────────────

export const dailyLossConfigSchema = z.object({
  amount: z.number().positive(),
  resetTime: z.string().min(1),
})

export const profitTargetConfigSchema = z.object({
  amount: z.number().positive(),
  mode: z.enum(['absolute', 'eod']),
  countsOpenPnl: z.boolean().optional(),
})

export const consistencyConfigSchema = z.object({
  bestDayPct: z.number().min(0).max(100).optional(),
  minTradingDays: z.number().int().positive().optional(),
})

export const contractScalingConfigSchema = z.object({
  maxContracts: z.number().int().positive(),
  tiers: z
    .array(
      z.object({
        minBalance: z.number(),
        maxContracts: z.number().int().positive(),
      }),
    )
    .optional(),
})

export const newsTradingConfigSchema = z.object({
  windowMinutes: z.number().positive(),
  restrictedEventTimes: z.array(z.date()).optional(),
})

export const thresholdsSchema = z.object({
  warningPct: z.number().min(0).max(1),
  dangerPct: z.number().min(0).max(1),
})

// ─── RulesConfig ─────────────────────────────────────────────────────────────

export const rulesConfigSchema = z.object({
  drawdown: drawdownConfigSchema,
  dailyLoss: dailyLossConfigSchema.nullable(),
  profitTarget: profitTargetConfigSchema.nullable(),
  consistency: consistencyConfigSchema.nullable(),
  contractScaling: contractScalingConfigSchema.nullable(),
  newsTrading: newsTradingConfigSchema.nullable(),
  thresholds: thresholdsSchema,
})

// ─── AccountState ─────────────────────────────────────────────────────────────

export const tradeSchema = z.object({
  pnl: z.number(),
  closedAt: z.date(),
  contracts: z.number().int().positive(),
})

export const accountStateSchema = z.object({
  startingBalance: z.number().positive(),
  currentBalance: z.number(),
  highestBalance: z.number(),
  currentPnl: z.number(),
  openPnl: z.number(),
  currentPositionContracts: z.number().int().min(0),
  status: z.enum(['evaluation', 'funded', 'breached', 'archived']),
  trades: z.array(tradeSchema),
  rulesConfig: rulesConfigSchema,
  evaluatedAt: z.date(),
  timezone: z.string().min(1),
})

// ─── Lockstep assertions (compile-time) ──────────────────────────────────────
// These type-level checks fail at tsc if a schema drifts from its TS type.

type _DrawdownOk = z.infer<typeof drawdownConfigSchema> extends DrawdownConfig
  ? DrawdownConfig extends z.infer<typeof drawdownConfigSchema>
    ? true
    : never
  : never
type _DailyLossOk = z.infer<typeof dailyLossConfigSchema> extends DailyLossConfig
  ? DailyLossConfig extends z.infer<typeof dailyLossConfigSchema>
    ? true
    : never
  : never
type _ProfitTargetOk = z.infer<typeof profitTargetConfigSchema> extends ProfitTargetConfig
  ? ProfitTargetConfig extends z.infer<typeof profitTargetConfigSchema>
    ? true
    : never
  : never
type _ConsistencyOk = z.infer<typeof consistencyConfigSchema> extends ConsistencyConfig
  ? ConsistencyConfig extends z.infer<typeof consistencyConfigSchema>
    ? true
    : never
  : never
type _ContractScalingOk = z.infer<typeof contractScalingConfigSchema> extends ContractScalingConfig
  ? ContractScalingConfig extends z.infer<typeof contractScalingConfigSchema>
    ? true
    : never
  : never
type _NewsTradingOk = z.infer<typeof newsTradingConfigSchema> extends NewsTradingConfig
  ? NewsTradingConfig extends z.infer<typeof newsTradingConfigSchema>
    ? true
    : never
  : never
type _ThresholdsOk = z.infer<typeof thresholdsSchema> extends Thresholds
  ? Thresholds extends z.infer<typeof thresholdsSchema>
    ? true
    : never
  : never
type _RulesConfigOk = z.infer<typeof rulesConfigSchema> extends RulesConfig
  ? RulesConfig extends z.infer<typeof rulesConfigSchema>
    ? true
    : never
  : never
type _AccountStateOk = z.infer<typeof accountStateSchema> extends AccountState
  ? AccountState extends z.infer<typeof accountStateSchema>
    ? true
    : never
  : never

// These const assignments will error if any _*Ok type resolves to `never`.
declare const _d: _DrawdownOk
declare const _dl: _DailyLossOk
declare const _pt: _ProfitTargetOk
declare const _co: _ConsistencyOk
declare const _cs: _ContractScalingOk
declare const _nt: _NewsTradingOk
declare const _th: _ThresholdsOk
declare const _rc: _RulesConfigOk
declare const _as: _AccountStateOk
