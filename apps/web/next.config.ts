import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typedRoutes: true,
  // Sentry uses OpenTelemetry internals that must stay external to avoid bundling issues
  serverExternalPackages: ['@sentry/nextjs', 'import-in-the-middle', 'require-in-the-middle'],
}

export default nextConfig
