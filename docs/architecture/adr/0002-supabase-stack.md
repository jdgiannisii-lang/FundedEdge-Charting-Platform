# ADR 0002: Supabase as the entire backend stack

**Date:** 2026-Day-0
**Status:** Accepted

## Context

We need: Postgres database, authentication, realtime updates, file storage, and a path to scale to potentially millions of users. Solo founder, low budget, 90-day shipping target.

## Decision

Use Supabase for all of: Postgres + Auth + Realtime + Storage + Edge Functions (if needed).

## Alternatives considered

- **Postgres on Neon + Clerk for auth + Pusher for realtime + S3 for storage + custom backend** — most flexible, but four vendors, four billing relationships, four sets of credentials, more glue code. Wrong choice for solo founder under deadline.
- **Convex** — beautiful DX, TypeScript-first, but smaller ecosystem and pricing scales unpredictably. Locks us into a paradigm we'd struggle to migrate from.
- **Firebase** — proven scale but document model fights relational data. We have lots of joins (accounts ↔ trades ↔ checklists ↔ rules). Postgres wins here.
- **Build our own on AWS** — possible but a months-long project before we ship a feature.

## Consequences

**Good:**
- One vendor, one dashboard, one billing relationship, one set of credentials
- Auth, realtime, and storage all RLS-aware out of the box
- Local development via `supabase start` (Docker)
- Free tier covers us through public beta
- Pro tier ($25/mo) covers us through several thousand users
- Self-host escape hatch exists (Supabase is open source)

**Bad:**
- Realtime can be expensive at scale (per-connection pricing) — mitigated by limiting subscriptions to active accounts
- Some lock-in to Supabase-specific helpers (`auth.uid()` in RLS, etc.) — manageable, mostly portable to vanilla Postgres
- Edge functions in Deno, not Node — not great DX, we'll prefer Vercel functions for most server logic

## Implementation notes

- Local dev: `supabase start` runs full stack in Docker
- Migrations: `supabase migration new <name>` and `supabase db push`
- Type generation: `supabase gen types typescript --project-id $REF > packages/db/src/generated/types.ts`
- RLS policies in migrations, not the dashboard, so they're versioned

See `docs/tasks/02-supabase-schema.md`.
