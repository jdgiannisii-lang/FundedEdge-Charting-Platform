# Task 03: Authentication System

## Goal
A complete auth flow: signup, login, logout, password reset, email verification, magic link, Google OAuth, session management, protected routes, and middleware.

## Out of scope
- Subscription/billing (later)
- Profile editing UI (in account management task)
- Two-factor auth (post-launch)

## Dependencies
- Task 01, 02

## Acceptance criteria

- [ ] User can sign up with email + password
- [ ] User receives a verification email
- [ ] User can log in with email + password (after verification)
- [ ] User can log in with magic link (passwordless email)
- [ ] User can log in with Google OAuth
- [ ] User can request password reset; receives email with link; can set new password
- [ ] User can log out from any page
- [ ] Sessions persist across page reloads (HTTP-only cookies)
- [ ] Sessions refresh automatically near expiration
- [ ] Middleware redirects unauthenticated users from `/app/*` to `/login`
- [ ] Middleware redirects authenticated users from `/login` and `/signup` to `/app`
- [ ] Form validation client + server with consistent error messages
- [ ] All pages have proper a11y, keyboard nav, focus management
- [ ] Resend integrated for transactional emails (welcome, password reset)
- [ ] Sentry captures auth errors
- [ ] PostHog identifies users on login

## Files to create

```
apps/web/src/
├── middleware.ts
├── lib/
│   ├── supabase/
│   │   ├── server.ts
│   │   ├── browser.ts
│   │   └── middleware.ts
│   ├── auth/
│   │   ├── actions.ts
│   │   ├── schemas.ts
│   │   └── helpers.ts
│   └── safe-action.ts
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── verify-email/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   ├── reset-password/page.tsx
│   │   └── auth/callback/route.ts
│   └── api/
│       └── auth/
│           └── confirm/route.ts
└── components/
    └── auth/
        ├── login-form.tsx
        ├── signup-form.tsx
        ├── magic-link-form.tsx
        ├── google-button.tsx
        └── password-reset-form.tsx
```

## Implementation notes

### Supabase clients

Use `@supabase/ssr` package, exactly per Supabase docs.

### Server actions with safe-action

```typescript
import { createSafeActionClient } from 'next-safe-action'
import { createServerClient } from '@/lib/supabase/server'

export const action = createSafeActionClient({
  handleServerError(e) {
    if (process.env.NODE_ENV === 'development') console.error(e)
    return e instanceof Error ? e.message : 'Unexpected error'
  },
})

export const authedAction = action.use(async ({ next }) => {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return next({ ctx: { user, supabase } })
})
```

### Middleware

```typescript
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(req: NextRequest) {
  const { res, user } = await updateSession(req)
  const path = req.nextUrl.pathname
  if (!user && path.startsWith('/app')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  if (user && (path === '/login' || path === '/signup')) {
    return NextResponse.redirect(new URL('/app', req.url))
  }
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
```

### Email templates

Configure Supabase Auth email templates to point to our custom routes (`/auth/confirm`, `/reset-password`). Resend handles delivery; Supabase sends through Resend via SMTP integration.

## Testing requirements

- Playwright: full signup → verify → login → logout flow
- Playwright: magic link login (with email mocking via Mailpit in dev)
- Playwright: Google OAuth (mocked in test env)
- Playwright: password reset flow
- Playwright: middleware redirects (unauthed user blocked from /app, authed user redirected from /login)
- Vitest: schema validation passes/fails on expected inputs

## Definition of done

- [ ] All acceptance criteria checked
- [ ] All flows tested in Playwright
- [ ] Sentry verified to catch a forced auth error
- [ ] PostHog `$identify` event firing on login
- [ ] CLAUDE.md component registry updated: 03 → 🟢 Done
