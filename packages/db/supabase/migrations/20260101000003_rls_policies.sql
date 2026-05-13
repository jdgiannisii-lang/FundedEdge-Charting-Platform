-- =============================================================================
-- Migration: 20260101000003_rls_policies
-- Purpose:   Enable Row-Level Security on every public table and create the
--            policies specified in docs/architecture/data-model.md.
--
-- Scope of THIS migration (S4 in docs/tasks/02-breakdown.md):
--   * alter table ... enable row level security on every public table
--   * create policy statements (19 total across 12 tables)
--
-- Explicitly DEFERRED (do not add here):
--   * Realtime publication membership ........... 20260101000004_realtime.sql
--   * Non-inline CREATE [UNIQUE] INDEX statements 20260101000005_indexes.sql
--
-- Source of truth: docs/architecture/data-model.md § per-table policy blocks.
--
-- SECURITY CRITICALITY:
--   This is the most security-critical file in the codebase. Every policy
--   here is the line between a user reading their own data and a user
--   reading every other user's data. Audit any change line by line.
--
-- POLICY SHAPE NOTES:
--   * profiles is keyed on `id` (not `user_id`). It is a 1:1 with auth.users.
--   * user_preferences uses `user_id` as both PK and FK.
--   * INSERT policies use WITH CHECK; SELECT/UPDATE/DELETE use USING.
--   * Where a policy uses `for all using (...)` without WITH CHECK,
--     Postgres applies USING to both visibility (old row) and post-write
--     check (new row), which is the secure default for these tables.
--
-- DEVIATIONS FROM data-model.md (intentional, surfaced in the PR):
--   1. `trades` is split into 4 separate policies (SELECT/INSERT/UPDATE/DELETE)
--      instead of `for all`. This is required by docs/tasks/02-breakdown.md § S4
--      which mandates `deleted_at is null` in the SELECT policy for soft-delete
--      tables. A `for all` policy with `deleted_at is null` would break
--      soft-deletion itself (the post-update row check would fail when setting
--      deleted_at to a non-null timestamp). The 4-policy split mirrors the
--      pattern used by `accounts` in data-model.md.
--   2. `trade_screenshots` does NOT receive a `deleted_at is null` clause.
--      The breakdown § S4 lists it as a soft-delete table, but the schema in
--      data-model.md does not include a deleted_at column on this table.
--      Cleanup happens via FK cascade when the parent trade is hard-deleted.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. profiles
--    Keyed on `id` (1:1 with auth.users). No INSERT policy: rows are created
--    exclusively by the security-definer trigger tg_create_profile that fires
--    on auth.users insert (see migration 20260101000002_triggers.sql). No
--    DELETE policy: rows cascade-delete when the parent auth.users row is
--    deleted.
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;

drop policy if exists "users see own profile" on public.profiles;
create policy "users see own profile"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile"
on public.profiles
for update
using (auth.uid() = id);


-- -----------------------------------------------------------------------------
-- 2. prop_firms
--    Public reference data. Anyone (anon or authenticated) may read.
--    Writes happen exclusively via the service role during seed.
-- -----------------------------------------------------------------------------

alter table public.prop_firms enable row level security;

drop policy if exists "anyone reads prop firms" on public.prop_firms;
create policy "anyone reads prop firms"
on public.prop_firms
for select
using (true);


-- -----------------------------------------------------------------------------
-- 3. prop_firm_account_types
--    Public reference data, same pattern as prop_firms.
-- -----------------------------------------------------------------------------

alter table public.prop_firm_account_types enable row level security;

drop policy if exists "anyone reads account types" on public.prop_firm_account_types;
create policy "anyone reads account types"
on public.prop_firm_account_types
for select
using (true);


-- -----------------------------------------------------------------------------
-- 4. accounts
--    Soft-delete table. SELECT hides deleted rows. UPDATE intentionally does
--    NOT filter by deleted_at so users can both soft-delete (set deleted_at)
--    and recover (clear deleted_at).
-- -----------------------------------------------------------------------------

alter table public.accounts enable row level security;

drop policy if exists "users see own accounts" on public.accounts;
create policy "users see own accounts"
on public.accounts
for select
using (auth.uid() = user_id and deleted_at is null);

drop policy if exists "users insert own accounts" on public.accounts;
create policy "users insert own accounts"
on public.accounts
for insert
with check (auth.uid() = user_id);

drop policy if exists "users update own accounts" on public.accounts;
create policy "users update own accounts"
on public.accounts
for update
using (auth.uid() = user_id);

drop policy if exists "users delete own accounts" on public.accounts;
create policy "users delete own accounts"
on public.accounts
for delete
using (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 5. trades
--    Soft-delete table. Split into 4 policies (see deviation note in header).
--    Mirrors the accounts pattern: SELECT filters deleted_at; INSERT/UPDATE/
--    DELETE do not.
-- -----------------------------------------------------------------------------

alter table public.trades enable row level security;

drop policy if exists "users see own trades" on public.trades;
create policy "users see own trades"
on public.trades
for select
using (auth.uid() = user_id and deleted_at is null);

drop policy if exists "users insert own trades" on public.trades;
create policy "users insert own trades"
on public.trades
for insert
with check (auth.uid() = user_id);

drop policy if exists "users update own trades" on public.trades;
create policy "users update own trades"
on public.trades
for update
using (auth.uid() = user_id);

drop policy if exists "users delete own trades" on public.trades;
create policy "users delete own trades"
on public.trades
for delete
using (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 6. trade_screenshots
--    No soft-delete column (cascade-deleted with parent trade). Single
--    for-all policy per data-model.md.
-- -----------------------------------------------------------------------------

alter table public.trade_screenshots enable row level security;

drop policy if exists "users crud own screenshots" on public.trade_screenshots;
create policy "users crud own screenshots"
on public.trade_screenshots
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 7. checklists
-- -----------------------------------------------------------------------------

alter table public.checklists enable row level security;

drop policy if exists "users crud own checklists" on public.checklists;
create policy "users crud own checklists"
on public.checklists
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 8. checklist_items
-- -----------------------------------------------------------------------------

alter table public.checklist_items enable row level security;

drop policy if exists "users crud own checklist items" on public.checklist_items;
create policy "users crud own checklist items"
on public.checklist_items
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 9. checklist_runs
-- -----------------------------------------------------------------------------

alter table public.checklist_runs enable row level security;

drop policy if exists "users crud own checklist runs" on public.checklist_runs;
create policy "users crud own checklist runs"
on public.checklist_runs
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 10. chart_layouts
-- -----------------------------------------------------------------------------

alter table public.chart_layouts enable row level security;

drop policy if exists "users crud own chart layouts" on public.chart_layouts;
create policy "users crud own chart layouts"
on public.chart_layouts
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 11. user_preferences
--    Keyed on user_id (also the PK).
-- -----------------------------------------------------------------------------

alter table public.user_preferences enable row level security;

drop policy if exists "users crud own preferences" on public.user_preferences;
create policy "users crud own preferences"
on public.user_preferences
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);


-- -----------------------------------------------------------------------------
-- 12. economic_events
--    Public reference data. Anyone may read.
-- -----------------------------------------------------------------------------

alter table public.economic_events enable row level security;

drop policy if exists "anyone reads events" on public.economic_events;
create policy "anyone reads events"
on public.economic_events
for select
using (true);
