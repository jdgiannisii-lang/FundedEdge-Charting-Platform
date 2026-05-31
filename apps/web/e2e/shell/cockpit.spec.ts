/**
 * Cockpit shell E2E tests — require a real authenticated session.
 *
 * The /app route is protected by both middleware and the app/app/layout.tsx
 * server auth guard. In CI (no Supabase env vars) every /app request redirects
 * to /login, so these tests cannot reach the cockpit and are skipped. They run
 * locally against a real Supabase instance, the same pattern as auth/flows.spec.ts.
 *
 * To run locally:
 *   1. pnpm supabase start
 *   2. FULL_AUTH_TESTS=true pnpm test:e2e --project=chromium e2e/shell/cockpit.spec.ts
 */
import { expect, test } from '@playwright/test'

const FULL_AUTH = !!process.env.FULL_AUTH_TESTS
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

async function createConfirmedUser(email: string, password: string): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  })
  if (!res.ok) throw new Error(`Failed to seed test user: ${await res.text()}`)
}

async function loginAs(page: import('@playwright/test').Page): Promise<void> {
  const email = `cockpit+${Date.now()}@example.com`
  const password = 'TestPassword1!'
  await createConfirmedUser(email, password)
  await page.goto('/login')
  await page.locator('#signin-email').fill(email)
  await page.locator('#signin-password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/app/)
}

const leftPanel = (page: import('@playwright/test').Page) => page.locator('[data-panel]').first()

test.describe('cockpit panel resize', () => {
  test.skip(!FULL_AUTH, 'set FULL_AUTH_TESTS=true with local Supabase running')

  test('left panel resize persists across reload', async ({ page }) => {
    await loginAs(page)

    const widthBefore = (await leftPanel(page).boundingBox())?.width ?? 0
    const handle = page.locator('[data-panel-resize-handle-id]').first()
    const box = await handle.boundingBox()
    if (!box) throw new Error('resize handle not found')

    // Drag the handle 120px to the right to widen the left panel
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2)
    await page.mouse.up()

    const widthAfterDrag = (await leftPanel(page).boundingBox())?.width ?? 0
    expect(widthAfterDrag).toBeGreaterThan(widthBefore)

    await page.reload()
    const widthAfterReload = (await leftPanel(page).boundingBox())?.width ?? 0
    expect(widthAfterReload).toBeGreaterThan(widthBefore)
  })
})

test.describe('cockpit panel collapse', () => {
  test.skip(!FULL_AUTH, 'set FULL_AUTH_TESTS=true with local Supabase running')

  test('left panel collapses to icon rail and expands', async ({ page }) => {
    await loginAs(page)

    await page.getByRole('button', { name: /collapse left panel/i }).click()
    const collapsedWidth = (await leftPanel(page).boundingBox())?.width ?? 999
    expect(collapsedWidth).toBeLessThan(120)

    await page.getByRole('button', { name: /expand left panel/i }).click()
    const expandedWidth = (await leftPanel(page).boundingBox())?.width ?? 0
    expect(expandedWidth).toBeGreaterThan(200)
  })
})

test.describe('cockpit theme toggle', () => {
  test.skip(!FULL_AUTH, 'set FULL_AUTH_TESTS=true with local Supabase running')

  test('theme toggle switches to light and persists across reload', async ({ page }) => {
    await loginAs(page)

    // Default theme is dark
    await expect(page.locator('html')).toHaveClass(/dark/)

    // Open user menu, cycle dark → system → light (toggle stays open via onSelect preventDefault)
    await page.getByRole('button', { name: 'Open user menu' }).click()
    await page.getByRole('button', { name: 'Switch to system theme' }).click()
    await page.getByRole('button', { name: 'Switch to light theme' }).click()
    await expect(page.locator('html')).toHaveClass(/light/)

    await page.reload()
    await expect(page.locator('html')).toHaveClass(/light/)
  })
})

test.describe('cockpit desktop-only gate', () => {
  test.skip(!FULL_AUTH, 'set FULL_AUTH_TESTS=true with local Supabase running')

  test('shows desktop-only notice on narrow viewport', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 600 })
    await loginAs(page)

    await expect(page.getByText(/built for desktop trading/i)).toBeVisible()
    // The resizable panel group should not render below the desktop breakpoint
    await expect(page.locator('[data-panel-group]')).toHaveCount(0)
  })
})
