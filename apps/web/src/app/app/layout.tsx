import { redirect } from 'next/navigation'
import type * as React from 'react'
import { createServerClient } from '@/lib/supabase/server'
import TopBar from '@/components/shell/top-bar'

// Auth guard reads cookies at request time — never statically prerender
export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopBar />
      {children}
    </div>
  )
}
