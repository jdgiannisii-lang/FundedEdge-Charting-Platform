-- =============================================================================
-- Seed: prop firm reference data
-- Populated during S9 (2026-05-19).
--
-- ⚠️  PROP FIRM RULES CHANGE OFTEN.
-- Before any v1.0 production push, re-verify every firm's current rules
-- against their official documentation and update both this file and
-- supabase/seed/prop-firms.ts. Out-of-date rules will silently mis-flag
-- user trades.
--
-- Idempotent: uses ON CONFLICT DO NOTHING so safe to re-run on db reset.
-- Account types reference prop_firms by slug lookup — no hardcoded UUIDs.
--
-- TODO items are documented in supabase/seed/prop-firms.ts.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- Prop firms
-- ---------------------------------------------------------------------------
insert into public.prop_firms (slug, name, website, is_active) values
  ('apex',     'Apex Trader Funding', 'https://apextraderfunding.com', true),
  ('tpt',      'Take Profit Trader',  'https://takeprofittrader.com',  true),
  ('tradeify', 'Tradeify',            'https://tradeify.co',           true),
  ('lucid',    'Lucid Trading',       'https://lucidtrader.com',       true) -- TODO: confirm domain
on conflict (slug) do nothing;


-- ---------------------------------------------------------------------------
-- Apex Trader Funding (4.0 rules — effective March 2026)
-- EOD trailing drawdown. DLL on EOD product only (intraday has no DLL).
-- 50% consistency rule applies to PA payout requests only — null here.
-- No minimum trading days in evaluation (4.0 removed the requirement).
-- Source: proptradingvibes.com/blog/apex-evaluation-account-rules
--         tradetanto.com/learn/apex-trader-funding-rules-what-you-need-to-know
-- Checked: 2026-05-19
-- ---------------------------------------------------------------------------
insert into public.prop_firm_account_types (
  prop_firm_id, slug, name,
  starting_balance, profit_target, trailing_drawdown, static_max_loss,
  daily_loss_limit, max_contracts, consistency_rule_pct,
  rules_doc_url, rules_version
)
select
  f.id,
  v.slug, v.name,
  v.starting_balance, v.profit_target, v.trailing_drawdown, null,
  v.daily_loss_limit, v.max_contracts, null,
  'https://apextraderfunding.com/evaluation-rules', '4.0'
from public.prop_firms f
join (values
  ('apex-25k',  'Apex 25K',  25000::numeric,  1500::numeric, 1000::numeric,  500::numeric, 4),
  ('apex-50k',  'Apex 50K',  50000::numeric,  3000::numeric, 2000::numeric, 1000::numeric, 6),
  ('apex-100k', 'Apex 100K', 100000::numeric, 6000::numeric, 3000::numeric, 1500::numeric, 8),
  ('apex-150k', 'Apex 150K', 150000::numeric, 9000::numeric, 4000::numeric, 2000::numeric, 12)
) as v(slug, name, starting_balance, profit_target, trailing_drawdown, daily_loss_limit, max_contracts)
  on f.slug = 'apex'
on conflict (prop_firm_id, slug) do nothing;


-- ---------------------------------------------------------------------------
-- Take Profit Trader (Test account rules)
-- EOD trailing drawdown. DLL removed January 2025.
-- 50% consistency: no single day > 50% of total net profit.
-- Minimum 5 trading days required.
-- Source: tradetanto.com/learn/take-profit-trader-rules-what-you-need-to-know
-- Checked: 2026-05-19
-- TODO: verify exact official rules URL.
-- ---------------------------------------------------------------------------
insert into public.prop_firm_account_types (
  prop_firm_id, slug, name,
  starting_balance, profit_target, trailing_drawdown, static_max_loss,
  daily_loss_limit, max_contracts, consistency_rule_pct,
  rules_doc_url, rules_version
)
select
  f.id,
  v.slug, v.name,
  v.starting_balance, v.profit_target, v.trailing_drawdown, null,
  null, v.max_contracts, 50,
  'https://takeprofittrader.com/rules', '2025-01'
from public.prop_firms f
join (values
  ('tpt-25k',  'TPT 25K',   25000::numeric,  1500::numeric, 1500::numeric,  3),
  ('tpt-50k',  'TPT 50K',   50000::numeric,  3000::numeric, 2000::numeric,  6),
  ('tpt-75k',  'TPT 75K',   75000::numeric,  4500::numeric, 2500::numeric,  9),
  ('tpt-100k', 'TPT 100K', 100000::numeric,  6000::numeric, 3000::numeric, 12),
  ('tpt-150k', 'TPT 150K', 150000::numeric,  9000::numeric, 4500::numeric, 15)
) as v(slug, name, starting_balance, profit_target, trailing_drawdown, max_contracts)
  on f.slug = 'tpt'
