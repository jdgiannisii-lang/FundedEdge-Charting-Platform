import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Hoist mocks before any module imports so the clients never hit real SDKs.
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: vi.fn().mockReturnValue([]),
    set: vi.fn(),
  }),
}))

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn().mockReturnValue({}),
  createServerClient: vi.fn().mockReturnValue({}),
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({}),
}))

import { createBrowserClient } from '../browser'
import { createServerClient } from '../server'
import { createServiceClient } from '../service'

const BASE_ENV = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
}

function setEnv(overrides: Partial<typeof BASE_ENV> = {}) {
  Object.assign(process.env, { ...BASE_ENV, ...overrides })
}

function deleteEnvKey(key: keyof typeof BASE_ENV) {
  delete process.env[key]
}

let savedEnv: NodeJS.ProcessEnv

beforeEach(() => {
  savedEnv = { ...process.env }
  setEnv()
})

afterEach(() => {
  for (const key of Object.keys(BASE_ENV)) {
    if (key in savedEnv) {
      process.env[key] = savedEnv[key]
    } else {
      delete process.env[key]
    }
  }
  vi.unstubAllGlobals()
})

// ---------------------------------------------------------------------------
// createBrowserClient
// ---------------------------------------------------------------------------

describe('createBrowserClient', () => {
  it('instantiates without error when env vars are present', () => {
    expect(() => createBrowserClient()).not.toThrow()
  })

  it('throws when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    deleteEnvKey('NEXT_PUBLIC_SUPABASE_URL')
    expect(() => createBrowserClient()).toThrow(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
    )
  })

  it('throws when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
    deleteEnvKey('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    expect(() => createBrowserClient()).toThrow(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
    )
  })
})

// ---------------------------------------------------------------------------
// createServerClient
// ---------------------------------------------------------------------------

describe('createServerClient', () => {
  it('instantiates without error when env vars are present', async () => {
    await expect(createServerClient()).resolves.toBeDefined()
  })

  it('throws when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
    deleteEnvKey('NEXT_PUBLIC_SUPABASE_URL')
    await expect(createServerClient()).rejects.toThrow(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
    )
  })

  it('throws when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', async () => {
    deleteEnvKey('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    await expect(createServerClient()).rejects.toThrow(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
    )
  })
})

// ---------------------------------------------------------------------------
// createServiceClient
// ---------------------------------------------------------------------------

describe('createServiceClient', () => {
  it('instantiates without error when env vars are present', () => {
    expect(() => createServiceClient()).not.toThrow()
  })

  it('throws when called in a browser context (window defined)', () => {
    vi.stubGlobal('window', {})
    expect(() => createServiceClient()).toThrow(
      'must not be called in a browser context',
    )
  })

  it('throws when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    deleteEnvKey('NEXT_PUBLIC_SUPABASE_URL')
    expect(() => createServiceClient()).toThrow(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
    )
  })

  it('throws when SUPABASE_SERVICE_ROLE_KEY is missing', () => {
    deleteEnvKey('SUPABASE_SERVICE_ROLE_KEY')
    expect(() => createServiceClient()).toThrow(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY',
    )
  })
})
