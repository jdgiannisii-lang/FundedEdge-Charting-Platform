import type { AccountState, RulesConfig, Verdict, Violation, Warning } from './types';

const WARNING_THRESHOLD = 0.8;

export function evaluate(state: AccountState, config: RulesConfig): Verdict {
  const violations: Violation[] = [];
  const warnings: Warning[] = [];

  const effectivePnl = state.dailyPnl + state.openPositionPnl;

  if (effectivePnl <= -config.maxDailyLoss) {
    violations.push({
      rule: 'maxDailyLoss',
      message: `Daily loss limit of $${config.maxDailyLoss} breached`,
      value: Math.abs(effectivePnl),
      limit: config.maxDailyLoss,
    });
  } else if (Math.abs(effectivePnl) >= config.maxDailyLoss * WARNING_THRESHOLD) {
    warnings.push({
      rule: 'maxDailyLoss',
      message: `Approaching daily loss limit`,
      value: Math.abs(effectivePnl),
      limit: config.maxDailyLoss,
      proximityPercent: (Math.abs(effectivePnl) / config.maxDailyLoss) * 100,
    });
  }

  const drawdown = state.startingBalance - state.currentBalance;
  if (drawdown >= config.maxTotalDrawdown) {
    violations.push({
      rule: 'maxTotalDrawdown',
      message: `Total drawdown limit of $${config.maxTotalDrawdown} breached`,
      value: drawdown,
      limit: config.maxTotalDrawdown,
    });
  }

  return {
    passed: violations.length === 0,
    violations,
    warnings,
  };
}
