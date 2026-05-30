import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  typedRoutes: true,
  // Prevents trailing-slash normalisation stripping PostHog ingest path suffixes
  skipTrailingSlashRedirect: true,
  // Sentry uses OpenTelemetry internals that must stay external to avoid bundling issues
  serverExternalPackages: ['@sentry/nextjs', 'import-in-the-middle', 'require-in-the-middle'],
  async rewrites() {
    return [
      // Reverse-proxy PostHog events + feature flags through the app domain so
      // ad-blockers targeting posthog.com don't drop analytics.
      { source: '/ingest/static/:path*', destination: 'https://us-assets.i.posthog.com/static/:path*' },
      { source: '/ingest/:path*', destination: 'https://us.i.posthog.com/:path*' },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  // Suppress build output unless there is something meaningful to report
  silent: true,
  disableLogger: true,
  // Source map upload requires SENTRY_AUTH_TOKEN; skipped automatically when absent
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
})
