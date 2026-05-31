'use client'

import { useEffect, useState } from 'react'
import Cockpit from '@/components/shell/cockpit'
import DesktopOnlyNotice from '@/components/shell/desktop-only-notice'

function useMediaQuery(query: string): boolean {
  // Default true (assume desktop) to avoid layout shift on real desktops
  const [matches, setMatches] = useState(true)
  useEffect(() => {
    const mq = window.matchMedia(query)
    setMatches(mq.matches)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [query])
  return matches
}

export default function CockpitPage() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  return isDesktop ? <Cockpit /> : <DesktopOnlyNotice />
}
