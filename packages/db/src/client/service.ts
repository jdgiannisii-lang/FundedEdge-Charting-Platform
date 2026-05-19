import { createClient } from '@supabase/supabase-js'
import type { Database } from '../generated/types'

export function createServiceClient() {
  if (typeof window !== 'undefined') {
    throw new Error(
      'createServiceClient() must not be called in a browser context. ' +
        'The service_role key bypasses RLS and must never be exposed to clients.',
    )
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars',
    )
  }
  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
