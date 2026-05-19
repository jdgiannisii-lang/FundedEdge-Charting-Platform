/**
 * RLS + Trigger integration test suite.
 *
 * Requires `supabase start` to be running in packages/db before executing.
 * Credentials default to the well-known local Supabase dev values.
 * A URL guard prevents accidental execution against production.
 *
 * Run: pnpm --filter @fundededge/db test:unit
 */

import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Database } from '../generated/types'

// ---------------------------------------------------------------------------
// Credentials — read from environment variables.
// For local dev: copy packages/db/.env.test.local.example to
//               packages/db/.env.test.local and fill in values from
//               `supabase status` (run in packages/db).
// For CI (S11): set TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY,
//               TEST_SUPABASE_SERVICE_KEY as GitHub Actions secrets.
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.TEST_SUPABASE_URL ?? 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY = process.env.TEST_SUPABASE_ANON_KEY ?? ''
const SUPABASE_SERVICE_KEY = process.env.TEST_SUPABASE_SERVICE_KEY ?? ''

// All RLS tests skip when credentials are absent (e.g. CI before S11).
// After S11 wires up the GitHub Actions Supabase stack, HAS_CREDS will be
// true in CI and all 57 tests will run.
const HAS_CREDS = !!SUPABASE_ANON_KEY && !!SUPABASE_SERVICE_KEY

// Safety: credentials present but pointing at production — abort hard.
if (
  HAS_CREDS &&
  !SUPABASE_URL.includes('localhost') &&
  !SUPABASE_URL.includes('127.0.0.1')
) {
  throw new Error(
    `RLS tests must only run against localhost. Got: ${SUPABASE_URL}`,
  )
}

// ---------------------------------------------------------------------------
// Shared clients
// ---------------------------------------------------------------------------
const svc = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const anon = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ---------------------------------------------------------------------------
// Test user helpers
// ---------------------------------------------------------------------------
interface TestUser {
  id: string
  email: string
  client: SupabaseClient<Database>
}

const TEST_PASSWORD = 'Test-RLS-Pass-1!'

