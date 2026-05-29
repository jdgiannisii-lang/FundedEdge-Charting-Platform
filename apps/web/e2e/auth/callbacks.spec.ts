import { expect, test } from '@playwright/test'

test.describe('auth callback routes', () => {
  // Next.js adds a route announcer <div role="alert"> for a11y — use p[role="alert"] to target our error <p>
  test('/auth/callback with no code redirects to /login with error', async ({ page }) => {
    await page.goto('/auth/callback')
    await expect(page).toHaveURL(/\/login/)
    await expect(page).toHaveURL(/error=/)
    await expect(page.locator('p[role="alert"]')).toBeVisible()
  })

  test('/auth/callback with invalid code redirects to /login with error', async ({ page }) => {
    await page.goto('/auth/callback?code=invalid_code_for_testing')
    await expect(page).toHaveURL(/\/login/)
    await expect(page).toHaveURL(/error=/)
    await expect(page.locator('p[role="alert"]')).toBeVisible()
  })

  test('/api/auth/confirm with no token_hash redirects to /login with error', async ({ page }) => {
    await page.goto('/api/auth/confirm')
    await expect(page).toHaveURL(/\/login/)
    await expect(page).toHaveURL(/error=/)
    await expect(page.locator('p[role="alert"]')).toBeVisible()
  })

  test('/api/auth/confirm missing type redirects to /login with error', async ({ page }) => {
    await page.goto('/api/auth/confirm?token_hash=abc123')
    await expect(page).toHaveURL(/\/login/)
    await expect(page).toHaveURL(/error=/)
  })

  test('login page displays ?error= URL param as alert', async ({ page }) => {
    await page.goto('/login?error=This+is+a+test+error')
    await expect(page.locator('p[role="alert"]')).toContainText('This is a test error')
  })
})

test.describe('auth forms — client-side validation', () => {
  test('login form shows email error on empty submit', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.locator('p[role="alert"]').filter({ hasText: /email/i }).first()).toBeVisible()
  })

  test('login form shows password error when only email filled', async ({ page }) => {
    await page.goto('/login')
    // Both tab panels are in the DOM; target the password tab's email field by ID
    await page.locator('#signin-email').fill('user@example.com')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.locator('p[role="alert"]').filter({ hasText: /password/i })).toBeVisible()
  })

  test('signup form shows password mismatch error', async ({ page }) => {
    await page.goto('/signup')
    await page.locator('#signup-email').fill('user@example.com')
    await page.locator('#signup-password').fill('password123')
    await page.locator('#signup-confirm').fill('different123')
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page.locator('p[role="alert"]').filter({ hasText: /do not match/i })).toBeVisible()
  })

  test('magic link tab shows on login page and validates email', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('tab', { name: 'Magic link' }).click()
    await page.getByRole('button', { name: 'Send magic link' }).click()
    await expect(page.locator('p[role="alert"]').filter({ hasText: /email/i }).first()).toBeVisible()
  })

  test('forgot-password form shows email error on empty submit', async ({ page }) => {
    await page.goto('/forgot-password')
    await page.getByRole('button', { name: 'Send reset link' }).click()
    await expect(page.locator('p[role="alert"]').filter({ hasText: /email/i }).first()).toBeVisible()
  })
})
