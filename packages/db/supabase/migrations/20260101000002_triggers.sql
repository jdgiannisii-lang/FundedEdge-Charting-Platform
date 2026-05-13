-- =============================================================================
-- Migration: 20260101000002_triggers
-- Purpose:   Add trigger functions and their attachments per
--            docs/architecture/data-model.md § Triggers.
--
-- Scope of THIS migration (S3 in docs/tasks/02-breakdown.md):
--   * tg_set_updated_at()         attached to every table with an updated_at
--                                 column (7 tables)
--   * tg_create_profile()         after insert on auth.users -> populates
--                                 public.profiles + public.user_preferences
--   * tg_update_highest_balance() before insert or update on public.accounts
--                                 keeps highest_balance monotonic non-decreasing
--
-- Explicitly DEFERRED (do not add here):
--   * Row-Level Security enable + policies ...... 20260101000003_rls_policies.sql
--   * Realtime publication membership ........... 20260101000004_realtime.sql
--   * Non-inline CREATE [UNIQUE] INDEX statements 20260101000005_indexes.sql
--
-- Source of truth: docs/architecture/data-model.md § Triggers.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. tg_set_updated_at()
--    Generic BEFORE UPDATE trigger that stamps now() onto updated_at.
--    Attached only to tables that declare an updated_at column in the S2
--    schema migration; the list below is the verified set.
-- -----------------------------------------------------------------------------

create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.tg_set_updated_at();

drop trigger if exists accounts_updated_at on public.accounts;
create trigger accounts_updated_at
before update on public.accounts
for each row execute function public.tg_set_updated_at();

drop trigger if exists trades_updated_at on public.trades;
create trigger trades_updated_at
before update on public.trades
for each row execute function public.tg_set_updated_at();

drop trigger if exists checklists_updated_at on public.checklists;
create trigger checklists_updated_at
before update on public.checklists
for each row execute function public.tg_set_updated_at();

drop trigger if exists checklist_runs_updated_at on public.checklist_runs;
create trigger checklist_runs_updated_at
before update on public.checklist_runs
for each row execute function public.tg_set_updated_at();

drop trigger if exists chart_layouts_updated_at on public.chart_layouts;
create trigger chart_layouts_updated_at
before update on public.chart_layouts
for each row execute function public.tg_set_updated_at();

drop trigger if exists user_preferences_updated_at on public.user_preferences;
create trigger user_preferences_updated_at
before update on public.user_preferences
for each row execute function public.tg_set_updated_at();

-- Note: checklist_items, prop_firms, prop_firm_account_types,
-- trade_screenshots, and economic_events intentionally have no updated_at
-- column (per data-model.md) and therefore receive no trigger.


-- -----------------------------------------------------------------------------
-- 2. tg_create_profile()
--    When a new row is inserted into auth.users (Supabase Auth signup),
--    automatically create the corresponding public.profiles and
--    public.user_preferences rows.
--
--    SECURITY DEFINER because this trigger fires in the auth schema and
--    needs permission to write into the public schema regardless of the
--    invoking session role.
-- -----------------------------------------------------------------------------

create or replace function public.tg_create_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  insert into public.user_preferences (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.tg_create_profile();


-- -----------------------------------------------------------------------------
-- 3. tg_update_highest_balance()
--    On every insert or update of public.accounts, ensure highest_balance is
--    at least the current_balance. Acts as a monotonic high-water mark used
--    by the rules engine for trailing-drawdown calculations.
--
--    Implemented with an explicit IF rather than greatest() to match the
--    spec wording in data-model.md § Triggers verbatim.
-- -----------------------------------------------------------------------------

create or replace function public.tg_update_highest_balance()
returns trigger
language plpgsql
as $$
begin
  if new.current_balance > new.highest_balance then
    new.highest_balance = new.current_balance;
  end if;
  return new;
end;
$$;

drop trigger if exists accounts_highest_balance on public.accounts;
create trigger accounts_highest_balance
before insert or update on public.accounts
for each row execute function public.tg_update_highest_balance();
