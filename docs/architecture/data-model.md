# Data Model

Postgres schema, managed by Supabase, defined in migrations under `packages/db/migrations/`. Types auto-generated to `packages/db/src/generated/types.ts` via `supabase gen types typescript`.

**Conventions:**
- Snake_case for tables and columns
- `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` for every table
- `created_at timestamptz NOT NULL DEFAULT now()` and `updated_at timestamptz NOT NULL DEFAULT now()` on every table
- Soft deletes via `deleted_at timestamptz NULL` where data must be recoverable (accounts, trades, journal entries)
- Hard delete via cascade for ephemeral data (sessions, settings)
- Every table has RLS enabled
- FK columns end in `_id` and are indexed

## Tables

### `profiles`
Extension of `auth.users` for app-specific data.

```sql
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email citext not null unique,
  display_name text,
  avatar_url text,
  timezone text not null default 'America/New_York',
  theme text not null default 'dark' check (theme in ('light', 'dark', 'system')),
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "users see own profile" on public.profiles for select using (auth.uid() = id);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id);
```

### `prop_firms`
Reference data — the firms we have presets for. Read-only for users.

```sql
create table public.prop_firms (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  website text,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.prop_firms enable row level security;
create policy "anyone reads prop firms" on public.prop_firms for select using (true);
```

### `prop_firm_account_types`

```sql
create table public.prop_firm_account_types (
  id uuid primary key default gen_random_uuid(),
  prop_firm_id uuid not null references public.prop_firms(id) on delete cascade,
  slug text not null,
  name text not null,
  starting_balance numeric(14,2) not null,
  profit_target numeric(14,2),
  trailing_drawdown numeric(14,2),
  static_max_loss numeric(14,2),
  daily_loss_limit numeric(14,2),
  max_contracts integer,
  consistency_rule_pct numeric(5,2),
  rules_doc_url text,
  rules_version text not null default '1.0.0',
  created_at timestamptz not null default now(),
  unique (prop_firm_id, slug)
);

alter table public.prop_firm_account_types enable row level security;
create policy "anyone reads account types" on public.prop_firm_account_types for select using (true);
```

### `accounts`
Most-used table in the app.

```sql
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  prop_firm_id uuid references public.prop_firms(id),
  account_type_id uuid references public.prop_firm_account_types(id),
  nickname text not null,
  status text not null default 'evaluation' check (status in ('evaluation', 'funded', 'breached', 'archived')),
  rules_config jsonb not null,
  starting_balance numeric(14,2) not null,
  current_balance numeric(14,2) not null,
  highest_balance numeric(14,2) not null,
  current_pnl numeric(14,2) not null default 0,
  open_pnl numeric(14,2) not null default 0,
  current_position_contracts integer not null default 0,
  last_updated_at timestamptz not null default now(),
  breached_at timestamptz,
  funded_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index accounts_user_id_idx on public.accounts(user_id) where deleted_at is null;

alter table public.accounts enable row level security;
create policy "users see own accounts" on public.accounts for select using (auth.uid() = user_id and deleted_at is null);
create policy "users insert own accounts" on public.accounts for insert with check (auth.uid() = user_id);
create policy "users update own accounts" on public.accounts for update using (auth.uid() = user_id);
create policy "users delete own accounts" on public.accounts for delete using (auth.uid() = user_id);

alter publication supabase_realtime add table public.accounts;
```

The `rules_config` jsonb structure is documented in `packages/rules-engine/src/types.ts` and matches the `RulesConfig` type:

```typescript
type RulesConfig = {
  version: string

  drawdown: {
    type: 'trailing' | 'static' | 'none'
    amount: number
    trailing_method?: 'eod' | 'intraday' | 'lock_at_target'
    lock_at_balance?: number
  }

  daily_loss: {
    type: 'absolute' | 'percentage' | 'none'
    amount: number
    reset_time: string  // e.g., "17:00 America/Chicago"
  }

  profit_target: {
    amount: number
    achieved_when: 'absolute' | 'eod_balance'
  }

  consistency: {
    type: 'best_day_pct' | 'min_trading_days' | 'none'
    threshold?: number
    min_days?: number
    applies_to: 'evaluation' | 'funded' | 'both'
  }

  contract_scaling: {
    enabled: boolean
    rules: Array<{ profit_threshold: number; max_contracts: number }>
  }

  news_trading: {
    restricted: boolean
    restriction_window_minutes_before: number
    restriction_window_minutes_after: number
    impact_levels: Array<'high' | 'medium' | 'low'>
  }

  custom_notes: string
}
```

### `trades`
v1.0 = manual entry; v1.1 = enhanced; v2.0 = auto from broker.

