-- =============================================================================
-- Migration: 20260101000001_initial_schema
-- Purpose:   Create every public table required by data-model.md.
--
-- Scope of THIS migration (S2 in docs/tasks/02-breakdown.md):
--   * `create extension` for citext (profiles.email)
--   * `create table` for every table in data-model.md § Tables
--   * Inline column-level and table-level UNIQUE / CHECK / FK constraints
--
-- Explicitly DEFERRED to later migrations (do not add here):
--   * Triggers and trigger functions ............ 20260101000002_triggers.sql
--   * Row-Level Security enable + policies ...... 20260101000003_rls_policies.sql
--   * Realtime publication membership ........... 20260101000004_realtime.sql
--   * Non-inline CREATE [UNIQUE] INDEX statements 20260101000005_indexes.sql
--
-- Explicitly OUT OF SCOPE (per docs/tasks/02-supabase-schema.md):
--   * `subscriptions` table — deferred to v1.x (Stripe).
--
-- Source of truth: docs/architecture/data-model.md.
-- =============================================================================

-- Case-insensitive text — used by profiles.email so 'A@x.com' == 'a@x.com'.
create extension if not exists citext;


-- =============================================================================
-- profiles
-- App-side extension of auth.users (1:1). PK is auth.users.id, NOT a fresh uuid.
-- =============================================================================
create table public.profiles (
  id            uuid        primary key references auth.users on delete cascade,
  email         citext      not null unique,
  display_name  text,
  avatar_url    text,
  timezone      text        not null default 'America/New_York',
  theme         text        not null default 'dark'
                            check (theme in ('light', 'dark', 'system')),
  onboarded_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);


-- =============================================================================
-- prop_firms
-- Reference data — public read, no per-user rows. No updated_at by design.
-- =============================================================================
create table public.prop_firms (
  id          uuid        primary key default gen_random_uuid(),
  slug        text        not null unique,
  name        text        not null,
  website     text,
  logo_url    text,
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now()
);


-- =============================================================================
-- prop_firm_account_types
-- One row per offered account size for each firm. No updated_at by design;
-- mutations happen via new rules_version rather than in-place edits.
-- =============================================================================
create table public.prop_firm_account_types (
  id                    uuid           primary key default gen_random_uuid(),
  prop_firm_id          uuid           not null references public.prop_firms(id) on delete cascade,
  slug                  text           not null,
  name                  text           not null,
  starting_balance      numeric(14, 2) not null,
  profit_target         numeric(14, 2),
  trailing_drawdown     numeric(14, 2),
  static_max_loss       numeric(14, 2),
  daily_loss_limit      numeric(14, 2),
  max_contracts         integer,
  consistency_rule_pct  numeric(5, 2),
  rules_doc_url         text,
  rules_version         text           not null default '1.0.0',
  created_at            timestamptz    not null default now(),
  unique (prop_firm_id, slug)
);


-- =============================================================================
-- accounts
-- Most-used table in the app. Soft-deleted via deleted_at.
-- highest_balance is maintained by tg_update_highest_balance (S3 trigger).
-- =============================================================================
create table public.accounts (
  id                          uuid           primary key default gen_random_uuid(),
  user_id                     uuid           not null references auth.users on delete cascade,
  prop_firm_id                uuid           references public.prop_firms(id),
  account_type_id             uuid           references public.prop_firm_account_types(id),
  nickname                    text           not null,
  status                      text           not null default 'evaluation'
                                             check (status in ('evaluation', 'funded', 'breached', 'archived')),
  rules_config                jsonb          not null,
  starting_balance            numeric(14, 2) not null,
  current_balance             numeric(14, 2) not null,
  highest_balance             numeric(14, 2) not null,
  current_pnl                 numeric(14, 2) not null default 0,
  open_pnl                    numeric(14, 2) not null default 0,
  current_position_contracts  integer        not null default 0,
  last_updated_at             timestamptz    not null default now(),
  breached_at                 timestamptz,
  funded_at                   timestamptz,
  deleted_at                  timestamptz,
  created_at                  timestamptz    not null default now(),
  updated_at                  timestamptz    not null default now()
);


