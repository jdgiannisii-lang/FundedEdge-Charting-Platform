import { createBrowserClient as _createBrowserClient } from '@supabase/ssr'
import type { Database } from '../generated/types'

export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars',
    )
  }
  return _createBrowserClient<Database>(url, anonKey)
}
