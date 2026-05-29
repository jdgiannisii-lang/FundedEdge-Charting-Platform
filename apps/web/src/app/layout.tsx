import type { Metadata } from 'next'
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
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  )
}
