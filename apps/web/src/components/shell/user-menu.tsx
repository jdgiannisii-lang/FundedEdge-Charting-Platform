'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import {
  Avatar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@fundededge/ui'
import ThemeToggle from './theme-toggle'
import DensityToggle from './density-toggle'

interface UserMenuProps {
  // Passed from the server layout (RSC → client component) so this file
  // never imports the server action directly — keeps next/headers out of
  // the client bundle and makes the component storyable in isolation.
  signOutAction: () => void
}

export default function UserMenu({ signOutAction }: UserMenuProps) {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    // Use @supabase/ssr directly to avoid @fundededge/db barrel pulling
    // createServerClient → next/headers into the client bundle.
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anonKey) return
    const supabase = createBrowserClient(url, anonKey)
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null)
    })
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Open user menu"
          className="rounded-full focus-visible:outline-2 focus-visible:outline-[--color-focus-ring]"
        >
          <Avatar name={email ?? undefined} size="sm" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* Email display — non-interactive */}
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-xs text-[--color-text-tertiary]">
            {email ?? '—'}
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Theme toggle */}
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <ThemeToggle />
        </DropdownMenuItem>

        {/* Density toggle */}
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <DensityToggle />
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Settings */}
        <DropdownMenuItem onClick={() => window.location.assign('/app/settings')}>
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Logout */}
        <DropdownMenuItem
          onClick={() => signOutAction()}
          className="text-[--color-danger] focus:text-[--color-danger]"
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