-- =============================================================================
-- trades
-- v1.0 = manual entry; v1.1 = enhanced; v2.0 = auto-imported from broker.
-- Soft-deleted via deleted_at.
-- Note: the CHECK on emotional_state lists null explicitly to mirror the spec.
-- A null value bypasses CHECK constraints in Postgres regardless, so this is
-- equivalent to omitting null from the IN list, but we preserve the spec form.
-- =============================================================================
create table public.trades (
  id               uuid           primary key default gen_random_uuid(),
  user_id          uuid           not null references auth.users on delete cascade,
  account_id       uuid           not null references public.accounts(id) on delete cascade,
  symbol           text           not null,
  direction        text           not null check (direction in ('long', 'short')),
  contracts        integer        not null check (contracts > 0),
  entry_price      numeric(14, 4) not null,
  exit_price       numeric(14, 4),
  entry_at         timestamptz    not null,
  exit_at          timestamptz,
  pnl              numeric(14, 2),
  fees             numeric(14, 2) not null default 0,
  setup_tag        text,
  notes            text,
  emotional_state  text           check (emotional_state in ('confident', 'uncertain', 'fomo', 'revenge', 'patient', 'tilted', null)),
  source           text           not null default 'manual'
                                  check (source in ('manual', 'tradovate', 'rithmic', 'ninjatrader', 'csv_import')),
  external_id      text,
  deleted_at       timestamptz,
  created_at       timestamptz    not null default now(),
  updated_at       timestamptz    not null default now()
);


-- =============================================================================
-- trade_screenshots
-- Image references; bytes live in the `trade-screenshots` Storage bucket.
-- =============================================================================
create table public.trade_screenshots (
  id            uuid        primary key default gen_random_uuid(),
  trade_id      uuid        not null references public.trades(id) on delete cascade,
  user_id       uuid        not null references auth.users on delete cascade,
  storage_path  text        not null,
  caption       text,
  created_at    timestamptz not null default now()
);


-- =============================================================================
-- checklists
-- Pre-trade routine templates. is_default is constrained to one-per-user via
-- a partial unique index created in 20260101000005_indexes.sql.
-- =============================================================================
create table public.checklists (
  id             uuid        primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users on delete cascade,
  name           text        not null,
  description    text,
  is_default     boolean     not null default false,
  display_order  integer     not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);


-- =============================================================================
-- checklist_items
-- Ordered prompts inside a checklist. No updated_at — items are recreated
-- on edit rather than mutated in place.
-- =============================================================================
create table public.checklist_items (
  id             uuid        primary key default gen_random_uuid(),
  checklist_id   uuid        not null references public.checklists(id) on delete cascade,
  user_id        uuid        not null references auth.users on delete cascade,
  prompt         text        not null,
  input_type     text        not null default 'boolean'
                             check (input_type in ('boolean', 'text', 'number')),
  is_required    boolean     not null default true,
  display_order  integer     not null default 0,
  created_at     timestamptz not null default now()
);


-- =============================================================================
-- checklist_runs
-- One daily completion of a checklist. Uniqueness enforces one run per
-- (user, checklist, day).
-- =============================================================================
create table public.checklist_runs (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users on delete cascade,
  checklist_id  uuid        not null references public.checklists(id) on delete cascade,
  account_id    uuid        references public.accounts(id) on delete set null,
  trading_date  date        not null,
  responses     jsonb       not null,
  is_complete   boolean     not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (user_id, checklist_id, trading_date)
);


-- =============================================================================
-- chart_layouts
-- Persisted TradingView layouts per user.
-- =============================================================================
create table public.chart_layouts (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users on delete cascade,
  name        text        not null,
  symbol      text        not null,
  resolution  text        not null,
  content     jsonb       not null,
  is_default  boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);


-- =============================================================================
-- user_preferences
-- 1:1 with auth.users — note that user_id IS the primary key (no separate id).
-- =============================================================================
create table public.user_preferences (
  user_id                       uuid           primary key references auth.users on delete cascade,
  default_account_id            uuid           references public.accounts(id) on delete set null,
  default_symbol                text           not null default 'NQ',
  default_resolution            text           not null default '15',
  alert_threshold_warning_pct   numeric(5, 2)  not null default 0.20,
  alert_threshold_danger_pct    numeric(5, 2)  not null default 0.10,
  email_notifications_enabled   boolean        not null default true,
  realtime_alerts_enabled       boolean        not null default true,
  reduced_motion                boolean        not null default false,
  density                       text           not null default 'comfortable'
                                               check (density in ('compact', 'comfortable')),
  created_at                    timestamptz    not null default now(),
  updated_at                    timestamptz    not null default now()
);


-- =============================================================================
-- economic_events
-- Calendar entries from upstream provider. external_id is the dedupe key.
-- No created_at / updated_at — ingestion stamp lives in fetched_at.
-- =============================================================================
create table public.economic_events (
  id             uuid        primary key default gen_random_uuid(),
  external_id    text        not null unique,
  name           text        not null,
  country        text        not null,
  currency       text,
  impact         text        not null check (impact in ('low', 'medium', 'high')),
  scheduled_for  timestamptz not null,
  actual         numeric,
  forecast       numeric,
  previous       numeric,
  unit           text,
  source         text        not null,
  fetched_at     timestamptz not null default now()
);