async function makeUser(tag: string): Promise<TestUser> {
  const email = `${crypto.randomUUID().slice(0, 8)}-${tag}@rls-test.local`

  const {
    data: { user },
    error: cErr,
  } = await svc.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (cErr || !user) throw new Error(`makeUser failed: ${cErr?.message}`)

  const signInClient = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const {
    data: { session },
    error: sErr,
  } = await signInClient.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  })
  if (sErr || !session) throw new Error(`signIn failed: ${sErr?.message}`)

  const client = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${session.access_token}` } },
  })

  return { id: user.id, email, client }
}

async function dropUser(id: string) {
  await svc.auth.admin.deleteUser(id)
}

// ---------------------------------------------------------------------------
// Shared test state — created in outer beforeAll, reused across all suites
// ---------------------------------------------------------------------------
let A: TestUser
let B: TestUser
let aAccountId: string
let aTradeId: string
let aChecklistId: string

beforeAll(async () => {
  A = await makeUser('a')
  B = await makeUser('b')

  // userA account
  const { data: acc, error: accErr } = await A.client
    .from('accounts')
    .insert({
      user_id: A.id,
      nickname: 'rls-test-account',
      rules_config: {},
      starting_balance: 10000,
      current_balance: 10000,
      highest_balance: 10000,
    })
    .select('id')
    .single()
  if (accErr || !acc) throw new Error(`account setup: ${accErr?.message}`)
  aAccountId = acc.id

  // userA trade (needs account)
  const { data: trade, error: tradeErr } = await A.client
    .from('trades')
    .insert({
      user_id: A.id,
      account_id: aAccountId,
      symbol: 'NQ',
      direction: 'long',
      contracts: 1,
      entry_price: 22000,
      entry_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (tradeErr || !trade) throw new Error(`trade setup: ${tradeErr?.message}`)
  aTradeId = trade.id

  // userA checklist
  const { data: cl, error: clErr } = await A.client
    .from('checklists')
    .insert({ user_id: A.id, name: 'rls-test-checklist' })
    .select('id')
    .single()
  if (clErr || !cl) throw new Error(`checklist setup: ${clErr?.message}`)
  aChecklistId = cl.id
})

afterAll(async () => {
  // Deleting auth users cascades to all owned rows
  if (A) await dropUser(A.id)
  if (B) await dropUser(B.id)
})

// ============================================================================
// Reference tables — public read, no user writes
// ============================================================================

describe.skipIf(!HAS_CREDS)('RLS: prop_firms', () => {
  it('anonymous can read prop_firms', async () => {
    const { data, error } = await anon.from('prop_firms').select('slug')
    expect(error).toBeNull()
    expect(data?.length).toBeGreaterThan(0)
  })

  it('authenticated user can read prop_firms', async () => {
    const { data, error } = await A.client.from('prop_firms').select('slug')
    expect(error).toBeNull()
    expect(data?.length).toBeGreaterThan(0)
  })

  it('authenticated user cannot insert into prop_firms', async () => {
    const { error } = await A.client
      .from('prop_firms')
      .insert({ slug: 'hack', name: 'Hack Firm' })
    expect(error).not.toBeNull()
  })

  it('authenticated user cannot update prop_firms', async () => {
    const { data } = await A.client
      .from('prop_firms')
      .update({ name: 'Pwned' })
      .eq('slug', 'apex')
      .select()
    expect(data).toEqual([])
  })

  it('authenticated user cannot delete from prop_firms', async () => {
    await A.client.from('prop_firms').delete().eq('slug', 'apex')
    // RLS silently drops the delete — verify row still exists
    const { data } = await svc.from('prop_firms').select('slug').eq('slug', 'apex')
    expect(data).toHaveLength(1)
  })
})

describe.skipIf(!HAS_CREDS)('RLS: prop_firm_account_types', () => {
  it('anonymous can read prop_firm_account_types', async () => {
    const { data, error } = await anon.from('prop_firm_account_types').select('slug')
    expect(error).toBeNull()
    expect(data?.length).toBeGreaterThan(0)
  })

  it('authenticated user cannot insert into prop_firm_account_types', async () => {
    const { data: firm } = await svc.from('prop_firms').select('id').eq('slug', 'apex').single()
    if (!firm) throw new Error('apex firm not found in seed')
    const { error } = await A.client.from('prop_firm_account_types').insert({
      prop_firm_id: firm.id,
      slug: 'hack-type',
      name: 'Hack Type',
      starting_balance: 1000,
    })
    expect(error).not.toBeNull()
  })
})

describe.skipIf(!HAS_CREDS)('RLS: economic_events', () => {
  let eventId: string

  beforeAll(async () => {
    const { data } = await svc
      .from('economic_events')
      .insert({
        external_id: `rls-test-event-${crypto.randomUUID().slice(0, 8)}`,
        name: 'RLS Test Event',
        country: 'US',
        impact: 'high',
        scheduled_for: new Date().toISOString(),
        source: 'rls-test',
      })
      .select('id')
      .single()
    if (!data) throw new Error('event insert failed')
    eventId = data.id
  })

  afterAll(async () => {
    if (eventId) await svc.from('economic_events').delete().eq('id', eventId)
  })

  it('anonymous can read economic_events', async () => {
    const { data, error } = await anon.from('economic_events').select('id').eq('id', eventId)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  it('authenticated user can read economic_events', async () => {
    const { data, error } = await A.client.from('economic_events').select('id').eq('id', eventId)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  it('authenticated user cannot insert into economic_events', async () => {
    const { error } = await A.client.from('economic_events').insert({
      external_id: `hack-${crypto.randomUUID().slice(0, 8)}`,
      name: 'Hack',
      country: 'US',
      impact: 'high',
      scheduled_for: new Date().toISOString(),
      source: 'hack',
    })
    expect(error).not.toBeNull()
  })
})

// ============================================================================
// profiles — created by trigger, SELECT + UPDATE only
// ============================================================================

describe.skipIf(!HAS_CREDS)('RLS: profiles', () => {
  it('user A can read own profile', async () => {
    const { data, error } = await A.client.from('profiles').select('id').eq('id', A.id)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  it('user A cannot read user B profile', async () => {
    const { data, error } = await A.client.from('profiles').select('id').eq('id', B.id)
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  it('user A can update own profile', async () => {
    const { error } = await A.client
      .from('profiles')
      .update({ display_name: 'Test User A' })
      .eq('id', A.id)
    expect(error).toBeNull()
  })

  it('user A cannot update user B profile', async () => {
    const { data } = await A.client
      .from('profiles')
      .update({ display_name: 'Pwned' })
      .eq('id', B.id)
      .select()
    expect(data).toEqual([])
  })
})

// ============================================================================
// accounts — soft-delete, full CRUD policies
// ============================================================================

describe.skipIf(!HAS_CREDS)('RLS: accounts', () => {
  it('user A can read own accounts', async () => {
    const { data, error } = await A.client.from('accounts').select('id')
    expect(error).toBeNull()
    expect(data?.some((r) => r.id === aAccountId)).toBe(true)
  })

  it('user B sees zero accounts (none owned by B)', async () => {
    const { data, error } = await B.client.from('accounts').select('id')
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  it('user B cannot read user A accounts by id', async () => {
    const { data, error } = await B.client
      .from('accounts')
      .select('id')
      .eq('id', aAccountId)
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  it('user A cannot insert account claiming to be user B', async () => {
    const { error } = await A.client.from('accounts').insert({
      user_id: B.id,
      nickname: 'spoof',
      rules_config: {},
      starting_balance: 10000,
      current_balance: 10000,
      highest_balance: 10000,
    })
    expect(error).not.toBeNull()
  })

  it('user B cannot update user A account', async () => {
    const { data } = await B.client
      .from('accounts')
      .update({ nickname: 'pwned' })
      .eq('id', aAccountId)
      .select()
    expect(data).toEqual([])

    // Verify original unchanged
    const { data: orig } = await svc
      .from('accounts')
      .select('nickname')
      .eq('id', aAccountId)
      .single()
    expect(orig?.nickname).toBe('rls-test-account')
  })

  it('user B cannot delete user A account', async () => {
    await B.client.from('accounts').delete().eq('id', aAccountId)
    const { data } = await svc.from('accounts').select('id').eq('id', aAccountId)
    expect(data).toHaveLength(1)
  })

  it('soft-deleted account is invisible to owner', async () => {
    // Create a fresh account to soft-delete
    const { data: tmp } = await A.client
      .from('accounts')
      .insert({
        user_id: A.id,
        nickname: 'to-soft-delete',
        rules_config: {},
        starting_balance: 5000,
        current_balance: 5000,
        highest_balance: 5000,
      })
      .select('id')
      .single()
    if (!tmp) throw new Error('tmp account insert failed')
    const tmpId = tmp.id

    // Soft-delete via service client (bypasses RLS for reliability)
    await svc
      .from('accounts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', tmpId)

    const { data } = await A.client
      .from('accounts')
      .select('id')
      .eq('id', tmpId)
    expect(data).toHaveLength(0)
  })
})

// ============================================================================
// trades — soft-delete, full CRUD policies
// ============================================================================

describe.skipIf(!HAS_CREDS)('RLS: trades', () => {
  it('user A can read own trades', async () => {
    const { data, error } = await A.client.from('trades').select('id').eq('id', aTradeId)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  it('user B cannot read user A trades', async () => {
    const { data, error } = await B.client.from('trades').select('id').eq('id', aTradeId)
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  it('user A cannot insert trade claiming to be user B', async () => {
    const { error } = await A.client.from('trades').insert({
      user_id: B.id,
      account_id: aAccountId,
      symbol: 'NQ',
      direction: 'long',
      contracts: 1,
      entry_price: 22000,
      entry_at: new Date().toISOString(),
    })
    expect(error).not.toBeNull()
  })

  it('user B cannot update user A trade', async () => {
    const { data } = await B.client
      .from('trades')
      .update({ notes: 'pwned' })
      .eq('id', aTradeId)
      .select()
    expect(data).toEqual([])

    const { data: orig } = await svc
      .from('trades')
      .select('notes')
      .eq('id', aTradeId)
      .single()
    expect(orig?.notes).not.toBe('pwned')
  })

  it('user B cannot delete user A trade', async () => {
    await B.client.from('trades').delete().eq('id', aTradeId)
    const { data } = await svc.from('trades').select('id').eq('id', aTradeId)
    expect(data).toHaveLength(1)
  })

  it('soft-deleted trade is invisible to owner', async () => {
    await svc
      .from('trades')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', aTradeId)

    const { data } = await A.client.from('trades').select('id').eq('id', aTradeId)
    expect(data).toHaveLength(0)

    // Restore for other tests
    await svc.from('trades').update({ deleted_at: null }).eq('id', aTradeId)
  })
})

// ============================================================================
// trade_screenshots — for-all policy (user_id check)
// ============================================================================

describe.skipIf(!HAS_CREDS)('RLS: trade_screenshots', () => {
  let screenshotId: string

  beforeAll(async () => {
    const { data } = await A.client
      .from('trade_screenshots')
      .insert({
        trade_id: aTradeId,
        user_id: A.id,
        storage_path: 'rls-test/screenshot.png',
      })
      .select('id')
      .single()
    if (!data) throw new Error('screenshot insert failed')
    screenshotId = data.id
  })

  it('user A can read own screenshot', async () => {
    const { data, error } = await A.client
      .from('trade_screenshots')
      .select('id')
      .eq('id', screenshotId)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  it('user B cannot read user A screenshot', async () => {
    const { data } = await B.client
      .from('trade_screenshots')
      .select('id')
      .eq('id', screenshotId)
    expect(data).toHaveLength(0)
  })

  it('user B cannot update user A screenshot', async () => {
    const { data } = await B.client
      .from('trade_screenshots')
      .update({ caption: 'pwned' })
      .eq('id', screenshotId)
      .select()
    expect(data).toEqual([])
  })

  it('user B cannot delete user A screenshot', async () => {
    await B.client.from('trade_screenshots').delete().eq('id', screenshotId)
    const { data } = await svc
      .from('trade_screenshots')
      .select('id')
      .eq('id', screenshotId)
    expect(data).toHaveLength(1)
  })
})

// ============================================================================
// checklists — for-all policy
// ============================================================================

describe.skipIf(!HAS_CREDS)('RLS: checklists', () => {
  it('user A can read own checklist', async () => {
    const { data, error } = await A.client
      .from('checklists')
      .select('id')
      .eq('id', aChecklistId)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  it('user B cannot read user A checklist', async () => {
    const { data } = await B.client
      .from('checklists')
      .select('id')
      .eq('id', aChecklistId)
    expect(data).toHaveLength(0)
  })

  it('user A cannot insert checklist claiming to be user B', async () => {
    const { error } = await A.client.from('checklists').insert({
      user_id: B.id,
      name: 'spoof',
    })
    expect(error).not.toBeNull()
  })

  it('user B cannot update user A checklist', async () => {
    const { data } = await B.client
      .from('checklists')
      .update({ name: 'pwned' })
      .eq('id', aChecklistId)
      .select()
    expect(data).toEqual([])
  })

  it('user B cannot delete user A checklist', async () => {
    await B.client.from('checklists').delete().eq('id', aChecklistId)
    const { data } = await svc.from('checklists').select('id').eq('id', aChecklistId)
    expect(data).toHaveLength(1)
  })
})

// ============================================================================
// checklist_items — for-all policy
// ============================================================================

describe.skipIf(!HAS_CREDS)('RLS: checklist_items', () => {
  let itemId: string

  beforeAll(async () => {
    const { data } = await A.client
      .from('checklist_items')
      .insert({
        checklist_id: aChecklistId,
        user_id: A.id,
        prompt: 'Is the spread acceptable?',
      })
      .select('id')
      .single()
    if (!data) throw new Error('checklist item insert failed')
    itemId = data.id
  })

  it('user A can read own checklist item', async () => {
    const { data, error } = await A.client
      .from('checklist_items')
      .select('id')
      .eq('id', itemId)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  it('user B cannot read user A checklist item', async () => {
    const { data } = await B.client
      .from('checklist_items')
      .select('id')
      .eq('id', itemId)
    expect(data).toHaveLength(0)
  })

  it('user B cannot update user A checklist item', async () => {
    const { data } = await B.client
      .from('checklist_items')
      .update({ prompt: 'pwned' })
      .eq('id', itemId)
      .select()
    expect(data).toEqual([])
  })

  it('user B cannot delete user A checklist item', async () => {
    await B.client.from('checklist_items').delete().eq('id', itemId)
    const { data } = await svc.from('checklist_items').select('id').eq('id', itemId)
    expect(data).toHaveLength(1)
  })
})

// ============================================================================
// checklist_runs — for-all policy
// ============================================================================

describe.skipIf(!HAS_CREDS)('RLS: checklist_runs', () => {
  let runId: string

  beforeAll(async () => {
    const { data } = await A.client
      .from('checklist_runs')
      .insert({
        user_id: A.id,
        checklist_id: aChecklistId,
        trading_date: new Date().toISOString().slice(0, 10),
        responses: {},
      })
      .select('id')
      .single()
    if (!data) throw new Error('checklist run insert failed')
    runId = data.id
  })

  it('user A can read own checklist run', async () => {
    const { data, error } = await A.client
      .from('checklist_runs')
      .select('id')
      .eq('id', runId)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  it('user B cannot read user A checklist run', async () => {
    const { data } = await B.client.from('checklist_runs').select('id').eq('id', runId)
    expect(data).toHaveLength(0)
  })

  it('user B cannot update user A checklist run', async () => {
    const { data } = await B.client
      .from('checklist_runs')
      .update({ is_complete: true })
      .eq('id', runId)
      .select()
    expect(data).toEqual([])
  })

  it('user B cannot delete user A checklist run', async () => {
    await B.client.from('checklist_runs').delete().eq('id', runId)
    const { data } = await svc.from('checklist_runs').select('id').eq('id', runId)
    expect(data).toHaveLength(1)
  })
})

// ============================================================================
// chart_layouts — for-all policy
// ============================================================================

describe.skipIf(!HAS_CREDS)('RLS: chart_layouts', () => {
  let layoutId: string

  beforeAll(async () => {
    const { data } = await A.client
      .from('chart_layouts')
      .insert({
        user_id: A.id,
        name: 'rls-test-layout',
        symbol: 'NQ',
        resolution: '15',
        content: { version: 1 },
      })
      .select('id')
      .single()
    if (!data) throw new Error('chart layout insert failed')
    layoutId = data.id
  })

  it('user A can read own chart layout', async () => {
    const { data, error } = await A.client
      .from('chart_layouts')
      .select('id')
      .eq('id', layoutId)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  it('user B cannot read user A chart layout', async () => {
    const { data } = await B.client
      .from('chart_layouts')
      .select('id')
      .eq('id', layoutId)
    expect(data).toHaveLength(0)
  })

  it('user A cannot insert chart layout claiming to be user B', async () => {
    const { error } = await A.client.from('chart_layouts').insert({
      user_id: B.id,
      name: 'spoof',
      symbol: 'NQ',
      resolution: '15',
      content: {},
    })
    expect(error).not.toBeNull()
  })

  it('user B cannot update user A chart layout', async () => {
    const { data } = await B.client
      .from('chart_layouts')
      .update({ name: 'pwned' })
      .eq('id', layoutId)
      .select()
    expect(data).toEqual([])
  })

  it('user B cannot delete user A chart layout', async () => {
    await B.client.from('chart_layouts').delete().eq('id', layoutId)
    const { data } = await svc.from('chart_layouts').select('id').eq('id', layoutId)
    expect(data).toHaveLength(1)
  })
})

// ============================================================================
// user_preferences — for-all policy; keyed on user_id (= PK)
// ============================================================================

describe.skipIf(!HAS_CREDS)('RLS: user_preferences', () => {
  it('user A can read own preferences', async () => {
    const { data, error } = await A.client
      .from('user_preferences')
      .select('user_id')
      .eq('user_id', A.id)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  it('user B cannot read user A preferences', async () => {
    const { data } = await B.client
      .from('user_preferences')
      .select('user_id')
      .eq('user_id', A.id)
    expect(data).toHaveLength(0)
  })

  it('user A can update own preferences', async () => {
    const { error } = await A.client
      .from('user_preferences')
      .update({ default_symbol: 'MNQ' })
      .eq('user_id', A.id)
    expect(error).toBeNull()
  })

  it('user B cannot update user A preferences', async () => {
    const { data } = await B.client
      .from('user_preferences')
      .update({ default_symbol: 'PWNED' })
      .eq('user_id', A.id)
      .select()
    expect(data).toEqual([])

    const { data: orig } = await svc
      .from('user_preferences')
      .select('default_symbol')
      .eq('user_id', A.id)
      .single()
    expect(orig?.default_symbol).not.toBe('PWNED')
  })
})

// ============================================================================
// Triggers
// ============================================================================

describe.skipIf(!HAS_CREDS)('Trigger: tg_create_profile', () => {
  it('auth user creation creates a profiles row', async () => {
    const { data, error } = await svc
      .from('profiles')
      .select('id')
      .eq('id', A.id)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })

  it('auth user creation creates a user_preferences row', async () => {
    const { data, error } = await svc
      .from('user_preferences')
      .select('user_id')
      .eq('user_id', A.id)
    expect(error).toBeNull()
    expect(data).toHaveLength(1)
  })
})

describe.skipIf(!HAS_CREDS)('Trigger: tg_update_highest_balance', () => {
  let triggerAccountId: string

  beforeAll(async () => {
    const { data } = await svc
      .from('accounts')
      .insert({
        user_id: A.id,
        nickname: 'trigger-test-account',
        rules_config: {},
        starting_balance: 10000,
        current_balance: 10000,
        highest_balance: 10000,
      })
      .select('id')
      .single()
    if (!data) throw new Error('trigger account insert failed')
    triggerAccountId = data.id
  })

  afterAll(async () => {
    if (triggerAccountId)
      await svc.from('accounts').delete().eq('id', triggerAccountId)
  })

  it('updating current_balance above highest_balance raises highest_balance', async () => {
    await svc
      .from('accounts')
      .update({ current_balance: 15000 })
      .eq('id', triggerAccountId)

    const { data } = await svc
      .from('accounts')
      .select('highest_balance')
      .eq('id', triggerAccountId)
      .single()
    expect(data?.highest_balance).toBe(15000)
  })

  it('updating current_balance below highest_balance does NOT lower highest_balance', async () => {
    await svc
      .from('accounts')
      .update({ current_balance: 8000 })
      .eq('id', triggerAccountId)

    const { data } = await svc
      .from('accounts')
      .select('highest_balance')
      .eq('id', triggerAccountId)
      .single()
    expect(data?.highest_balance).toBe(15000)
  })
})
