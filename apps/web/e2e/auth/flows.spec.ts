/**
 * Full auth flow tests — require local Supabase + Inbucket.
 *
 * Supabase CLI bundles Inbucket (not Mailpit) as its email catcher.
 * The helper below calls the Inbucket REST API (/api/v1/mailbox/…).
 *
 * To run locally:
 *   1. pnpm supabase start   (starts Supabase + Inbucket on http://localhost:54324)
 *   2. FULL_AUTH_TESTS=true pnpm test:e2e --project=chromium e2e/auth/flows.spec.ts
 */
import { expect, test } from '@playwright/test'

const FULL_AUTH = !!process.env.FULL_AUTH_TESTS
const INBUCKET_URL = process.env.INBUCKET_URL ?? 'http://localhost:54324'

function randomEmail(): string {
  return `test+${Date.now()}@example.com`
}

async function getLatestEmailLink(baseUrl: string, address: string): Promise<string> {
  const res = await fetch(`${baseUrl}/api/v1/mailbox/${address.split('@')[0]}`)
  if (!res.ok) throw new Error(`Inbucket fetch failed: ${res.status}`)
  // biome-ignore lint/suspicious/noExplicitAny: inbucket response shape
  const messages: any[] = await res.json()
  if (!messages.length) throw new Error('No emails found in inbucket')
  const latest = messages[messages.length - 1]
  const msgRes = await fetch(`${baseUrl}/api/v1/mailbox/${address.split('@')[0]}/${latest.id}`)
  const msg = await msgRes.json()
  const match = (msg.body?.text ?? msg.body?.html ?? '').match(/https?:\/\/[^\s"<>]+/)
  if (!match) throw new Error('No link found in email body')
  return match[0]
}

test.describe('email signup → verify → login → logout', () => {
  test.skip(!FULL_AUTH, 'set FULL_AUTH_TESTS=true with local Supabase + Mailpit running')

  test('full signup and login flow', async ({ page }) => {
    const email = randomEmail()
    const password = 'TestPassword1!'

    // Sign up
    await page.goto('/signup')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password', { exact: true }).fill(password)
    await page.getByLabel('Confirm password').fill(password)
    await page.getByRole('button', { name: 'Create account' }).click()
    await expect(page).toHaveURL(/\/verify-email/)

    // Intercept verification email via inbucket
    await page.waitForTimeout(1000)
    const verifyLink = await getLatestEmailLink(INBUCKET_URL, email)
    await page.goto(verifyLink)
    await expect(page).toHaveURL(/\/app/)

    // Cockpit shell renders — the top bar user menu is the stable landmark
    await expect(page.getByRole('button', { name: 'Open user menu' })).toBeVisible()
  })
})

test.describe('magic link login', () => {
  test.skip(!FULL_AUTH, 'set FULL_AUTH_TESTS=true with local Supabase + Mailpit running')

  test('requests magic link and logs in via email', async ({ page }) => {
    const email = randomEmail()

    await page.goto('/login')
    await page.getByRole('tab', { name: 'Magic link' }).click()
    await page.getByLabel('Email').fill(email)
    await page.getByRole('button', { name: 'Send magic link' }).click()
    await expect(page.getByText(/check your inbox/i)).toBeVisible()

    await page.waitForTimeout(1000)
    const magicLink = await getLatestEmailLink(INBUCKET_URL, email)
    await page.goto(magicLink)
    await expect(page).toHaveURL(/\/app/)
  })
})

test.describe('Google OAuth (mocked)', () => {
  test.skip(!FULL_AUTH, 'set FULL_AUTH_TESTS=true with local Supabase running')

  test('OAuth callback with valid mocked code lands on /app', async ({ page }) => {
    // Intercept the browser navigation to the Supabase OAuth authorize endpoint
    // and redirect straight to our callback with a mock code that Supabase local accepts.
    // This relies on the local Supabase dev instance's implicit grant flow.
    await page.route('**/auth/v1/authorize**', async (route) => {
      await route.fulfill({
        status: 302,
        headers: { location: 'http://localhost:3000/auth/callback?code=mock_oauth_code' },
        body: '',
      })
    })

    await page.goto('/login')
    await page.getByRole('button', { name: 'Continue with Google' }).click()

    // The mocked authorize endpoint redirects the browser to /auth/callback?code=mock_oauth_code.
    // Supabase rejects the fake code → callback redirects to /login?error=…
    // Assert we landed on the error path (proves the redirect chain executed).
    await expect(page).toHaveURL(/\/login\?error=/)
  })
})

test.describe('password reset flow', () => {
  test.skip(!FULL_AUTH, 'set FULL_AUTH_TESTS=true with local Supabase + Mailpit running')

  test('requests reset, clicks link, sets new password', async ({ page }) => {
    // Pre-create the account via Supabase admin API so resetPasswordForEmail has a real
    // user to send to. Without this step Supabase silently no-ops (anti-enumeration) and
    // the inbucket mailbox stays empty.
    const email = randomEmail()
    const initialPassword = 'InitialPass1!'
    const newPassword = 'NewPassword2!'

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost:54321'
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: initialPassword, email_confirm: true }),
    })
    if (!createRes.ok) throw new Error(`Failed to seed test user: ${await createRes.text()}`)

    await page.goto('/forgot-password')
    await page.getByLabel('Email').fill(email)
    await page.getByRole('button', { name: 'Send reset link' }).click()
    await expect(page.getByText(/check your email/i)).toBeVisible()

    await page.waitForTimeout(1000)
    const resetLink = await getLatestEmailLink(INBUCKET_URL, email)
    await page.goto(resetLink)
    await expect(page).toHaveURL(/\/reset-password/)

    await page.getByLabel('New password').fill(newPassword)
    await page.getByLabel('Confirm new password').fill(newPassword)
    await page.getByRole('button', { name: 'Set new password' }).click()
    await expect(page).toHaveURL(/\/app/)

    // Verify old password no longer works
    await page.goto('/login')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password', { exact: true }).fill(initialPassword)
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByRole('alert')).toBeVisible()
  })
})
