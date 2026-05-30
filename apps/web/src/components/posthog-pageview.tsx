'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'
import { useEffect } from 'react'

/** Fires a PostHog $pageview on every App Router navigation. Must be inside Suspense. */
export function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  useEffect(() => {
    if (!posthog) return
    const search = searchParams.toString()
    posthog.capture('$pageview', {
      $current_url: search ? `${pathname}?${search}` : pathname,
    })
  }, [pathname, searchParams, posthog])

  return null
}
