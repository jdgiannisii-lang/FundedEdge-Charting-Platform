'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { createBrowserClient } from '@supabase/ssr'
import { useEffect } from 'react'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    if (!key) return

    // Pageview capture disabled — PostHogPageView handles it manually via
    // usePathname/useSearchParams so Suspense/streaming don't produce stale $current_url.
    posthog.init(key, {
      api_host: '/ingest',
      capture_pageview: false,
      capture_pageleave: true,
      persistence: 'localStorage',
    })

    // Use @supabase/ssr directly to avoid pulling @fundededge/db barrel (which
    // re-exports createServerClient → next/headers) into the client bundle.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anonKey) return

    const supabase = createBrowserClient(url, anonKey)

    // Subscribe to auth state changes so identity stays correct across sign-in/out
    // on the same device. A one-time getUser() at mount mis-attributes events when
    // users switch accounts without a full page reload.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        posthog.identify(session.user.id, { email: session.user.email })
      } else if (event === 'SIGNED_OUT') {
        posthog.reset()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
