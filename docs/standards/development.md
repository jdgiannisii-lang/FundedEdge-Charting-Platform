# Development Standards

The non-negotiable rules. Every PR is judged against this. If you don't agree with one, propose a change in a PR — don't ignore.

## TypeScript

- **Strict mode on.** `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitAny: true`.
- **No `any`.** Ever. Use `unknown` and narrow.
- **No `@ts-ignore` or `@ts-expect-error` without an inline comment** explaining why and a linked GitHub issue (`// @ts-expect-error: see #123 — TradingView types are wrong`).
- **Branded types for IDs.** `type AccountId = string & { __brand: 'AccountId' }` so you can't pass a UserId where an AccountId is expected.
- **Discriminated unions over optional fields.** `type Foo = { kind: 'a'; x: number } | { kind: 'b'; y: string }`, not `type Foo = { kind: string; x?: number; y?: string }`.

## File organization

- **Feature-folder structure** in `apps/web/src/features/<feature>/`. Each feature has `components/`, `hooks/`, `actions.ts`, `queries.ts`, `types.ts`, `index.ts`.
- **`index.ts` is the public API.** Anything not exported from `index.ts` is private.
- **No barrel files for utility modules** — barrels can hurt tree-shaking. Use `index.ts` only for public-facing module boundaries.
- **One component per file** unless they're tightly coupled and never used separately.
- **kebab-case for filenames**, PascalCase for component names: `account-card.tsx` exporting `AccountCard`.

## Naming

- **Booleans start with `is`/`has`/`can`/`should`/`will`.** `isLoading`, `hasError`, `canEdit`.
- **Event handlers start with `on`/`handle`.** `onClick`, `handleSubmit`.
- **No abbreviations** unless they're domain terms (P&L, RTH, NQ, ES are fine; `usr`, `acct`, `cfg` are not).
- **Constants in SCREAMING_SNAKE_CASE** at module scope. `const POLL_INTERVAL_MS = 5000`.

## React + Next.js

- **Server Components by default.** `'use client'` only when the file uses hooks, browser APIs, or event handlers.
- **Compose, don't drill.** If you're passing a prop more than 2 levels deep, lift it to context or use a Zustand selector.
- **Suspense boundaries** at every async data dependency. Loading skeletons, not spinners.
- **Error boundaries** at every feature root. Friendly fallback UIs, Sentry capture, retry button.
- **`useEffect` is a code smell.** If you're using it, ask whether it should be derived state, an event handler, or a Server Component instead.
- **No `<form>` without an action handler.** Use Server Actions or controlled inputs explicitly. Never accidentally trigger a navigation.

## Imports

- **Absolute imports** within an app via `@/*` (configured in tsconfig).
- **Cross-package imports** go through the package's public API: `import { evaluate } from '@fundededge/rules-engine'`.
- **No circular dependencies.** CI fails on them via `madge`.
- **External imports first, then absolute, then relative**, separated by blank lines. Biome enforces this.

## Async patterns

- **`async/await` only.** No `.then()` chains except in event-handler edge cases.
- **Always handle errors.** A bare `await` without try/catch or upstream `.catch()` is a defect.
- **No fire-and-forget unless explicit.** `void someAsync()` to mark intentional.
- **Use `AbortController` for cancellable requests.**

## Error handling

- **Throw `Error` subclasses, not strings.** Custom errors get a name property.
- **At boundaries, catch and convert.** A server action that calls Supabase wraps errors in user-friendly messages.
- **Log with context.** `logger.error('Failed to evaluate rules', { accountId, error })` not `console.log(e)`.
- **User-facing errors are friendly.** Never show stack traces or internal details to users.

## Comments

- **Code should explain itself.** Comments explain *why*, not *what*.
- **TSDoc on every exported function** in shared packages. Include `@param`, `@returns`, `@throws`, `@example` where helpful.
- **`// FIXME:` is forbidden in `main`.** Either fix it or open an issue and reference it: `// TODO(#42): handle the case where ...`.
- **`// HACK:` requires a paired GitHub issue and a PR comment requesting reviewer attention.**

## Performance

- **Memoize when there's a measured win.** No premature `useMemo` everywhere.
- **Lazy load below-the-fold** components with `dynamic()`.
- **Images use `next/image`** with explicit width/height to avoid CLS.
- **No `<a href>` for internal navigation** — use `<Link>`.
- **Database queries in server components are fine and encouraged.** Don't proxy through API routes unless you need to.

## Logging & observability

- **Use the `logger` from `@fundededge/utils`**, not `console.*`.
- **Capture errors with Sentry** at error boundaries and at the root server action wrapper.
- **PostHog events are typed.** Add new event names to `apps/web/src/lib/analytics/events.ts`.
- **No PII in logs.** Email and account numbers redacted by the logger automatically.

## Database access

- **Use the typed Supabase client.** `supabase.from('accounts').select(...)` returns typed rows.
- **Never construct raw SQL strings** unless using the parametrized `rpc()` for stored procedures.
- **RLS handles auth at the row level — but still validate inputs.** Defense in depth.
- **No N+1 queries.** Use joins, `select` with related tables, or batch.

## Forms

- **React Hook Form + Zod**, every time.
- **The Zod schema is the source of truth** — derive types from it.
- **Server actions re-validate.** Client-side validation is UX, server-side is security.
- **Disabled submit buttons during pending state.** Optimistic updates where the action is reversible.

## Accessibility

- **Lighthouse accessibility score = 100.** No exceptions.
- **Every interactive element is keyboard reachable** with visible focus state.
- **Color contrast meets WCAG AA** in both themes.
- **Screen reader labels** on icon-only buttons.
- **`prefers-reduced-motion` honored.**

## Code review

- **Every PR has a reviewer.** Even when it's just you and Claude — ask Claude to review what you wrote, then adopt the changes you accept.
- **Reviewer focus, in order:** correctness → security → tests → performance → readability → style.
- **Style is automated.** Don't comment on style — Biome handles it.
- **Approve only when you would defend the code in production.**
