# Task 03 — Session Breakdown

> Task 03 (Auth System) covers signup, login, magic link, Google OAuth, session management, middleware, protected routes, email verification, password reset, and observability wiring. This document splits it into **10 independently-runnable sessions** so each one finishes in a single chat, fails safely, and runs at the right tier.
>
> **Read this whole document before starting.** Each session links to the one before and after. Don't skip ahead — S3 (middleware) depends on S2's client wrappers actually working.

---

## 0. Glossary of tiers

| Tier | Who runs it | Use for |
|------|-------------|---------|
| 🟣 **User** | You, in a browser / terminal | Account creation, secret handling, OAuth app registration — anything that can't be code-reviewed |
| 🟢 **Light** | Local model (Ollama: `qwen2.5-coder:14b`, `deepseek-coder-v2`, or cloud `nemotron-3-super`) via OpenCode | Mechanical scaffolding, empty file creation from exact templates. No architecture, no security code. |
| 🟡 **Medium** | Claude Sonnet 4.6 in Claude Code | Code with judgment but not novel security design: UI components, server actions, page assembly, docs. |
| 🔴 **Heavy** | Claude Sonnet 4.6 (default) or Opus 4.7 (when explicitly hard) in Claude Code | Middleware, OAuth/magic-link callback routes, E2E test suite. Anywhere a bug silently leaks sessions or bypasses auth. |

**Rule of thumb:** if getting it wrong lets an unauthenticated user reach `/app`, or lets a session token be stolen or replayed, it's 🔴 Heavy.

**Claude Code rule:** When the next session to run is 🟢 Light, do NOT execute it. Instead, print the session's "Prompt to paste" block verbatim and tell the user to run it in their local Ollama model. Then stop. Only pick up again when the user confirms the Light session is done.

---

## 1. Dependency graph

```
S0 (you) ──► S1 (light) ──► S2 (medium) ──► S3 (heavy) ──► S4 (medium) ──► S6 (medium)
                                                                 │                │
                                                                 │           S5 (medium) ──► S7 (heavy) ──► S8 (heavy) ──► S9 (medium)
                                                                 │                │
                                                                 └────────────────┘
                                                          S4 and S5 can run in parallel
```

Each session marks **🟢 Done** in the status table at the bottom of this file when it's complete. Don't start a session whose dependency isn't 🟢.

---

## 2. Session index

| #  | Title                                         | Tier      | Est. time | Depends on   |
|----|-----------------------------------------------|-----------|-----------|--------------|
| S0 | Supabase Auth + Resend + OAuth config         | 🟣 You    | 30 min    | —            |
| S1 | Scaffold auth file skeleton                   | 🟢 Light  | 15 min    | S0           |
| S2 | Supabase client wrappers (web app layer)      | 🟡 Medium | 35 min    | S1           |
| S3 | Middleware + session refresh                  | 🔴 Heavy  | 50 min    | S2           |
| S4 | Server actions + Zod schemas                  | 🟡 Medium | 45 min    | S2           |
| S5 | Auth UI components + Storybook                | 🟡 Medium | 60 min    | S4           |
| S6 | Auth pages                                    | 🟡 Medium | 30 min    | S5           |
| S7 | OAuth + magic link callback routes            | 🔴 Heavy  | 45 min    | S4           |
| S8 | Playwright E2E + Vitest unit tests            | 🔴 Heavy  | 90 min    | S3, S6, S7   |
| S9 | Sentry + PostHog wiring + registry update     | 🟡 Medium | 25 min    | S8           |

Total: ~7 hours of effort.

---

## 3. Conventions used in this doc

- **`> Prompt to paste:`** — copy the indented block verbatim into the session's chat. Don't paraphrase.
- **`> User runs:`** — a command **you** run in your terminal between sessions.
- **`> Verify:`** — exact check that should pass before marking the session done.
- **`> Common failures:`** — known gotchas with recovery.
- File paths are repo-relative.

---

## S0 — Supabase Auth + Resend + OAuth config 🟣

### Why
The downstream sessions write code that calls Supabase Auth. That code needs real provider credentials configured in the Supabase dashboard before it can be tested. Nothing here can be automated — it all requires a browser and your credentials.

### Steps

**1. Enable email auth providers in Supabase dashboard**
1. Go to your Supabase project → **Authentication → Providers**
2. Confirm **Email** is enabled. Settings:
   - Enable email confirmations: **ON** (users must verify before accessing `/app`)
   - Secure email change: **ON**