on conflict (prop_firm_id, slug) do nothing;


-- ---------------------------------------------------------------------------
-- Tradeify SELECT (3.0 rules)
-- EOD trailing drawdown. No DLL in evaluation.
-- 40% consistency: no single day > 40% of total net profit (removed once funded).
-- Minimum 3 profitable trading days.
-- TODO: SELECT 50K profit_target — source shows $2,500 (5%), not $3,000 (6%).
--       Confirm against https://help.tradeify.co/en/articles/12853921-select-evaluation-accounts
-- Checked: 2026-05-19
-- ---------------------------------------------------------------------------
insert into public.prop_firm_account_types (
  prop_firm_id, slug, name,
  starting_balance, profit_target, trailing_drawdown, static_max_loss,
  daily_loss_limit, max_contracts, consistency_rule_pct,
  rules_doc_url, rules_version
)
select
  f.id,
  v.slug, v.name,
  v.starting_balance, v.profit_target, v.trailing_drawdown, null,
  null, v.max_contracts, 40,
  'https://help.tradeify.co/en/articles/12853921-select-evaluation-accounts', '3.0'
from public.prop_firms f
join (values
  ('tradeify-select-25k',  'Tradeify Select 25K',   25000::numeric, 1500::numeric, 1000::numeric,  1),
  ('tradeify-select-50k',  'Tradeify Select 50K',   50000::numeric, 2500::numeric, 2000::numeric,  4), -- TODO: confirm $2,500 target
  ('tradeify-select-100k', 'Tradeify Select 100K', 100000::numeric, 6000::numeric, 3000::numeric,  8),
  ('tradeify-select-150k', 'Tradeify Select 150K', 150000::numeric, 9000::numeric, 4500::numeric, 12)
) as v(slug, name, starting_balance, profit_target, trailing_drawdown, max_contracts)
  on f.slug = 'tradeify'
on conflict (prop_firm_id, slug) do nothing;


-- ---------------------------------------------------------------------------
-- Tradeify GROWTH (3.0 rules)
-- EOD trailing drawdown. Has daily loss limit. No consistency rule in eval.
-- Can pass evaluation in 1 day (no consistency requirement).
-- TODO: GROWTH 50K/100K/150K — profit targets and max_contracts extrapolated
--       from pattern; verify against official help center.
-- Source: proptradingvibes.com/blog/tradeify-rules (25K confirmed)
--         DLL/drawdown for 50K-150K from search result data (unverified directly)
-- Checked: 2026-05-19
-- ---------------------------------------------------------------------------
insert into public.prop_firm_account_types (
  prop_firm_id, slug, name,
  starting_balance, profit_target, trailing_drawdown, static_max_loss,
  daily_loss_limit, max_contracts, consistency_rule_pct,
  rules_doc_url, rules_version
)
select
  f.id,
  v.slug, v.name,
  v.starting_balance, v.profit_target, v.trailing_drawdown, null,
  v.daily_loss_limit, v.max_contracts, null,
  'https://help.tradeify.co/en/articles/10495915-growth-evaluation-accounts', '3.0'
from public.prop_firms f
join (values
  ('tradeify-growth-25k',  'Tradeify Growth 25K',   25000::numeric, 1500::numeric, 1000::numeric,  600::numeric,  1), -- confirmed
  ('tradeify-growth-50k',  'Tradeify Growth 50K',   50000::numeric, 3000::numeric, 2000::numeric, 1250::numeric,  4), -- TODO: confirm target+contracts
  ('tradeify-growth-100k', 'Tradeify Growth 100K', 100000::numeric, 6000::numeric, 3500::numeric, 2500::numeric,  8), -- TODO: confirm target+contracts
  ('tradeify-growth-150k', 'Tradeify Growth 150K', 150000::numeric, 9000::numeric, 5000::numeric, 3750::numeric, 12)  -- TODO: confirm target+contracts
) as v(slug, name, starting_balance, profit_target, trailing_drawdown, daily_loss_limit, max_contracts)
  on f.slug = 'tradeify'
on conflict (prop_firm_id, slug) do nothing;


-- ---------------------------------------------------------------------------
-- Lucid Trading — LucidPro
-- EOD trailing drawdown. No consistency rule in evaluation.
-- DLL: using conservative (lower) values based on "20% of profit target" rule.
-- Conflicting source data — see supabase/seed/prop-firms.ts for full notes.
-- TODO: verify DLL values for 25K-150K against official Lucid docs.
-- TODO: confirm website domain and official rules URL.
-- Source: tradetanto.com/learn/lucid-trading-rules-explained-every-plan-rule-and-limit
-- Checked: 2026-05-19
-- ---------------------------------------------------------------------------
insert into public.prop_firm_account_types (
  prop_firm_id, slug, name,
  starting_balance, profit_target, trailing_drawdown, static_max_loss,
  daily_loss_limit, max_contracts, consistency_rule_pct,
  rules_doc_url, rules_version
)
select
  f.id,
  v.slug, v.name,
  v.starting_balance, v.profit_target, v.trailing_drawdown, null,
  v.daily_loss_limit, v.max_contracts, null,
  'https://lucidtrader.com/rules', '2026-01'
