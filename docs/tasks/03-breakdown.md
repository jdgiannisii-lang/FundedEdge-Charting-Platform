# Task 03 — Session Breakdown (10 Sessions)

> Task 03 (Authentication System) is split into **10 independently-runnable sessions** so each one is small enough to finish in a single chat, fail safely, and be done by the right tier of model — or by you when human action is required.
>
> **Read this whole document before starting.** Each session links to the one before and after. Don't skip ahead — each session depends on the previous one being verified.

---

## Tier Guide

| Tier | Who runs it |
|---|---|
| 🟣 **User** | You — account creation, secrets, anything needing human action |
| 🟢 **Light** | Local Ollama model — mechanical file creation, no architecture |
| 🟡 **Medium** | Claude Sonnet 4.6 — code with judgment |
| 🔴 **Heavy** | Claude Opus 4.7 — security-critical work, middleware, session edge cases |

**Rule:** When the next session is 🟢 Light, Claude Code prints the prompt for Ollama and stops. Does NOT execute it.

---

## Session Index

| #   | Title                                         | Tier      | Status         | PR  |
| --- | --------------------------------------------- | --------- | -------------- | --- |
| S0  | Supabase Auth + Resend + OAuth config         | 🟣 User   | 🟢 Done        | —   |
| S1  | Scaffold auth file skeleton                   | 🟢 Light  | 🟢 Done        | —   |
| S2  | Supabase client wrappers (web app layer)      | 🟡 Medium | 🟢 Done        | —   |
| S3  | Middleware + session refresh                  | 🔴 Heavy  | 🟢 Done        | —   |
| S4  | Server actions + Zod schemas                  | 🟡 Medium | 🟢 Done        | —   |
| S5  | Auth UI components                            | 🟡 Medium | 🔴 Not started | —   |
| S6  | Auth pages (login, signup, verify, reset)     | 🟡 Medium | 🔴 Not started | —   |
| S7  | OAuth + magic link callback route             | 🔴 Heavy  | 🔴 Not started | —   |
| S8  | Playwright E2E test suite                     | 🔴 Heavy  | 🔴 Not started | —   |
| S9  | Sentry + PostHog wiring + registry update     | 🟡 Medium | 🔴 Not started | —   |

---

## Dependency Graph

```
S0 → S1 → S2 → S3 → S4 → S5 → S6 → S7 → S8 → S9
                          └──────────┘
                          S5 and S4 can run in parallel
```

---

## S0 — Supabase Auth + Resend + OAuth config 🟣

### Why
Everything downstream needs auth providers enabled, a working SMTP sender, and env vars in place before any code can be tested.

### Steps

**1. Enable Email + Magic Link in Supabase**
1. Go to your Supabase dashboard → **Authentication → Providers**
2. Confirm **Email** provider is enabled
3. Enable **Magic Link** (toggle under the Email provider)

