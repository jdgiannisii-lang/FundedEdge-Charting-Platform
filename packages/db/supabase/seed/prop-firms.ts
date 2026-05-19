/**
 * ⚠️  PROP FIRM RULES CHANGE OFTEN.
 *
 * Before any v1.0 production push, re-verify every firm's current rules
 * against their official documentation and update this file. Out-of-date
 * rules in production will silently mis-flag user trades.
 *
 * Last full re-verification: 2026-05-19 by Claude (S9)
 *
 * Sources used during S9:
 *   Apex   – https://proptradingvibes.com/blog/apex-evaluation-account-rules
 *            https://tradetanto.com/learn/apex-trader-funding-rules-what-you-need-to-know
 *   TPT    – https://tradetanto.com/learn/take-profit-trader-rules-what-you-need-to-know
 *   Tradeify – https://saveonpropfirms.com/blog/tradeify-select-guide
 *              https://proptradingvibes.com/blog/tradeify-rules
 *   Lucid  – https://tradetanto.com/learn/lucid-trading-rules-explained-every-plan-rule-and-limit
 *
 * TODO before v1.0 production: replace third-party sources with direct fetches
 * from each firm's official help center / rules page.
 */

import type { Database } from '../../src/generated/types'

type PropFirmInsert = Database['public']['Tables']['prop_firms']['Insert']
type AccountTypeInsert = Omit<
  Database['public']['Tables']['prop_firm_account_types']['Insert'],
  'prop_firm_id' | 'id' | 'created_at'
>

interface PropFirmSeed {
  firm: Omit<PropFirmInsert, 'id' | 'created_at'>
  accountTypes: AccountTypeInsert[]
}

// ---------------------------------------------------------------------------
// Apex Trader Funding  (4.0 rules — effective March 2026)
// ---------------------------------------------------------------------------
// All accounts use EOD trailing drawdown (default product).
// Intraday product exists but has no DLL — EOD is what most traders buy.
// DLL applies to evaluation AND performance accounts on the EOD trail.
// Consistency rule (50%) applies to PA payout requests only, NOT evaluation.
// No minimum trading days in evaluation (removed in 4.0).
// Source checked: 2026-05-19
// Official rules: https://apextraderfunding.com/evaluation-rules (returns 403 to bots)
// ---------------------------------------------------------------------------
const APEX: PropFirmSeed = {
  firm: {
    slug: 'apex',
    name: 'Apex Trader Funding',
    website: 'https://apextraderfunding.com',
    is_active: true,
  },
  accountTypes: [
    {
      slug: 'apex-25k',
      name: 'Apex 25K',
      starting_balance: 25000,
      profit_target: 1500,
      trailing_drawdown: 1000,
      static_max_loss: null,
      daily_loss_limit: 500,
      max_contracts: 4,
      consistency_rule_pct: null, // 50% applies to PA payouts, not eval
      rules_doc_url: 'https://apextraderfunding.com/evaluation-rules',
      rules_version: '4.0',
    },
    {
      slug: 'apex-50k',
      name: 'Apex 50K',
      starting_balance: 50000,
      profit_target: 3000,
      trailing_drawdown: 2000,
      static_max_loss: null,
      daily_loss_limit: 1000,
      max_contracts: 6,
      consistency_rule_pct: null,
      rules_doc_url: 'https://apextraderfunding.com/evaluation-rules',
      rules_version: '4.0',
    },
    {
      slug: 'apex-100k',
      name: 'Apex 100K',
      starting_balance: 100000,
      profit_target: 6000,
      trailing_drawdown: 3000,
      static_max_loss: null,
      daily_loss_limit: 1500,
      max_contracts: 8,
      consistency_rule_pct: null,
      rules_doc_url: 'https://apextraderfunding.com/evaluation-rules',
      rules_version: '4.0',
    },
    {
      slug: 'apex-150k',
      name: 'Apex 150K',
      starting_balance: 150000,
      profit_target: 9000,
      trailing_drawdown: 4000,
      static_max_loss: null,
      daily_loss_limit: 2000,
      max_contracts: 12,
      consistency_rule_pct: null,
      rules_doc_url: 'https://apextraderfunding.com/evaluation-rules',
      rules_version: '4.0',
    },
  ],
}