3. Enable **Magic Link** (it's the passwordless email option under Email provider settings)

**2. Configure Google OAuth**
1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services → Credentials**
2. Create an **OAuth 2.0 Client ID** (Web application type)
3. Authorized redirect URIs — add both:
   - `https://<your-supabase-ref>.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (for local dev)
4. Copy the **Client ID** and **Client Secret**
5. In Supabase dashboard → **Authentication → Providers → Google**:
   - Paste Client ID and Client Secret
   - Enable the provider

**3. Configure Resend for transactional email**
1. In [Resend](https://resend.com) → **SMTP Settings** — copy your SMTP credentials
2. In Supabase dashboard → **Authentication → SMTP Settings**:
   - Enable custom SMTP
   - Host: `smtp.resend.com`, Port: `465`, User: `resend`, Password: (your Resend API key)
   - Sender email: `noreply@fundededge.com` (or your verified domain)

**4. Set custom email template redirect URLs**
In Supabase dashboard → **Authentication → Email Templates**:
- **Confirm signup** — change the `{{ .ConfirmationURL }}` link base to point at `https://fundededge.com/api/auth/confirm?token_hash={{ .TokenHash }}&type=signup`
- **Magic Link** — `https://fundededge.com/auth/callback?token_hash={{ .TokenHash }}&type=magiclink`
- **Reset Password** — `https://fundededge.com/auth/callback?token_hash={{ .TokenHash }}&type=recovery`
- For local dev: Supabase local Docker uses Mailpit (http://localhost:54324) — no SMTP config needed locally

**5. Capture env vars**
Add these to `.env.local` (local only — never commit) and to Vercel environment variables:

| Var | Where | Env |
|-----|-------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project Settings → API | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Project Settings → API | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Project Settings → API | Production + Preview only |
| `RESEND_API_KEY` | Resend dashboard | Production + Preview only |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project settings | All |
| `SENTRY_DSN` | Sentry project settings | All |

**6. Add Resend dependency to `apps/web`**
```powershell
pnpm --filter @fundededge/web add resend
```

### Verify
- In Supabase dashboard, Google OAuth provider shows "Enabled"
- SMTP settings test email sends successfully (there's a "Send test email" button)
- `.env.local` has all 6 vars set and `pnpm dev` starts without missing-env warnings

### Handoff to S1
> S0 done. Supabase Auth providers configured (email, magic link, Google OAuth). Resend SMTP set up. All env vars in `.env.local`. Move to S1 — scaffold skeleton.

---

## S1 — Scaffold auth file skeleton 🟢 Light

### Why
Pure mechanical file creation. A small local model can do this without judgment.

### Recommended model
`qwen2.5-coder:14b` (Ollama) **or** `deepseek-coder-v2:16b` **or** `nemotron-3-super:cloud` via OpenCode.

### Prompt to paste

> You are working in the FundedEdge monorepo at `apps/web/src/`. Create the following empty files exactly — no logic, each file gets only a placeholder comment. Do not create any additional files.
>
> Files to create (all paths are relative to `apps/web/src/`):
>
> ```
> middleware.ts
> lib/supabase/browser.ts
> lib/supabase/server.ts
> lib/supabase/middleware.ts
> lib/auth/actions.ts
> lib/auth/schemas.ts
> lib/auth/helpers.ts
> lib/safe-action.ts
> app/(auth)/layout.tsx
> app/(auth)/login/page.tsx
> app/(auth)/signup/page.tsx
> app/(auth)/verify-email/page.tsx
> app/(auth)/forgot-password/page.tsx
> app/(auth)/reset-password/page.tsx
> app/(auth)/auth/callback/route.ts
> app/api/auth/confirm/route.ts
> components/auth/login-form.tsx
> components/auth/signup-form.tsx
> components/auth/magic-link-form.tsx
> components/auth/google-button.tsx
> components/auth/password-reset-form.tsx
> ```
>
> For each `.ts` and `.tsx` file, the content should be exactly:
> ```ts
> // TODO: implement in upcoming session
> export {};
> ```
>
> For route handlers (`route.ts`) use:
> ```ts
> // TODO: implement in upcoming session
> export async function GET() { return new Response('Not implemented', { status: 501 }) }
> export async function POST() { return new Response('Not implemented', { status: 501 }) }
> ```
>
> Also add these packages to `apps/web/package.json` if not already present (do NOT install, just add to the JSON — pnpm install will be run separately):
> - `@supabase/ssr`: `^0.6.0`
> - `next-safe-action`: `^7.0.0`
> - `react-hook-form`: `^7.54.0`
> - `zod`: `^3.24.0`
> - `@hookform/resolvers`: `^3.9.0`
>
> After creating all files, run from the repo root:
> ```bash
> pnpm install
> pnpm --filter @fundededge/web typecheck
> ```
>
> Report done. Do not add any logic to these files.

### Verify (you, after the model finishes)
```powershell
ls apps/web/src/lib/supabase/
ls apps/web/src/lib/auth/
ls apps/web/src/components/auth/
pnpm --filter @fundededge/web typecheck
```
Typecheck must pass.

### Common failures
- **Model invented extra files** — delete them and re-prompt with "ONLY create the exact files listed"
- **`@supabase/ssr` version conflict** — check that `packages/db` and `apps/web` both reference the same minor version

### Handoff to S2
> S1 done. All skeleton files exist. Typecheck passes. Move to S2 — Supabase client wrappers.

---

## S2 — Supabase client wrappers (web app layer) 🟡 Medium

### Why
`apps/web` needs its own thin wrappers around the `@fundededge/db` clients, adapted for Next.js App Router cookie handling. Wrong cookie plumbing = sessions that vanish on page reload. Medium tier.

### Recommended model
**Claude Sonnet 4.6 in Claude Code.**

### Prompt to paste

> Continue Task 03 in the FundedEdge monorepo. S0 and S1 are complete — all skeleton files exist.
>
> **Read first:**
> 1. `docs/tasks/03-auth-system.md` § "Supabase clients" — the implementation contract
> 2. `packages/db/src/client/browser.ts` and `packages/db/src/client/server.ts` — the `@fundededge/db` clients already exist; you are building thin wrappers in `apps/web/src/lib/supabase/`
> 3. `docs/architecture/system-design.md` § Auth Architecture
>
> **Goal:** implement three files in `apps/web/src/lib/supabase/`:
>
> **1. `browser.ts`**
> - Export `createClient()` using `createBrowserClient` from `@supabase/ssr`
> - Reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
> - Returns a singleton (use module-level variable — `createBrowserClient` already handles deduplication)
> - Must be typed with the `Database` type imported from `@fundededge/db`
>
> **2. `server.ts`**
> - Export `async function createClient()` using `createServerClient` from `@supabase/ssr`
> - Reads cookies via `await cookies()` from `next/headers`
> - Handles cookie get/set/remove via the `cookies()` API (see Supabase Next.js SSR docs for the exact cookie-handler pattern)
> - Must be typed with `Database`
> - Top-of-file comment: "Server-only. Do not import from Client Components."
>
> **3. `middleware.ts`**
> - Export `async function updateSession(request: NextRequest)` returning `{ response: NextResponse, user: User | null }`
> - Uses `createServerClient` from `@supabase/ssr` with `request.cookies` for reading and a `NextResponse` for writing updated cookies
> - Calls `supabase.auth.getUser()` (NOT `getSession()` — `getUser()` validates against the server, `getSession()` trusts cookies blindly)
> - Also export `async function createClient(request: NextRequest)` for one-off middleware use
>
> **4. Update `apps/web/src/lib/safe-action.ts`**
> Per the snippet in `docs/tasks/03-auth-system.md`, implement `action` and `authedAction` using `next-safe-action`'s `createSafeActionClient`. `authedAction` calls `createClient()` from `./supabase/server`, then `getUser()`, throwing `'Unauthorized'` if no user.
>
> **Verify before reporting done:**
> ```bash
> pnpm --filter @fundededge/web typecheck
> ```
> Zero errors. If `next/headers` types are missing, ensure `apps/web/tsconfig.json` includes `"next"` in compilerOptions.types.

### Verify
```powershell
pnpm --filter @fundededge/web typecheck
```
Zero errors.

### Common failures
- **`getSession()` used instead of `getUser()`** — `getSession()` trusts the cookie and doesn't verify with Supabase's server. Security bug. Must use `getUser()`.
- **Cookie handler mutates response instead of using `NextResponse`** — the middleware pattern requires building a `NextResponse` and passing its cookie API to `createServerClient`. See official Supabase Next.js SSR guide.

### Handoff to S3
> S2 done. Supabase client wrappers typecheck. Move to S3 — middleware (security-critical).

---

## S3 — Middleware + session refresh 🔴 Heavy

### Why
This is the guard on every request. A bug here means unauthenticated users can reach `/app`, or authenticated users get redirect-looped, or sessions expire silently. **Heavy tier mandatory.**

### Recommended model
**Claude Sonnet 4.6 minimum. Consider Opus 4.7** if the session edge cases feel complex.

### Prompt to paste

> Continue Task 03 in FundedEdge. S0–S2 complete. This session implements `apps/web/src/middleware.ts`.
>
> **Read first:**
> 1. `docs/tasks/03-auth-system.md` § Middleware — the exact logic and `matcher` config
> 2. `apps/web/src/lib/supabase/middleware.ts` from S2 — use `updateSession()` from here
> 3. `docs/architecture/system-design.md` § "Data Flow: User Opens App" — the session check is step 2
>
> **Requirements:**
>
> 1. Call `updateSession(req)` first on every matched request. This refreshes the session cookie if it's close to expiring before any redirect logic runs.
> 2. Route protection logic:
>    - If `user` is null AND `pathname.startsWith('/app')` → redirect to `/login?redirectTo=<original path>`
>    - If `user` is not null AND (`pathname === '/login'` OR `pathname === '/signup'`) → redirect to `/app`
>    - All other cases: return the response from `updateSession` as-is (so the refreshed cookie header is preserved)
> 3. The `matcher` must exclude: `_next/static`, `_next/image`, `favicon.ico`, and any path that contains a `.` (static file pattern)
> 4. **No redirect loops:** double-check that the redirect rules can't chain. If `/login` redirects to `/app` and `/app` redirects to `/login`, the session is broken — `updateSession` must always fire before the redirect decision.
>
> **Edge cases to handle explicitly:**
> - Token present but expired → `updateSession` calls `getUser()` which will fail → user is null → redirect to `/login`. Do NOT try to refresh the token manually — `updateSession` handles it.
> - User visits `/app/some/deep/route` without auth → redirect to `/login?redirectTo=/app/some/deep/route`
> - User logs in and gets redirected back to the original deep route (this wiring is in S4's `signInAction`, just make sure middleware preserves the `redirectTo` param)
>
> **Verify before reporting done:**
> 1. `pnpm --filter @fundededge/web typecheck` passes
> 2. Start the dev server (`pnpm --filter @fundededge/web dev`) and manually test:
>    - Visiting `http://localhost:3000/app` → should redirect to `/login` (you should see it in browser address bar)
>    - No errors in terminal

### Verify
```powershell
pnpm --filter @fundededge/web typecheck
```
Then manual browser check as described above.

### Common failures
- **Matcher includes API routes** — if `/api/auth/confirm` is matched and the middleware redirects it, the email confirmation flow breaks. Make sure API routes under `/api/auth/` are excluded or pass through correctly.
- **`updateSession` not awaited** — async bug, session cookie not written, all users appear unauthenticated.
- **`getSession()` used in middleware instead of `updateSession()`** — bypasses server-side validation.

### Handoff to S4
> S3 done. Middleware live, typecheck passes, manual redirect test verified. Move to S4 — server actions.

---

## S4 — Server actions + Zod schemas 🟡 Medium

### Why
Every form submission goes through a server action. Wrong Zod schema = confusing error messages. Wrong action logic = silent failures. Needs Claude judgment, not a local model.

### Recommended model
**Claude Sonnet 4.6 in Claude Code.**

### Prompt to paste

> Continue Task 03. S0–S3 complete. Implement the server-action layer.
>
> **Read first:**
> 1. `docs/tasks/03-auth-system.md` § acceptance criteria — these drive what actions exist
> 2. `apps/web/src/lib/safe-action.ts` (S2 output) — use `action` for public, `authedAction` for protected
>
> **1. `apps/web/src/lib/auth/schemas.ts`** — Zod schemas:
> - `signUpSchema`: `{ email: z.string().email(), password: z.string().min(8, 'Password must be at least 8 characters') }`
> - `signInSchema`: same fields as signUpSchema
> - `magicLinkSchema`: `{ email: z.string().email() }`
> - `forgotPasswordSchema`: `{ email: z.string().email() }`
> - `resetPasswordSchema`: `{ password: z.string().min(8), confirmPassword: z.string() }` with `.refine()` checking passwords match
>
> **2. `apps/web/src/lib/auth/helpers.ts`** — utility functions:
> - `getRedirectPath(searchParams: URLSearchParams): string` — reads `redirectTo` param, validates it starts with `/` (prevent open redirect), defaults to `/app`
> - `normalizeAuthError(error: unknown): string` — maps Supabase error codes to user-friendly messages (e.g. `'Invalid login credentials'` → `'Email or password is incorrect'`, `'Email not confirmed'` → `'Please check your email to confirm your account'`)
>
> **3. `apps/web/src/lib/auth/actions.ts`** — server actions using `next-safe-action`:
> - `signUpAction` — `action(signUpSchema, async ({ email, password }) => { ... })` — calls `supabase.auth.signUp()`, returns `{ success: true }` on success. On error, call `normalizeAuthError`.
> - `signInAction` — calls `supabase.auth.signInWithPassword()`, on success redirects to `getRedirectPath()`
> - `signInWithMagicLinkAction` — calls `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: '<origin>/auth/callback' } })`
> - `signInWithGoogleAction` — calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '<origin>/auth/callback' } })`, returns `{ url }` for client-side redirect
> - `signOutAction` — `authedAction(z.object({}), async (_, { ctx: { supabase } }) => { await supabase.auth.signOut(); redirect('/login') })`
> - `forgotPasswordAction` — calls `supabase.auth.resetPasswordForEmail()` with `redirectTo: '<origin>/auth/callback?next=/reset-password'`
> - `resetPasswordAction` — `authedAction(resetPasswordSchema, ...)` — calls `supabase.auth.updateUser({ password })`
>
> For the `<origin>` in redirect URLs, use `headers().get('origin')` (from `next/headers`) at runtime.
>
> **Verify before reporting done:**
> ```bash
> pnpm --filter @fundededge/web typecheck
> ```
> Zero errors.

### Verify
```powershell
pnpm --filter @fundededge/web typecheck
```

### Common failures
- **Open redirect in `getRedirectPath`** — if you don't validate that `redirectTo` starts with `/`, an attacker can craft a link that redirects to a phishing site after login. The validation is non-optional.
- **`signInWithGoogleAction` uses server redirect** — Google OAuth requires a client-side redirect to the OAuth URL. The action must return the URL; the component handles `window.location.href = url`.

### Handoff to S5
> S4 done. Server actions and schemas typecheck. Move to S5 — UI components.

---

## S5 — Auth UI components + Storybook 🟡 Medium

### Why
These are the forms users see. They need to be accessible (keyboard nav, focus management, ARIA), responsive, and match the design system. Storybook stories are required per project standards.

### Recommended model
**Claude Sonnet 4.6 in Claude Code.**

### Prompt to paste

> Continue Task 03. S0–S4 complete. Implement the auth UI component layer.
>
> **Read first:**
> 1. `docs/tasks/03-auth-system.md` § "Files to create" and § acceptance criteria (a11y requirement)
> 2. `docs/standards/design.md` — design system, Tailwind tokens, shadcn component usage
> 3. `apps/web/src/lib/auth/actions.ts` (S4 output) — the actions these forms call
>
> **For each component, use:**
> - React Hook Form + `@hookform/resolvers/zod` for form state
> - shadcn/ui `<Form>`, `<Input>`, `<Button>`, `<Alert>` components
> - Tailwind CSS v4 utility classes
> - The corresponding Zod schema from `lib/auth/schemas.ts` for validation
> - `useAction` from `next-safe-action/hooks` for calling server actions with loading state
>
> **`components/auth/login-form.tsx`**
> - Email + password fields
> - "Sign in" submit button (shows spinner while pending)
> - "Continue with Google" button (delegates to `<GoogleButton>`)
> - "Or continue with magic link" toggle that reveals `<MagicLinkForm>` inline
> - Link to `/signup` and `/forgot-password`
> - Error alert when action returns error
>
> **`components/auth/signup-form.tsx`**
> - Email + password fields
> - "Create account" submit button
> - On success, shows "Check your email — we sent a verification link" state (no redirect — user must verify first)
> - Link to `/login`
>
> **`components/auth/magic-link-form.tsx`**
> - Email field only
> - On success, shows "Check your email for a sign-in link" state
>
> **`components/auth/google-button.tsx`**
> - Calls `signInWithGoogleAction` via `useAction`
> - On success, does `window.location.href = result.url`
> - Shows loading spinner while pending
>
> **`components/auth/password-reset-form.tsx`**
> - Two modes controlled by a `mode` prop: `'request'` (email field only, calls `forgotPasswordAction`) and `'reset'` (password + confirmPassword fields, calls `resetPasswordAction`)
>
> **Storybook stories** — create `*.stories.tsx` for each component with:
> - Default state
> - Loading state (mock action pending)
> - Error state (mock action returning error)
> - Success state (mock action resolved)
>
> **A11y requirements:**
> - Each form has a `<h1>` or properly labeled section
> - All inputs have `<label>` elements (via shadcn `<FormLabel>`)
> - Error messages are associated with inputs via `aria-describedby`
> - Submit buttons disabled (not just visually) while pending
> - Focus moves to error alert when server action returns an error (`useEffect` + `ref.focus()`)
>
> **Verify before reporting done:**
> ```bash
> pnpm --filter @fundededge/web typecheck
> pnpm storybook --smoke-test
> ```

### Verify
Typecheck passes. Storybook builds without error.

### Common failures
- **`useAction` import from wrong package** — it's `next-safe-action/hooks`, not `next-safe-action`
- **Google button uses server redirect** — must return the URL from the action and redirect client-side

### Handoff to S6
> S5 done. All 5 components exist, Storybook builds. Move to S6 — pages.

---

## S6 — Auth pages 🟡 Medium

### Why
Thin RSC page wrappers that compose the components. Minimal logic, but layout + metadata + a11y landmark structure matter.

### Recommended model
**Claude Sonnet 4.6 in Claude Code.**

### Prompt to paste

> Continue Task 03. S0–S5 complete. Implement the auth pages.
>
> **`app/(auth)/layout.tsx`**
> - Server Component (no `"use client"`)
> - Centered card layout: full-viewport-height flex container, white/dark card in center
> - FundedEdge logo at top of card (can be a text fallback `<span>FundedEdge</span>` for now)
> - No main nav — auth pages are intentionally isolated
> - Passes `children` through
>
> **`app/(auth)/login/page.tsx`**
> - `export const metadata = { title: 'Sign in — FundedEdge' }`
> - Renders `<LoginForm>`
> - Reads `searchParams.redirectTo` and passes it through to the form (the form passes it to `signInAction`)
>
> **`app/(auth)/signup/page.tsx`**
> - `export const metadata = { title: 'Create account — FundedEdge' }`
> - Renders `<SignupForm>`
>
> **`app/(auth)/verify-email/page.tsx`**
> - Static page: "Check your inbox" heading, instruction copy, link back to `/login`
> - No form, no dynamic data
>
> **`app/(auth)/forgot-password/page.tsx`**
> - `export const metadata = { title: 'Reset password — FundedEdge' }`
> - Renders `<PasswordResetForm mode="request" />`
>
> **`app/(auth)/reset-password/page.tsx`**
> - `export const metadata = { title: 'Set new password — FundedEdge' }`
> - Renders `<PasswordResetForm mode="reset" />`
> - Note: this page is only reachable after the user clicks the reset link in their email, which sets a session cookie via the callback route (S7). If the user has no session, middleware (S3) will redirect them to `/login`.
>
> **Verify before reporting done:**
> ```bash
> pnpm --filter @fundededge/web typecheck
> pnpm --filter @fundededge/web build
> ```
> Build must complete with zero errors (warnings about missing env vars in CI are OK).

### Verify
```powershell
pnpm --filter @fundededge/web build
```

### Handoff to S7
> S6 done. Auth pages build cleanly. Move to S7 — callback routes (security-critical).

---

## S7 — OAuth + magic link callback routes 🔴 Heavy

### Why
These routes receive tokens from Supabase after OAuth redirects and email link clicks. They must exchange tokens for sessions, handle all error cases, and never expose tokens in logs or error messages. A bug here = invalid sessions silently accepted, or valid sessions silently rejected. **Heavy tier mandatory.**

### Recommended model
**Claude Sonnet 4.6 minimum. Consider Opus 4.7** for the token exchange logic.

### Prompt to paste

> Continue Task 03. S0–S6 complete. Implement the two callback route handlers.
>
> **Read first:**
> 1. Supabase documentation on [server-side auth flow with PKCE](https://supabase.com/docs/guides/auth/server-side/nextjs) — Task 03 uses PKCE, not implicit flow
> 2. `docs/tasks/03-auth-system.md` § "Email templates" — these routes are the targets
>
> **`app/(auth)/auth/callback/route.ts`**
>
> This handles three types of callbacks:
> - OAuth (Google) — receives `code` query param
> - Magic link — receives `token_hash` + `type=magiclink` query params
> - Password recovery — receives `token_hash` + `type=recovery` query params
>
> Implementation:
> 1. Read `searchParams` from the request URL
> 2. If `code` is present: exchange via `supabase.auth.exchangeCodeForSession(code)` (PKCE)
> 3. If `token_hash` is present: verify via `supabase.auth.verifyOtp({ token_hash, type })` where `type` is `'magiclink'` or `'recovery'`
> 4. On success:
>    - If `type === 'recovery'`: redirect to `/reset-password` (user needs to set their new password)
>    - Otherwise: redirect to `next` param if present (must start with `/`), else `/app`
> 5. On any error: redirect to `/login?error=<url-encoded-message>` — do NOT expose raw Supabase error details
> 6. Must call `createClient(request)` from `lib/supabase/middleware.ts` (the request-scoped version), not the server or browser client — this route is a Route Handler, not an RSC
>
> **`app/api/auth/confirm/route.ts`**
>
> Handles Supabase's email confirmation link (the `/api/auth/confirm?token_hash=...&type=signup` format):
> 1. Read `token_hash` and `type` from search params
> 2. If either is missing: redirect to `/login?error=Invalid+confirmation+link`
> 3. Call `supabase.auth.verifyOtp({ token_hash, type })` — valid types here are `'signup'` and `'email_change'`
> 4. On success: redirect to `/app`
> 5. On error: redirect to `/login?error=<url-encoded-message>`
>
> **Security requirements:**
> - Never log token values
> - Validate that `next` redirect params start with `/` (prevent open redirect)
> - Return proper HTTP responses — these are Route Handlers, so use `NextResponse.redirect()`, not the `redirect()` helper from `next/navigation`
>
> **Verify before reporting done:**
> ```bash
> pnpm --filter @fundededge/web typecheck
> ```
> Then test with local Supabase:
> 1. Start local Supabase (`cd packages/db && supabase start`)
> 2. Sign up a user via the signup form → click the verification link from Mailpit (http://localhost:54324) → should land on `/app`
> 3. Request a magic link → click from Mailpit → should land on `/app`

### Verify
Typecheck passes. Mailpit verification link flow works end-to-end.

### Common failures
- **Using `redirect()` from `next/navigation` in a Route Handler** — this throws in Route Handler context. Use `NextResponse.redirect(new URL(..., request.url))` instead.
- **PKCE flow vs implicit flow** — if the Supabase project is configured for implicit flow, `exchangeCodeForSession` will fail. Confirm the project uses PKCE (it's the default for new projects post-2024).

### Handoff to S8
> S7 done. Callback routes handle all token types. End-to-end email flow tested locally. Move to S8 — test suite.

---

## S8 — Playwright E2E + Vitest unit tests 🔴 Heavy

### Why
Auth flows are the most critical user path in the app. Tests here are the proof that everything from S1–S7 works together. Without them, every deployment is a gamble. **Heavy tier mandatory.**

### Recommended model
**Claude Sonnet 4.6. Consider Opus 4.7** for the mocking strategy.

### Prompt to paste

> Continue Task 03. S0–S7 complete. Implement the full test suite.
>
> **Read first:**
> 1. `docs/tasks/03-auth-system.md` § "Testing requirements" — the exact list of required tests
> 2. `docs/standards/testing.md` — project test conventions
> 3. Existing E2E tests in `apps/web/e2e/` if any — match the style
>
> **Vitest unit tests — `apps/web/src/lib/auth/__tests__/schemas.test.ts`**
>
> For each Zod schema in `schemas.ts`:
> - At least 3 valid inputs that should parse successfully
> - At least 3 invalid inputs with the expected error message
> - Edge cases: empty strings, strings with only spaces, passwords exactly 7 and exactly 8 chars
>
> **Playwright E2E tests — `apps/web/e2e/auth/`**
>
> Create these test files:
>
> **`auth.signup.spec.ts`**
> - Happy path: fill signup form → submit → see "check your email" state
> - Invalid email → see inline validation error (before submit)
> - Short password → see inline validation error
> - Duplicate email (sign up twice with same address) → see normalized error message
>
> **`auth.login.spec.ts`**
> - Happy path (requires a pre-verified test user — create via Supabase admin API in `beforeAll`)
> - Wrong password → see error
> - Unverified email → see "please verify your email" message
>
> **`auth.magic-link.spec.ts`**
> - Submit magic link form → see "check your email" state
> - Click the magic link from Mailpit (Playwright fetches the Mailpit API at `http://localhost:54324/api/v1/messages`) → should land on `/app`
>
> **`auth.middleware.spec.ts`**
> - Unauthenticated user navigates to `/app` → redirected to `/login`
> - `redirectTo` param is preserved in the redirect URL
> - Authenticated user navigates to `/login` → redirected to `/app`
> - Authenticated user navigates to `/signup` → redirected to `/app`
>
> **`auth.password-reset.spec.ts`**
> - Request reset for known email → see "check your email" state
> - Click reset link from Mailpit → land on `/reset-password`
> - Submit new password → redirected to `/app` with active session
>
> **Mocking for Google OAuth:**
> Use Playwright's `page.route()` to intercept the Supabase OAuth redirect and return a mock auth code. Document the mock clearly with a comment so future developers understand it's not testing real OAuth, just the callback handler.
>
> **Test utilities:**
> - Create `apps/web/e2e/helpers/auth.ts` with a `createTestUser(email, password)` helper that uses Supabase admin API to create a pre-verified user, and a `deleteTestUser(email)` cleanup helper
> - Every test file uses unique emails (`crypto.randomUUID() + '@test.com'`)
> - Use `test.beforeAll` to create users, `test.afterAll` to clean them up
> - Assert `process.env.SUPABASE_URL?.includes('localhost')` at the top of `auth.ts` helper — tests must never run against prod
>
> **Configure Playwright to start local Supabase before the test run:**
> Update `apps/web/playwright.config.ts` to include a `globalSetup` file that verifies the local Supabase is running (or calls `supabase start` if it isn't).
>
> **Verify before reporting done:**
> 1. `pnpm --filter @fundededge/web test:unit` — Vitest unit tests pass
> 2. `pnpm --filter @fundededge/web test:e2e` — all Playwright tests pass (with local Supabase running)
> 3. Report total test counts for both suites

### Verify
Both test commands pass.

### Common failures
- **Mailpit API not available** — Supabase local Docker exposes Mailpit at port 54324. If it's not running, check `supabase status`.
- **Tests mutate shared state** — every test must use unique emails and clean up after itself. Shared test users = flaky tests.
- **Google OAuth test hits real Supabase redirect** — the mock must intercept at the browser level before Supabase redirects externally.

### Handoff to S9
> S8 done. Vitest + Playwright suites pass. Move to S9 — observability wiring.

---

## S9 — Sentry + PostHog wiring + registry update 🟡 Medium

### Why
Auth errors are the most important errors to catch — a broken signup flow means zero new users. PostHog `$identify` is required to attribute product analytics to real users. Medium tier.

### Recommended model
**Claude Sonnet 4.6 in Claude Code.**

### Prompt to paste

> Continue Task 03. S0–S8 complete. Wire up observability and close the task.
>
> **1. Sentry**
> If Sentry is not already initialized in `apps/web`, follow the [Sentry Next.js quickstart](https://docs.sentry.io/platforms/javascript/guides/nextjs/) to add `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, and update `next.config.ts` with the Sentry webpack plugin.
>
> Then instrument auth errors:
> - In each server action in `lib/auth/actions.ts`, catch unexpected errors and call `Sentry.captureException(e)` before rethrowing (do NOT capture expected errors like wrong password — only unexpected Supabase/network errors)
> - In `app/(auth)/auth/callback/route.ts` and `app/api/auth/confirm/route.ts`, wrap the main try block with Sentry
>
> **2. PostHog**
> - Install `posthog-js` if not present: `pnpm --filter @fundededge/web add posthog-js`
> - Create `apps/web/src/lib/posthog.ts` — exports `posthog` singleton initialized with `NEXT_PUBLIC_POSTHOG_KEY` and host `https://app.posthog.com`
> - In `components/auth/login-form.tsx`, after a successful `signInAction` call, fire `posthog.identify(userId, { email })` using the user data returned from the action
> - In `components/auth/google-button.tsx`, same `identify` call after successful OAuth redirect
>
> **3. `.env.example` update**
> Add these to `apps/web/.env.example`:
> ```
> SENTRY_DSN=
> NEXT_PUBLIC_POSTHOG_KEY=
> NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
> ```
>
> **4. Registry update**
> In `CLAUDE.md` § Component Registry, update Task 03 status from `🔴 Not started` to `🟢 Done`.
>
> **Verify before reporting done:**
> 1. `pnpm --filter @fundededge/web typecheck` passes
> 2. `pnpm --filter @fundededge/web build` passes
> 3. Trigger a Sentry test error by temporarily throwing in a server action — confirm it appears in Sentry dashboard
> 4. Log in locally and confirm `$identify` fires in PostHog Live Events

### Verify
Typecheck passes. Build passes.

---

## 4. Quality gates between sessions

Don't move from session N to session N+1 until:

1. The verify step for N passes
2. The session's output is committed to git on a branch
3. If session N opened a PR, the PR is merged OR the next session is told to keep working on the same branch
4. The table below has N marked 🟢

---

## 5. Failure recovery

If a session goes sideways:

1. **Don't merge anything.** Close the PR, delete the branch.
2. Run `git status` and stash any work-in-progress.
3. Restart the session with the same prompt — be explicit about what went wrong: "Last attempt did X which was wrong because Y. Try again without X."
4. If two attempts fail, **escalate the tier**: light → medium → heavy.

---

## 6. Session status

Update this table as each session completes.

| #  | Session                                    | Status         | PR  | Notes |
|----|--------------------------------------------|----------------|-----|-------|
| S0 | Supabase Auth + Resend + OAuth config      | 🔴 Not started | —   |       |
| S1 | Scaffold auth file skeleton                | 🔴 Not started | —   |       |
| S2 | Supabase client wrappers (web app layer)   | 🔴 Not started | —   |       |
| S3 | Middleware + session refresh               | 🔴 Not started | —   |       |
| S4 | Server actions + Zod schemas               | 🔴 Not started | —   |       |
| S5 | Auth UI components + Storybook             | 🔴 Not started | —   |       |
| S6 | Auth pages                                 | 🔴 Not started | —   |       |
| S7 | OAuth + magic link callback routes         | 🔴 Not started | —   |       |
| S8 | Playwright E2E + Vitest unit tests         | 🔴 Not started | —   |       |
| S9 | Sentry + PostHog wiring + registry update  | 🔴 Not started | —   |       |

---

## 7. Future-proofing notes

- **If Supabase changes the PKCE token exchange API** — the callback routes in S7 are the only place to update. The rest of the auth layer talks to Supabase through the client wrappers from S2.
- **If `next-safe-action` releases a breaking major version** — only `lib/safe-action.ts` and `lib/auth/actions.ts` need updating.
- **Two-factor auth** — explicitly out of scope for Task 03. When added, it will slot between middleware (S3) and the protected route, requiring a `/verify-2fa` step and an `mfaAction`.
- **If a session took longer than estimated** — update the est. time column for that row. Future runs of this task benefit from accurate estimates.
