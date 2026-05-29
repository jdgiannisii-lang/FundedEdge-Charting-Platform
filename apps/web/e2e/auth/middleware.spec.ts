import { expect, test } from '@playwright/test'

test.describe('auth middleware redirects', () => {
  test('unauthenticated GET /app redirects to /login', async ({ page }) => {
    await page.goto('/app')
    await expect(page).toHaveURL(/\/login/)
  })

  test('/login is accessible without a session', async ({ page }) => {
    await page.goto('/login')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })

  test('/signup is accessible without a session', async ({ page }) => {
    await page.goto('/signup')
    await expect(page).toHaveURL(/\/signup/)
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible()
  })

  test('nested /app path redirects to /login', async ({ page }) => {
    await page.goto('/app/settings')
    await expect(page).toHaveURL(/\/login/)
  })
})
