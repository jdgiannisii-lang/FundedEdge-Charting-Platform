-- Migration: indexes
-- Creates the 4 non-inline indexes defined in docs/architecture/data-model.md.
-- Inline UNIQUE constraints (e.g. prop_firm_account_types, checklist_runs) are
-- already expressed as table constraints in the initial schema migration.

-- accounts: most-queried table — partial index excludes soft-deleted rows
create index accounts_user_id_idx
  on public.accounts (user_id)
  where deleted_at is null;

-- trades: covers the primary list query (user → account → newest first)
create index trades_user_account_idx
  on public.trades (user_id, account_id, entry_at desc)
  where deleted_at is null;

-- checklists: enforces at most one default checklist per user
create unique index one_default_checklist_per_user
  on public.checklists (user_id)
  where is_default;

-- economic_events: supports time-range + impact-level filtering
create index economic_events_scheduled_idx
  on public.economic_events (scheduled_for, impact);