// ---------------------------------------------------------------------------
// Take Profit Trader  (Test account rules — EOD trailing drawdown)
// ---------------------------------------------------------------------------
// Daily loss limit removed across all phases in January 2025.
// Consistency rule (50%): no single day > 50% of total net profit.
// Minimum 5 trading days required.
// PRO (intraday trailing) and PRO+ (back to EOD) exist post-eval — not seeded
// here because they share the same account_type record and differ only in
// rules_config overrides on the accounts table.
// Source checked: 2026-05-19
// Official rules: https://takeprofittrader.com/rules
// TODO: verify exact official rules URL (help center redirects vary)
// ---------------------------------------------------------------------------
const TPT: PropFirmSeed = {
  firm: {
    slug: 'tpt',
    name: 'Take Profit Trader',
    website: 'https://takeprofittrader.com',
    is_active: true,
  },
  accountTypes: [
    {
      slug: 'tpt-25k',
      name: 'TPT 25K',
      starting_balance: 25000,
      profit_target: 1500,
      trailing_drawdown: 1500,
      static_max_loss: null,
      daily_loss_limit: null, // removed Jan 2025
      max_contracts: 3,
      consistency_rule_pct: 50,
      rules_doc_url: 'https://takeprofittrader.com/rules',
      rules_version: '2025-01',
    },
    {
      slug: 'tpt-50k',
      name: 'TPT 50K',
      starting_balance: 50000,
      profit_target: 3000,
      trailing_drawdown: 2000,
      static_max_loss: null,
      daily_loss_limit: null,
      max_contracts: 6,
      consistency_rule_pct: 50,
      rules_doc_url: 'https://takeprofittrader.com/rules',
      rules_version: '2025-01',
    },
    {
      slug: 'tpt-75k',
      name: 'TPT 75K',
      starting_balance: 75000,
      profit_target: 4500,
      trailing_drawdown: 2500,
      static_max_loss: null,
      daily_loss_limit: null,
      max_contracts: 9,
      consistency_rule_pct: 50,
      rules_doc_url: 'https://takeprofittrader.com/rules',
      rules_version: '2025-01',
    },
    {
      slug: 'tpt-100k',
      name: 'TPT 100K',
      starting_balance: 100000,
      profit_target: 6000,
      trailing_drawdown: 3000,
      static_max_loss: null,
      daily_loss_limit: null,
      max_contracts: 12,
      consistency_rule_pct: 50,
      rules_doc_url: 'https://takeprofittrader.com/rules',
      rules_version: '2025-01',
    },
    {
      slug: 'tpt-150k',
      name: 'TPT 150K',
      starting_balance: 150000,
      profit_target: 9000,
      trailing_drawdown: 4500,
      static_max_loss: null,
      daily_loss_limit: null,
      max_contracts: 15,
      consistency_rule_pct: 50,
      rules_doc_url: 'https://takeprofittrader.com/rules',
      rules_version: '2025-01',
    },
  ],
}

