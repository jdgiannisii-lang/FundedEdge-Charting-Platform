// Lighthouse CI configuration for the FundedEdge web app.
//
// TODO: the empty cockpit shell lives at /app, which is behind the auth guard
// (middleware + app/app/layout.tsx). Lighthouse cannot authenticate in CI, so we
// run against /login as a public proxy for the shell's chrome (same design tokens,
// fonts, theme provider, and base layout). Once a seeded-session flow exists, add
// an authenticated /app run here.
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000/login'],
      startServerCommand: 'pnpm --filter @fundededge/web start',
      startServerReadyPattern: 'Ready in',
      startServerReadyTimeout: 60000,
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        // Accessibility is deterministic — enforce the Task 04 target of 100.
        'categories:accessibility': ['error', { minScore: 1.0 }],
        // Performance varies run-to-run on CI hardware; warn so we surface
        // regressions without blocking merges on environmental noise.
        'categories:performance': ['warn', { minScore: 0.95 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