```sql
create table public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  symbol text not null,
  direction text not null check (direction in ('long', 'short')),
  contracts integer not null check (contracts > 0),
  entry_price numeric(14,4) not null,
  exit_price numeric(14,4),
  entry_at timestamptz not null,
  exit_at timestamptz,
  pnl numeric(14,2),
  fees numeric(14,2) not null default 0,
  setup_tag text,
  notes text,
  emotional_state text check (emotional_state in ('confident', 'uncertain', 'fomo', 'revenge', 'patient', 'tilted', null)),
  source text not null default 'manual' check (source in ('manual', 'tradovate', 'rithmic', 'ninjatrader', 'csv_import')),
  external_id text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trades_user_account_idx on public.trades(user_id, account_id, entry_at desc) where deleted_at is null;

alter table public.trades enable row level security;
create policy "users crud own trades" on public.trades for all using (auth.uid() = user_id);

alter publication supabase_realtime add table public.trades;
```

### `trade_screenshots`

```sql
create table public.trade_screenshots (
  id uuid primary key default gen_random_uuid(),
  trade_id uuid not null references public.trades(id) on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

alter table public.trade_screenshots enable row level security;
create policy "users crud own screenshots" on public.trade_screenshots for all using (auth.uid() = user_id);
```

### `checklists`

```sql
create table public.checklists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  description text,
  is_default boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index one_default_checklist_per_user on public.checklists(user_id) where is_default;

alter table public.checklists enable row level security;
create policy "users crud own checklists" on public.checklists for all using (auth.uid() = user_id);
```

### `checklist_items`

```sql
create table public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  checklist_id uuid not null references public.checklists(id) on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  prompt text not null,
  input_type text not null default 'boolean' check (input_type in ('boolean', 'text', 'number')),
  is_required boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.checklist_items enable row level security;
create policy "users crud own checklist items" on public.checklist_items for all using (auth.uid() = user_id);
```

### `checklist_runs`

```sql
create table public.checklist_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  checklist_id uuid not null references public.checklists(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete set null,
  trading_date date not null,
  responses jsonb not null,
  is_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, checklist_id, trading_date)
);

alter table public.checklist_runs enable row level security;
create policy "users crud own checklist runs" on public.checklist_runs for all using (auth.uid() = user_id);
```

### `chart_layouts`

```sql
create table public.chart_layouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  symbol text not null,
  resolution text not null,
  content jsonb not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chart_layouts enable row level security;
create policy "users crud own chart layouts" on public.chart_layouts for all using (auth.uid() = user_id);
```

### `user_preferences`

```sql
create table public.user_preferences (
  user_id uuid primary key references auth.users on delete cascade,
  default_account_id uuid references public.accounts(id) on delete set null,
  default_symbol text not null default 'NQ',
  default_resolution text not null default '15',
  alert_threshold_warning_pct numeric(5,2) not null default 0.20,
  alert_threshold_danger_pct numeric(5,2) not null default 0.10,
  email_notifications_enabled boolean not null default true,
  realtime_alerts_enabled boolean not null default true,
  reduced_motion boolean not null default false,
  density text not null default 'comfortable' check (density in ('compact', 'comfortable')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;
create policy "users crud own preferences" on public.user_preferences for all using (auth.uid() = user_id);
```

### `economic_events`

```sql
create table public.economic_events (
  id uuid primary key default gen_random_uuid(),
  external_id text not null unique,
  name text not null,
  country text not null,
  currency text,
  impact text not null check (impact in ('low', 'medium', 'high')),
  scheduled_for timestamptz not null,
  actual numeric,
  forecast numeric,
  previous numeric,
  unit text,
  source text not null,
  fetched_at timestamptz not null default now()
);

create index economic_events_scheduled_idx on public.economic_events(scheduled_for, impact);

alter table public.economic_events enable row level security;
create policy "anyone reads events" on public.economic_events for select using (true);
```

### `subscriptions` (added in v1.x)

```sql
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users on delete cascade,
  stripe_customer_id text not null unique,
  stripe_subscription_id text unique,
  status text not null,
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  trial_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;
create policy "users see own subscription" on public.subscriptions for select using (auth.uid() = user_id);
```

## Triggers

```sql
create or replace function public.tg_set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.tg_set_updated_at();
create trigger accounts_updated_at before update on public.accounts for each row execute function public.tg_set_updated_at();
create trigger trades_updated_at before update on public.trades for each row execute function public.tg_set_updated_at();
-- ... etc

create or replace function public.tg_create_profile() returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  insert into public.user_preferences (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.tg_create_profile();

create or replace function public.tg_update_highest_balance() returns trigger language plpgsql as $$
begin
  if new.current_balance > new.highest_balance then
    new.highest_balance = new.current_balance;
  end if;
  return new;
end;
$$;

create trigger accounts_highest_balance before insert or update on public.accounts for each row execute function public.tg_update_highest_balance();
```

## Storage buckets

| Bucket | Public | RLS | Notes |
|---|---|---|---|
| `trade-screenshots` | no | user owns folder | Path: `{user_id}/{trade_id}/{filename}` |
| `avatars` | yes | user owns folder | Path: `{user_id}/avatar.{ext}` |
| `firm-logos` | yes | admin only | Read by all, write by service role only |