// ---------------------------------------------------------------------------
// Tradeify  (3.0 rules)
// ---------------------------------------------------------------------------
// Two evaluation families: SELECT and GROWTH.
//
// SELECT: no DLL, 40% consistency rule (must clear in ≥ 3 profitable days).
//   Consistency rule disappears once funded.
//   50K profit target is $2,500 (5%) vs the industry-standard 6% = $3,000.
//   TODO: confirm SELECT 50K profit target against official docs —
//         source shows $2,500 but standard 6% would be $3,000.
//
// GROWTH: has DLL, no consistency rule in evaluation. Can pass in 1 day.
//   50K–150K: profit targets and contract limits extrapolated from 25K pattern
//   and from search result drawdown/DLL data — verify before v1.0.
//   TODO: confirm GROWTH 50K/100K/150K profit targets and max_contracts.
//
// Source checked: 2026-05-19
// Official rules: https://help.tradeify.co/en/articles/12853921-select-evaluation-accounts
//                 https://help.tradeify.co/en/articles/10495915-growth-evaluation-accounts
// ---------------------------------------------------------------------------
const TRADEIFY: PropFirmSeed = {
  firm: {
    slug: 'tradeify',
    name: 'Tradeify',
    website: 'https://tradeify.co',
    is_active: true,
  },
  accountTypes: [
    // SELECT
    {
      slug: 'tradeify-select-25k',
      name: 'Tradeify Select 25K',
      starting_balance: 25000,
      profit_target: 1500,
      trailing_drawdown: 1000,
      static_max_loss: null,
      daily_loss_limit: null,
      max_contracts: 1,
      consistency_rule_pct: 40,
      rules_doc_url: 'https://help.tradeify.co/en/articles/12853921-select-evaluation-accounts',
      rules_version: '3.0',
    },
    {
      slug: 'tradeify-select-50k',
      name: 'Tradeify Select 50K',
      starting_balance: 50000,
      profit_target: 2500, // TODO: confirm — source shows $2,500 (5%), not $3,000 (6%)
      trailing_drawdown: 2000,
      static_max_loss: null,
      daily_loss_limit: null,
      max_contracts: 4,
      consistency_rule_pct: 40,
      rules_doc_url: 'https://help.tradeify.co/en/articles/12853921-select-evaluation-accounts',
      rules_version: '3.0',
    },
    {
      slug: 'tradeify-select-100k',
      name: 'Tradeify Select 100K',
      starting_balance: 100000,
      profit_target: 6000,
      trailing_drawdown: 3000,
      static_max_loss: null,
      daily_loss_limit: null,
      max_contracts: 8,
      consistency_rule_pct: 40,
      rules_doc_url: 'https://help.tradeify.co/en/articles/12853921-select-evaluation-accounts',
      rules_version: '3.0',
    },
    {
      slug: 'tradeify-select-150k',
      name: 'Tradeify Select 150K',
      starting_balance: 150000,
      profit_target: 9000,
      trailing_drawdown: 4500,
      static_max_loss: null,
      daily_loss_limit: null,
      max_contracts: 12,
      consistency_rule_pct: 40,
      rules_doc_url: 'https://help.tradeify.co/en/articles/12853921-select-evaluation-accounts',
      rules_version: '3.0',
    },
    // GROWTH
    {
      slug: 'tradeify-growth-25k',
      name: 'Tradeify Growth 25K',
      starting_balance: 25000,
      profit_target: 1500,
      trailing_drawdown: 1000,
      static_max_loss: null,
      daily_loss_limit: 600,
      max_contracts: 1,
      consistency_rule_pct: null, // no consistency rule in Growth eval
      rules_doc_url: 'https://help.tradeify.co/en/articles/10495915-growth-evaluation-accounts',
      rules_version: '3.0',
    },
    {
      slug: 'tradeify-growth-50k',
      name: 'Tradeify Growth 50K',
      starting_balance: 50000,
      profit_target: 3000, // TODO: confirm against official docs
      trailing_drawdown: 2000,
      static_max_loss: null,
      daily_loss_limit: 1250,
      max_contracts: 4, // TODO: confirm
      consistency_rule_pct: null,
      rules_doc_url: 'https://help.tradeify.co/en/articles/10495915-growth-evaluation-accounts',
      rules_version: '3.0',
    },
    {
      slug: 'tradeify-growth-100k',
      name: 'Tradeify Growth 100K',
      starting_balance: 100000,
      profit_target: 6000, // TODO: confirm against official docs
      trailing_drawdown: 3500,
      static_max_loss: null,
      daily_loss_limit: 2500,
      max_contracts: 8, // TODO: confirm
      consistency_rule_pct: null,
      rules_doc_url: 'https://help.tradeify.co/en/articles/10495915-growth-evaluation-accounts',
      rules_version: '3.0',
    },
    {
      slug: 'tradeify-growth-150k',
      name: 'Tradeify Growth 150K',
      starting_balance: 150000,
      profit_target: 9000, // TODO: confirm against official docs
      trailing_drawdown: 5000,
      static_max_loss: null,
      daily_loss_limit: 3750,
      max_contracts: 12, // TODO: confirm
      consistency_rule_pct: null,
      rules_doc_url: 'https://help.tradeify.co/en/articles/10495915-growth-evaluation-accounts',
      rules_version: '3.0',
    },
  ],
}

