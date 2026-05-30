import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PostHogPageView } from '@/components/posthog-pageview'
import { PostHogProvider } from '@/components/posthog-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'FundedEdge',
  description: 'The trading cockpit for ICT futures traders running prop firm capital.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <PostHogProvider>
          {/* Suspense required because PostHogPageView calls useSearchParams() */}
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          {children}
        </PostHogProvider>
      </body>
    </html>
  )
}
