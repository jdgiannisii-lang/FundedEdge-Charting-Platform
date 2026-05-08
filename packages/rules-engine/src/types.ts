export interface AccountState {
  startingBalance: number;
  currentBalance: number;
  dailyPnl: number;
  totalPnl: number;
  openPositionPnl: number;
}

export interface RulesConfig {
  maxDailyLoss: number;
  maxTotalDrawdown: number;
  profitTarget: number;
  trailingDrawdown?: boolean;
  consistencyRule?: {
    enabled: boolean;
    maxDayPercent: number;
  };
}

export interface Verdict {
  passed: boolean;
  violations: Violation[];
  warnings: Warning[];
}

export interface Violation {
  rule: string;
  message: string;
  value: number;
  limit: number;
}

export interface Warning {
  rule: string;
  message: string;
  value: number;
  limit: number;
  proximityPercent: number;
}
