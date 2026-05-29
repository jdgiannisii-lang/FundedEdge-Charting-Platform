'use client'

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase/browser'

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

    const supabase = createBrowserClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        posthog.identify(user.id, { email: user.email })
      }
    })
  }, [])

  return <PHProvider client={posthog}>{children}</PHProvider>
}