// ---------------------------------------------------------------------------
// Lucid Trading
// ---------------------------------------------------------------------------
// Three evaluation plans: LucidPro, LucidFlex, LucidDirect.
// All use EOD trailing drawdown — intraday moves never cause a breach.
// Payout split: 90/10 across all plans.
//
// LucidPro:  has DLL (50K+); no consistency rule in eval
// LucidFlex: no DLL; 50% consistency rule in eval (removed once funded)
// LucidDirect: straight-to-funded (no evaluation phase per se); 20% consistency;
//              DLL applies 50K+
//
// TODO: DLL values for LucidPro 50K-150K conflict between sources —
//       tradetanto.com shows $1,200/$1,800/$2,700 but a search summary cited
//       the rule as "20% of profit target" which gives $600/$1,200/$1,800.
//       Conservative (lower) values ($600/$1,200/$1,800) used here pending
//       official confirmation.
// TODO: LucidPro 25K DLL: tradetanto shows null; search result suggests $250
//       (20% of $1,250 target). Using null (more permissive) pending confirmation.
// TODO: Verify Lucid's official website domain and rules URL.
// Source checked: 2026-05-19
// ---------------------------------------------------------------------------
const LUCID: PropFirmSeed = {
  firm: {
    slug: 'lucid',
    name: 'Lucid Trading',
    website: 'https://lucidtrader.com', // TODO: confirm domain
    is_active: true,
  },
  accountTypes: [
    // LucidPro
    {
      slug: 'lucid-pro-25k',
      name: 'Lucid Pro 25K',
      starting_balance: 25000,
      profit_target: 1250,
      trailing_drawdown: 1000,
      static_max_loss: null,
      daily_loss_limit: null, // TODO: confirm — may be $250 (20% of target)
      max_contracts: 2,
      consistency_rule_pct: null,
      rules_doc_url: 'https://lucidtrader.com/rules', // TODO: confirm URL
      rules_version: '2026-01',
    },
    {
      slug: 'lucid-pro-50k',
      name: 'Lucid Pro 50K',
      starting_balance: 50000,
      profit_target: 3000,
      trailing_drawdown: 2000,
      static_max_loss: null,
      daily_loss_limit: 600, // TODO: tradetanto shows $1,200; 20%-of-target rule gives $600
      max_contracts: 4,
      consistency_rule_pct: null,
      rules_doc_url: 'https://lucidtrader.com/rules', // TODO: confirm URL
      rules_version: '2026-01',
    },
    {
      slug: 'lucid-pro-100k',
      name: 'Lucid Pro 100K',
      starting_balance: 100000,
      profit_target: 6000,
      trailing_drawdown: 3000,
      static_max_loss: null,
      daily_loss_limit: 1200, // TODO: tradetanto shows $1,800; 20%-of-target rule gives $1,200
      max_contracts: 6,
      consistency_rule_pct: null,
      rules_doc_url: 'https://lucidtrader.com/rules', // TODO: confirm URL
      rules_version: '2026-01',
    },
    {
      slug: 'lucid-pro-150k',
      name: 'Lucid Pro 150K',
      starting_balance: 150000,
      profit_target: 9000,
      trailing_drawdown: 4500,
      static_max_loss: null,
      daily_loss_limit: 1800, // TODO: tradetanto shows $2,700; 20%-of-target rule gives $1,800
      max_contracts: 10,
      consistency_rule_pct: null,
      rules_doc_url: 'https://lucidtrader.com/rules', // TODO: confirm URL
      rules_version: '2026-01',
    },
    // LucidFlex
    {
      slug: 'lucid-flex-25k',
      name: 'Lucid Flex 25K',
      starting_balance: 25000,
      profit_target: 1250,
      trailing_drawdown: 1000,
      static_max_loss: null,
      daily_loss_limit: null,
      max_contracts: 2,
      consistency_rule_pct: 50,
      rules_doc_url: 'https://lucidtrader.com/rules', // TODO: confirm URL
      rules_version: '2026-01',
    },
    {
      slug: 'lucid-flex-50k',
      name: 'Lucid Flex 50K',
      starting_balance: 50000,
      profit_target: 3000,
      trailing_drawdown: 2000,
      static_max_loss: null,
      daily_loss_limit: null,
      max_contracts: 4,
      consistency_rule_pct: 50,
      rules_doc_url: 'https://lucidtrader.com/rules', // TODO: confirm URL
      rules_version: '2026-01',
    },
    {
      slug: 'lucid-flex-100k',
      name: 'Lucid Flex 100K',
      starting_balance: 100000,
      profit_target: 6000,
      trailing_drawdown: 3000,
      static_max_loss: null,
      daily_loss_limit: null,
      max_contracts: 6,
      consistency_rule_pct: 50,
      rules_doc_url: 'https://lucidtrader.com/rules', // TODO: confirm URL
      rules_version: '2026-01',
    },
    {
      slug: 'lucid-flex-150k',
      name: 'Lucid Flex 150K',
      starting_balance: 150000,
      profit_target: 9000,
      trailing_drawdown: 4500,
      static_max_loss: null,
      daily_loss_limit: null,
      max_contracts: 10,
      consistency_rule_pct: 50,
      rules_doc_url: 'https://lucidtrader.com/rules', // TODO: confirm URL
      rules_version: '2026-01',
    },
    // LucidDirect (straight-to-funded — no separate evaluation phase)
    {
      slug: 'lucid-direct-25k',
      name: 'Lucid Direct 25K',
      starting_balance: 25000,
      profit_target: 1500,
      trailing_drawdown: 1000,
      static_max_loss: null,
      daily_loss_limit: null,
      max_contracts: 2,
      consistency_rule_pct: 20,
      rules_doc_url: 'https://lucidtrader.com/rules', // TODO: confirm URL
      rules_version: '2026-01',
    },
    {
      slug: 'lucid-direct-50k',
      name: 'Lucid Direct 50K',
      starting_balance: 50000,
      profit_target: 3000,
      trailing_drawdown: 2000,
      static_max_loss: null,
      daily_loss_limit: 1200,
      max_contracts: 4,
      consistency_rule_pct: 20,
      rules_doc_url: 'https://lucidtrader.com/rules', // TODO: confirm URL
      rules_version: '2026-01',
    },
    {
      slug: 'lucid-direct-100k',
      name: 'Lucid Direct 100K',
      starting_balance: 100000,
      profit_target: 6000,
      trailing_drawdown: 3500,
      static_max_loss: null,
      daily_loss_limit: 2100,
      max_contracts: 6,
      consistency_rule_pct: 20,
      rules_doc_url: 'https://lucidtrader.com/rules', // TODO: confirm URL
      rules_version: '2026-01',
    },
    {
      slug: 'lucid-direct-150k',
      name: 'Lucid Direct 150K',
      starting_balance: 150000,
      profit_target: 9000,
      trailing_drawdown: 5000,
      static_max_loss: null,
      daily_loss_limit: 3000,
      max_contracts: 10,
      consistency_rule_pct: 20,
      rules_doc_url: 'https://lucidtrader.com/rules', // TODO: confirm URL
      rules_version: '2026-01',
    },
  ],
}

export const PROP_FIRMS: PropFirmSeed[] = [APEX, TPT, TRADEIFY, LUCID]
