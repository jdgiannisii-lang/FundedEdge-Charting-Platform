import { expect, test } from '@playwright/test'

test.describe('auth pages render', () => {
  test('login page has sign-in heading and links', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Forgot your password?' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Password' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Magic link' })).toBeVisible()
  })

  test('signup page has create account heading', async ({ page }) => {
    await page.goto('/signup')
    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
  })

  test('verify-email page has check your email heading', async ({ page }) => {
    await page.goto('/verify-email')
    await expect(page.getByRole('heading', { name: 'Check your email' })).toBeVisible()
  })

  test('forgot-password page has reset password heading', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.getByRole('heading', { name: 'Reset password' })).toBeVisible()
  })

  test('reset-password page has set new password heading', async ({ page }) => {
    await page.goto('/reset-password')
    await expect(page.getByRole('heading', { name: 'Set new password' })).toBeVisible()
  })

  test('auth pages share the FundedEdge logo link', async ({ page }) => {
    for (const path of ['/login', '/signup', '/forgot-password', '/reset-password']) {
      await page.goto(path)
      await expect(page.getByRole('link', { name: 'FundedEdge' })).toBeVisible()
    }
  })
})
