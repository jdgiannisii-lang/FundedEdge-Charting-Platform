// ─── AccountState ────────────────────────────────────────────────────────────

export type Trade = {
  pnl: number
  closedAt: Date
  contracts: number
}

export type AccountStatus = 'evaluation' | 'funded' | 'breached' | 'archived'

export type AccountState = {
  startingBalance: number
  currentBalance: number
  highestBalance: number
  currentPnl: number
  openPnl: number
  currentPositionContracts: number
  status: AccountStatus
  trades: Trade[]
  rulesConfig: RulesConfig
  evaluatedAt: Date
  timezone: string
}

// ─── RuleVerdict / EngineVerdict ─────────────────────────────────────────────

export type RuleStatus = 'ok' | 'warning' | 'danger' | 'breached'

export type RuleVerdict = {
  ruleId: string
  ruleName: string
  status: RuleStatus
  message: string
  currentValue: number
  threshold: number
  distance: number
  percentOfLimit: number
}

export type AlertSeverity = 'info' | 'warning' | 'danger'

export type Alert = {
  severity: AlertSeverity
  message: string
  ruleId?: string
}

export type EngineVerdict = {
  overallStatus: RuleStatus
  verdicts: RuleVerdict[]
  alerts: Alert[]
  evaluatedAt: Date
}

// ─── RulesConfig ─────────────────────────────────────────────────────────────

/**
 * Trailing drawdown trails the highest balance. When highestBalance reaches
 * startingBalance + lock_at_balance, the trail locks at that fixed level.
 * mode 'eod' evaluates against currentBalance only; 'intraday' uses
 * currentBalance + openPnl.
 */
export type TrailingDrawdownConfig = {
  type: 'trailing'
  amount: number
  mode: 'eod' | 'intraday'
  lock_at_balance: number | null
}

/** Static floor: account cannot lose more than `amount` from startingBalance. */
export type StaticDrawdownConfig = {
  type: 'static'
  amount: number
}

export type DrawdownConfig = TrailingDrawdownConfig | StaticDrawdownConfig

/**
 * Daily loss resets at `resetTime` expressed as "HH:mm IANA/Zone",
 * e.g. "17:00 America/Chicago".
 */
export type DailyLossConfig = {
  amount: number
  resetTime: string
}

export type ProfitTargetConfig = {
  amount: number
  /** 'absolute' counts total closed P&L; 'eod' counts EOD closed P&L only. */
  mode: 'absolute' | 'eod'
  /** Whether open P&L counts toward target progress. Default false. */
  countsOpenPnl?: boolean
}

export type ConsistencyConfig = {
  /** No single trading day may exceed this % of total net profit (0–100). */
  bestDayPct?: number
  /** Minimum number of distinct trading days with activity required. */
  minTradingDays?: number
}

export type ContractScalingTier = {
  /** Apply this tier when currentBalance >= minBalance. */
  minBalance: number
  maxContracts: number
}

export type ContractScalingConfig = {
  /** Flat cap always present; tiers override it for higher balance levels. */
  maxContracts: number
  /** Tiers sorted ascending by minBalance. When present, resolve from highest matching tier. */
  tiers?: ContractScalingTier[]
}

export type NewsTradingConfig = {
  /** Minutes before/after a restricted event during which open positions are flagged. */
  windowMinutes: number
  /** UTC timestamps of restricted events. Must come from AccountState, never from Date.now(). */
  restrictedEventTimes?: Date[]
}

export type Thresholds = {
  /** Fraction of limit remaining that triggers 'warning'. Default 0.20 (20%). */
  warningPct: number
  /** Fraction of limit remaining that triggers 'danger'. Default 0.05 (5%). */
  dangerPct: number
}

export const DEFAULT_THRESHOLDS: Thresholds = {
  warningPct: 0.2,
  dangerPct: 0.05,
}

export type RulesConfig = {
  drawdown: DrawdownConfig
  dailyLoss: DailyLossConfig | null
  profitTarget: ProfitTargetConfig | null
  consistency: ConsistencyConfig | null
  contractScaling: ContractScalingConfig | null
  newsTrading: NewsTradingConfig | null
  thresholds: Thresholds
}
