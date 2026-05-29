'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { createBrowserClient } from '@supabase/ssr'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) return

    posthog.init(key, {
      api_host: '/ingest',
      capture_pageview: true,
      capture_pageleave: true,
      persistence: 'localStorage',
    })

    // Use @supabase/ssr directly to avoid pulling @fundededge/db barrel (which
    // re-exports createServerClient → next/headers) into the client bundle.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anonKey) return

    const supabase = createBrowserClient(url, anonKey)
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) posthog.identify(user.id, { email: user.email })
    })
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
