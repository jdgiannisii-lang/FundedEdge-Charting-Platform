-- Migration: realtime publication
-- Adds accounts and trades to the supabase_realtime publication so clients
-- can subscribe to row-level change events via Supabase Realtime.

alter publication supabase_realtime add table public.accounts;
alter publication supabase_realtime add table public.trades;