**2. Enable Google OAuth**
1. Still in **Authentication → Providers**, find **Google**
2. You need a Client ID and Client Secret from Google Cloud Console:
   - Go to [console.cloud.google.com](https://console.cloud.google.com)
   - **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URI: `https://<your-supabase-ref>.supabase.co/auth/v1/callback`
   - Copy the Client ID and Secret into Supabase

**3. Configure Resend as SMTP**
1. Create an account at resend.com, get an API key
2. In Supabase → **Authentication → SMTP Settings**, enable custom SMTP:
   - Host: `smtp.resend.com`
   - Port: `465`
   - Username: `resend`
   - Password: your Resend API key
   - Sender email: your verified sending address

**4. Set Custom Email Templates**
1. In Supabase → **Authentication → Email Templates**
2. Set **Confirm signup** redirect URL to `/auth/confirm` on your domain (`http://localhost:3000/auth/confirm` for dev)
3. Set **Reset password** redirect URL to `/reset-password`

**5. Add env vars**

Add to `apps/web/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=<from Supabase dashboard>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from Supabase dashboard>
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard>
RESEND_API_KEY=<from Resend>
```
Also add all four to **Vercel → Project Settings → Environment Variables**.

### Verify
- Supabase dashboard shows Email, Magic Link, and Google providers all enabled
- Resend SMTP test email sends successfully (Supabase has a "Send test email" button)
- `.env.local` has all four vars set

### Handoff to S1
> S0 complete. Auth providers configured, Resend wired, env vars set. Ready for S1.

---

## S1 — Scaffold auth file skeleton 🟢 Light

### Why
Pure mechanical file creation. Every file from the spec gets created as an empty stub so the directory structure exists and typecheck passes before any logic is written.

### Recommended model
`qwen2.5-coder:14b` (Ollama) or `deepseek-coder-v2:16b`. Any local model can follow exact file-write instructions.

### Prompt to paste

> You are working in the FundedEdge monorepo. Create the following files exactly as specified — no improvisation, no extra files, no logic. Each file gets only a placeholder comment or minimal valid export.
>
> Read `docs/tasks/03-auth-system.md` § "Files to create" for the full list. Create every file listed there under `apps/web/src/`.
>
> **Rules for each file:**
> - `.ts` files: `export {};`
> - `.tsx` files: `export default function Placeholder() { return null; }`
> - `route.ts` files: `export async function GET() { return new Response(null); }`
>
> After creating all files, run:
> ```bash
> pnpm --filter @fundededge/web typecheck
> ```
> Fix any typecheck errors caused by the stubs (add missing imports if needed). Do NOT add any real logic.
>
> Report done. Do not proceed further.

### Verify
```powershell
pnpm --filter @fundededge/web typecheck
```
Must pass with zero errors.

### Common failures
- **Model invented extra files** — delete them and re-prompt with "ONLY create the files listed in the spec"
- **Typecheck fails on stub exports** — the stub needs a valid default export for page/layout files

### Handoff to S2
> S1 complete. All stub files exist, typecheck passes. Ready for S2.

---

## S2 — Supabase client wrappers (web app layer) 🟡 Medium

### Why
The web app needs its own Supabase client layer on top of `@fundededge/db`. The browser, server, and middleware clients each use different cookie strategies — wrong implementation = sessions don't persist across page loads.

### Recommended model
**Claude Sonnet 4.6 in Claude Code.**

### Prompt to paste

> Continue Task 03 in the FundedEdge monorepo. S0 and S1 are complete.
>
> **Goal:** Implement the three Supabase client wrappers in `apps/web/src/lib/supabase/` and the safe-action wrapper.
>
> Read first:
> 1. `docs/tasks/03-auth-system.md` § "Supabase clients" and § "Server actions with safe-action"
> 2. `packages/db/src/client/` — the existing `@fundededge/db` clients (your wrappers call these or follow the same pattern at the web layer)
> 3. The official `@supabase/ssr` Next.js App Router docs if uncertain
>
> **Files to implement:**
>
> 1. `apps/web/src/lib/supabase/browser.ts` — `createBrowserClient()` using `@supabase/ssr`, typed with `Database` from `@fundededge/db`
> 2. `apps/web/src/lib/supabase/server.ts` — `createServerClient()` using `@supabase/ssr` + `next/headers` cookies. RSC/route-handler only — add a comment at the top stating that.
> 3. `apps/web/src/lib/supabase/middleware.ts` — `updateSession(req)` helper that refreshes the session cookie and returns `{ res, user }` where `res` is a `NextResponse`
> 4. `apps/web/src/lib/safe-action.ts` — `action` and `authedAction` wrappers using `next-safe-action` exactly as shown in the spec
>
> **Verify before reporting done:**
> ```bash
> pnpm --filter @fundededge/web typecheck
> ```
> Must pass.

### Verify
```powershell
pnpm --filter @fundededge/web typecheck
```
Zero errors.

### Common failures
- **`Cannot find module 'next/headers'`** — only importable in server context; ensure it's not accidentally imported in browser-side code
- **`updateSession` returns wrong shape** — S3 (middleware) destructures `{ res, user }` — match that exactly

### Handoff to S3
> S2 complete. Supabase clients and safe-action wrappers implemented and typechecking. Ready for S3.

---

## S3 — Middleware + session refresh 🔴 Heavy

### Why
The middleware is the security gatekeeper for every request. A wrong redirect condition or broken matcher = authenticated users locked out, or unauthenticated users reaching `/app`. Session refresh logic must handle expired tokens in-flight without redirect loops. **Heavy tier mandatory.**

### Recommended model
**Claude Opus 4.7.**

### Prompt to paste

> Continue Task 03 in the FundedEdge monorepo. S0–S2 are complete.
>
> **Goal:** Implement `apps/web/src/middleware.ts` — the route protection middleware.
>
> Read first:
> 1. `docs/tasks/03-auth-system.md` § "Middleware" — has the exact logic spec and code template
> 2. `apps/web/src/lib/supabase/middleware.ts` — your `updateSession` helper from S2
>
> **Requirements:**
> - Call `updateSession(req)` to refresh the session cookie on every request
> - Redirect unauthenticated users from `/app/*` to `/login`
> - Redirect authenticated users from `/login` and `/signup` to `/app`
> - Use the `matcher` config from the spec exactly (excludes `_next/static`, `_next/image`, `favicon.ico`, `.*\\..*`)
> - Handle edge cases: expired tokens refreshed in-flight, no redirect loops (an unauthenticated user hitting `/login` must NOT redirect)
>
> **Verify before reporting done:**
> 1. `pnpm --filter @fundededge/web typecheck` passes
> 2. Start the dev server (`pnpm --filter @fundededge/web dev`) and manually verify:
>    - Visiting `http://localhost:3000/app` without a session redirects to `/login`
>    - Visiting `http://localhost:3000/login` with a session redirects to `/app`
> 3. Report the results of both manual checks

### Verify
Manual checks above pass, typecheck green.

### Common failures
- **Redirect loop** — check that the matcher excludes static assets and that auth pages are not themselves protected
- **`updateSession` not called** — without it, session cookies are never refreshed and users get logged out after token expiry

### Handoff to S4
> S3 complete. Middleware verified manually. Ready for S4.

---

## S4 — Server actions + Zod schemas 🟡 Medium

### Why
All auth mutations (signup, login, logout, password reset) are server actions validated with Zod. This is the trust boundary — client input must be parsed before it touches Supabase.

### Recommended model
**Claude Sonnet 4.6 in Claude Code.**

### Prompt to paste

> Continue Task 03 in the FundedEdge monorepo. S0–S3 complete.
>
> **Goal:** Implement the auth server actions and Zod schemas.
>
> Read first:
> 1. `docs/tasks/03-auth-system.md` § "Server actions with safe-action"
> 2. `apps/web/src/lib/safe-action.ts` — your wrappers from S2
>
> **Files to implement:**
>
> 1. `apps/web/src/lib/auth/schemas.ts` — Zod schemas for: email+password signup, email+password login, magic link request, forgot password, reset password (with password confirmation match)
>
> 2. `apps/web/src/lib/auth/actions.ts` — server actions using `action`/`authedAction` from safe-action:
>    - `signUpAction` — creates user, Supabase sends verification email
>    - `signInAction` — email+password login
>    - `signInWithMagicLinkAction` — sends magic link email
>    - `signInWithGoogleAction` — initiates OAuth redirect
>    - `signOutAction` — signs out, redirects to `/login`
>    - `forgotPasswordAction` — sends password reset email
>    - `resetPasswordAction` — sets new password (called after token exchange in callback)
>
> 3. `apps/web/src/lib/auth/helpers.ts` — shared utilities: error message normalisation (map Supabase error codes to user-friendly strings), redirect helpers
>
> **Verify before reporting done:**
> ```bash
> pnpm --filter @fundededge/web typecheck
> ```
> Also run Vitest unit tests for schemas (valid + invalid inputs):
> ```bash
> pnpm --filter @fundededge/web test:unit
> ```

### Verify
Typecheck and unit tests green.

### Handoff to S5
> S4 complete. Server actions and schemas implemented. Ready for S5 (can also start S5 in parallel with S4 if time allows).

---

## S5 — Auth UI components 🟡 Medium

### Why
The form components are the user-facing layer. They wire React Hook Form + Zod to the server actions and handle loading/error states. Needs judgment for accessibility and UX — not a local model task.

### Recommended model
**Claude Sonnet 4.6 in Claude Code.**

### Prompt to paste

> Continue Task 03 in the FundedEdge monorepo. S0–S4 complete (or S4 running in parallel).
>
> **Goal:** Implement the auth UI components in `apps/web/src/components/auth/`.
>
> Read first:
> 1. `docs/tasks/03-auth-system.md` § "Files to create" for the component list
> 2. `packages/ui/` — use shadcn/ui primitives (Button, Input, Form, Card, Label) from the shared package
> 3. `apps/web/src/lib/auth/actions.ts` and `schemas.ts` — what you're wiring up
>
> **Components to implement:**
>
> 1. `login-form.tsx` — React Hook Form + Zod, tabs or toggle between password login and magic link. Calls `signInAction` and `signInWithMagicLinkAction`. Shows inline field errors. Shows loading state on submit.
> 2. `signup-form.tsx` — email + password + confirm password. Calls `signUpAction`. On success shows "Check your email" state instead of redirecting.
> 3. `magic-link-form.tsx` — email only. Calls `signInWithMagicLinkAction`. Shows success state.
> 4. `google-button.tsx` — single button, calls `signInWithGoogleAction`, handles the redirect.
> 5. `password-reset-form.tsx` — two modes: (a) request mode (email input, calls `forgotPasswordAction`), (b) set-new-password mode (new password + confirm, calls `resetPasswordAction`). Mode determined by a prop.
>
> **Requirements:**
> - All forms must have proper labels, aria attributes, and keyboard navigation
> - Error messages must be the normalised strings from `helpers.ts`
> - Each component gets a Storybook story (`*.stories.tsx`) in the same directory
>
> **Verify before reporting done:**
> ```bash
> pnpm --filter @fundededge/web typecheck
> pnpm --filter @fundededge/web storybook:build
> ```

### Verify
Typecheck and Storybook build both green.

### Handoff to S6
> S5 complete. All auth UI components implemented with Storybook stories. Ready for S6.

---

## S6 — Auth pages (login, signup, verify, reset) 🟡 Medium

### Why
Pages are thin wrappers that compose the layout and components. Medium tier because the auth group layout and page metadata need judgment.

### Recommended model
**Claude Sonnet 4.6 in Claude Code.**

### Prompt to paste

> Continue Task 03 in the FundedEdge monorepo. S0–S5 complete.
>
> **Goal:** Implement the auth route group pages in `apps/web/src/app/(auth)/`.
>
> **Files to implement:**
>
> 1. `(auth)/layout.tsx` — centered card layout, logo at top, no main navbar, consistent padding. Wraps all auth pages.
> 2. `(auth)/login/page.tsx` — renders `<LoginForm>`. Title: "Sign in to FundedEdge".
> 3. `(auth)/signup/page.tsx` — renders `<SignupForm>`. Title: "Create your account".
> 4. `(auth)/verify-email/page.tsx` — static page: "Check your inbox — we sent you a verification link." No form.
> 5. `(auth)/forgot-password/page.tsx` — renders `<PasswordResetForm>` in request mode.
> 6. `(auth)/reset-password/page.tsx` — renders `<PasswordResetForm>` in set-new-password mode.
>
> **Requirements:**
> - Each page exports proper Next.js `metadata`
> - Pages are RSCs (no `"use client"` on the page file itself)
> - Layout uses Tailwind + shadcn/ui Card or equivalent
>
> **Verify:**
> ```bash
> pnpm --filter @fundededge/web dev
> ```
> Visit each route in the browser and confirm the page renders without errors.

### Verify
All six routes render in the browser, no console errors.

### Handoff to S7
> S6 complete. All auth pages render. Ready for S7.

---

## S7 — OAuth + magic link callback route 🔴 Heavy

### Why
The callback route exchanges an auth `code` for a session and handles every failure mode. A bug here = users stuck after clicking the email link or completing Google OAuth. **Heavy tier mandatory.**

### Recommended model
**Claude Opus 4.7.**

### Prompt to paste

> Continue Task 03 in the FundedEdge monorepo. S0–S6 complete.
>
> **Goal:** Implement the two callback/confirm route handlers.
>
> Read first:
> 1. `docs/tasks/03-auth-system.md` § "Email templates" — explains what URLs Supabase calls
> 2. Supabase docs on PKCE flow and the `exchangeCodeForSession` method
>
> **Files to implement:**
>
> 1. `apps/web/src/app/(auth)/auth/callback/route.ts` — handles:
>    - OAuth redirect from Google (exchanges `code` query param for session)
>    - Magic link token exchange
>    - On success: redirect to `/app` (or to a `next` query param if present)
>    - On failure: redirect to `/login?error=<normalised-message>`
>    - Must handle: missing `code`, expired code, already-used code
>
> 2. `apps/web/src/app/api/auth/confirm/route.ts` — handles Supabase email confirmation:
>    - Reads `token_hash` and `type` from query params
>    - Calls `supabase.auth.verifyOtp({ token_hash, type })`
>    - On success: redirect to `/app` or `/reset-password` depending on `type`
>    - On failure: redirect to `/login?error=...`
>
> **Verify before reporting done:**
> 1. Typecheck passes
> 2. Manually trigger a magic link from the `/login` page and click the link in the email — confirm you land on `/app`
> 3. Report the result of that manual test

### Verify
Manual magic link flow works end-to-end.

### Common failures
- **`code` param missing** — Supabase sends it as a query param; ensure it's read from `request.nextUrl.searchParams`
- **Redirect loop after callback** — ensure the session cookie is set before redirecting; `exchangeCodeForSession` must complete first

### Handoff to S8
> S7 complete. Callback routes working. Magic link verified manually. Ready for S8.

---

## S8 — Playwright E2E test suite 🔴 Heavy

### Why
This is the proof that the entire auth system works end-to-end. Without these tests, every deploy is a manual gamble. **Heavy tier mandatory.**

### Recommended model
**Claude Opus 4.7.**

### Prompt to paste

> Continue Task 03 in the FundedEdge monorepo. S0–S7 complete. The full auth system is implemented.
>
> **Goal:** Write the Playwright E2E test suite for auth in `apps/web/e2e/auth/`.
>
> Read first:
> 1. `docs/tasks/03-auth-system.md` § "Testing requirements"
> 2. Any existing Playwright config in `apps/web/` (playwright.config.ts or similar)
>
> **Flows to test:**
>
> 1. **Email signup → verify → login → logout** — create a real account via the UI, intercept the verification email (use Mailpit or Supabase's local inbucket at `http://localhost:54324`), click the link, confirm landing on `/app`, then log out
> 2. **Magic link login** — request a magic link, intercept email, click link, confirm session
> 3. **Google OAuth** — mock the OAuth exchange via Playwright `page.route()` intercept; confirm redirect to `/app` after mocked callback
> 4. **Password reset** — request reset, intercept email, click link, set new password, confirm login with new password works
> 5. **Middleware redirects** — unauthed GET to `/app` redirects to `/login`; authed GET to `/login` redirects to `/app`
>
> **Also add Vitest unit tests** in `apps/web/src/lib/auth/__tests__/schemas.test.ts`:
> - Each Zod schema: valid inputs pass, invalid inputs produce expected error messages
>
> **Verify before reporting done:**
> ```bash
> pnpm --filter @fundededge/web test:e2e
> pnpm --filter @fundededge/web test:unit
> ```
> Both must pass. Report total test counts.

### Verify
All E2E and unit tests green. Report the counts.

### Handoff to S9
> S8 complete. E2E and unit tests passing. Ready for S9.

---

## S9 — Sentry + PostHog wiring + registry update 🟡 Medium

### Why
Observability and analytics are acceptance criteria, not nice-to-haves. This session closes out the task.

### Recommended model
**Claude Sonnet 4.6 in Claude Code.**

### Prompt to paste

> Continue Task 03 in the FundedEdge monorepo. S0–S8 complete. Final session.
>
> **Goal 1 — Sentry:**
> - Install `@sentry/nextjs` if not already present
> - Add `Sentry.captureException(e)` in the `handleServerError` callback in `apps/web/src/lib/safe-action.ts`
> - Add error capture in the callback routes (S7) for any caught exceptions
> - Verify by forcing an auth error (e.g. wrong password) and confirming Sentry receives the event
>
> **Goal 2 — PostHog:**
> - Install `posthog-js` if not already present
> - After a successful `signInAction` or OAuth callback, call `posthog.identify(userId, { email })`
> - Add `NEXT_PUBLIC_POSTHOG_KEY` and `SENTRY_DSN` to `apps/web/.env.example`
>
> **Goal 3 — Registry update:**
> - Update `CLAUDE.md` component registry: Task 03 → 🟢 Done
>
> **Verify:**
> 1. Force an auth error — confirm it appears in Sentry
> 2. Log in — confirm a `$identify` event appears in PostHog Live Events
> 3. Typecheck passes

### Verify
Sentry event received, PostHog identify event fires, typecheck green, registry updated.

### Task 03 complete ✅

---

## Quality Gates

Don't move from session N to N+1 until:
1. The verify step for N passes
2. Output is committed to git on a branch
3. The session status table above is updated to 🟢

## Failure Recovery

If a session goes sideways:
1. Don't merge anything. Close the PR, delete the branch.
2. `git stash` any WIP.
3. Restart the session with the same prompt — be explicit about what went wrong.
4. If two attempts fail, escalate the tier.

---

## Related

- `docs/tasks/03-auth-system.md` — spec and acceptance criteria
- `docs/tasks/02-supabase-schema.md` — dependency (profiles table + Supabase project)
- `docs/architecture/` — auth architecture, middleware, RLS boundary
