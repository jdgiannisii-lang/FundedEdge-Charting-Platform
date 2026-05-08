import { describe, expect, it } from 'vitest';
import { evaluate } from './engine';

describe('rules-engine placeholder', () => {
  it('exports evaluate function', () => {
    expect(typeof evaluate).toBe('function');
  });

  it('passes when no rules are violated', () => {
    const result = evaluate(
      {
        startingBalance: 50000,
        currentBalance: 50500,
        dailyPnl: 500,
        totalPnl: 500,
        openPositionPnl: 0,
      },
      {
        maxDailyLoss: 2000,
        maxTotalDrawdown: 3000,
        profitTarget: 3000,
      },
    );

    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('flags a daily loss violation', () => {
    const result = evaluate(
      {
        startingBalance: 50000,
        currentBalance: 48000,
        dailyPnl: -2100,
        totalPnl: -2000,
        openPositionPnl: 0,
      },
      {
        maxDailyLoss: 2000,
        maxTotalDrawdown: 3000,
        profitTarget: 3000,
      },
    );

    expect(result.passed).toBe(false);
    expect(result.violations.some((v) => v.rule === 'maxDailyLoss')).toBe(true);
  });
});