from public.prop_firms f
join (values
  ('lucid-pro-25k',  'Lucid Pro 25K',   25000::numeric, 1250::numeric, 1000::numeric,  null::numeric,  2), -- TODO: DLL may be $250
  ('lucid-pro-50k',  'Lucid Pro 50K',   50000::numeric, 3000::numeric, 2000::numeric,   600::numeric,  4), -- TODO: source conflict ($600 vs $1,200)
  ('lucid-pro-100k', 'Lucid Pro 100K', 100000::numeric, 6000::numeric, 3000::numeric,  1200::numeric,  6), -- TODO: source conflict ($1,200 vs $1,800)
  ('lucid-pro-150k', 'Lucid Pro 150K', 150000::numeric, 9000::numeric, 4500::numeric,  1800::numeric, 10)  -- TODO: source conflict ($1,800 vs $2,700)
) as v(slug, name, starting_balance, profit_target, trailing_drawdown, daily_loss_limit, max_contracts)
  on f.slug = 'lucid'
on conflict (prop_firm_id, slug) do nothing;


-- ---------------------------------------------------------------------------
-- Lucid Trading — LucidFlex
-- EOD trailing drawdown. No DLL. 50% consistency rule in eval (removed once funded).
-- Minimum 1 trading day.
-- ---------------------------------------------------------------------------
insert into public.prop_firm_account_types (
  prop_firm_id, slug, name,
  starting_balance, profit_target, trailing_drawdown, static_max_loss,
  daily_loss_limit, max_contracts, consistency_rule_pct,
  rules_doc_url, rules_version
)
select
  f.id,
  v.slug, v.name,
  v.starting_balance, v.profit_target, v.trailing_drawdown, null,
  null, v.max_contracts, 50,
  'https://lucidtrader.com/rules', '2026-01'
from public.prop_firms f
join (values
  ('lucid-flex-25k',  'Lucid Flex 25K',   25000::numeric, 1250::numeric, 1000::numeric,  2),
  ('lucid-flex-50k',  'Lucid Flex 50K',   50000::numeric, 3000::numeric, 2000::numeric,  4),
  ('lucid-flex-100k', 'Lucid Flex 100K', 100000::numeric, 6000::numeric, 3000::numeric,  6),
  ('lucid-flex-150k', 'Lucid Flex 150K', 150000::numeric, 9000::numeric, 4500::numeric, 10)
) as v(slug, name, starting_balance, profit_target, trailing_drawdown, max_contracts)
  on f.slug = 'lucid'
on conflict (prop_firm_id, slug) do nothing;


-- ---------------------------------------------------------------------------
-- Lucid Trading — LucidDirect (straight-to-funded, no evaluation phase)
-- EOD trailing drawdown. 20% consistency on payouts. DLL applies 50K+.
-- Minimum 5 trading days (payout requirement, not eval passage).
-- ---------------------------------------------------------------------------
insert into public.prop_firm_account_types (
  prop_firm_id, slug, name,
  starting_balance, profit_target, trailing_drawdown, static_max_loss,
  daily_loss_limit, max_contracts, consistency_rule_pct,
  rules_doc_url, rules_version
)
select
  f.id,
  v.slug, v.name,
  v.starting_balance, v.profit_target, v.trailing_drawdown, null,
  v.daily_loss_limit, v.max_contracts, 20,
  'https://lucidtrader.com/rules', '2026-01'
from public.prop_firms f
join (values
  ('lucid-direct-25k',  'Lucid Direct 25K',   25000::numeric, 1500::numeric, 1000::numeric,  null::numeric,  2),
  ('lucid-direct-50k',  'Lucid Direct 50K',   50000::numeric, 3000::numeric, 2000::numeric,  1200::numeric,  4),
  ('lucid-direct-100k', 'Lucid Direct 100K', 100000::numeric, 6000::numeric, 3500::numeric,  2100::numeric,  6),
  ('lucid-direct-150k', 'Lucid Direct 150K', 150000::numeric, 9000::numeric, 5000::numeric,  3000::numeric, 10)
) as v(slug, name, starting_balance, profit_target, trailing_drawdown, daily_loss_limit, max_contracts)
  on f.slug = 'lucid'
on conflict (prop_firm_id, slug) do nothing;
