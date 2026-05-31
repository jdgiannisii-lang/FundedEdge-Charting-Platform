# Task 04 — Session Breakdown

> Task 04 (App Shell — 3-Panel Cockpit Layout) is split into **9 independently-runnable sessions** so each one is small enough to finish in a single chat, fail safely, and be done by the right tier of model. This task is UI-heavy: panel layout, collapse/resize behavior, theming, accessibility, and Playwright regression coverage.
>
> **Read this whole document before starting.** Each session links to the one before and after. Don't skip ahead — S4 depends on S1, S2, and S3 all being done.

---

## 0. Glossary of tiers

| Tier | Who runs it | Use for |
|------|-------------|---------|
| 🟣 **User** | You, in a browser / terminal | Account creation, secret handling, anything that can't be code-reviewed |
| 🟢 **Light** | Local model (Ollama: `qwen2.5-coder:14b`, `deepseek-coder-v2`, or cloud `nemotron-3-super`) via OpenCode | Mechanical scaffolding, file creation from exact templates, running CLI commands. No architecture, no security code. |
| 🟡 **Medium** | Claude Sonnet 4.6 in Claude Code | Code with judgment but not novel design: component wrappers, store patterns, route wiring, Storybook stories. |
| 🔴 **Heavy** | Claude Sonnet 4.6 (default) or Opus 4.7 (when explicitly hard) in Claude Code | Complex UI architecture, cross-cutting a11y/animation concerns, Playwright E2E, anything where being wrong = broken cockpit in production. |

**Rule of thumb:** if getting it wrong silently ships a janky experience or breaks keyboard navigation for every user, it's 🔴 Heavy.

**Claude Code rule:** When the next session to run is 🟢 Light, do NOT execute it. Instead, print the session's "Prompt to paste" block verbatim and tell the user to run it in their local Ollama model. Then stop. Only pick up again when the user confirms the Light session is done.

---

## 1. Dependency graph

```
S0 (light: deps + stubs)
  ├──► S1 (medium: design tokens)   ─┐
  ├──► S2 (medium: zustand stores)   ├──► S4 (heavy: shell components)
  └──► S3 (medium: ui primitives)   ─┘
                                           │
                                           ▼
                                     S5 (medium: route group + pages)
                                           │
                               ┌───────────┴───────────┐
                               ▼                       ▼
                         S6 (light:             S7 (heavy:
                          storybook)             playwright)
                               └───────────┬───────────┘
                                           ▼
                                     S8 (medium: lighthouse CI
                                          + registry update)
```

S1, S2, and S3 can run in parallel after S0 completes. Each session marks **🟢 Done** in the status table at the bottom of this file before the next session starts.

---

## 2. Session index

| # | Title | Tier | Est. time | Depends on |
|---|-------|------|-----------|------------|
| S0 | Install deps + scaffold stubs | 🟢 Light | 20 min | — |
| S1 | Design tokens + globals | 🟡 Medium | 30 min | S0 |
| S2 | Zustand stores | 🟡 Medium | 25 min | S0 |
| S3 | `packages/ui` new components | 🟡 Medium | 45 min | S0 |
| S4 | Shell components | 🔴 Heavy | 75 min | S1, S2, S3 |
| S5 | Route group + layout + pages | 🟡 Medium | 30 min | S4 |
| S6 | Storybook stories | 🟢 Light | 20 min | S5 |
| S7 | Playwright E2E | 🔴 Heavy | 60 min | S5 |
| S8 | Lighthouse CI + registry update | 🟡 Medium | 25 min | S6, S7 |

Total: ~5.5 hours of effort, spread across however many days you want.

---

## 3. Conventions used in this doc

- **`> Prompt to paste:`** — copy the indented block verbatim into the session's chat. Don't paraphrase.
- **`> Verify:`** — exact check that should pass before marking the session done.
- **`> Common failures:`** — known gotchas with recovery.
- File paths are repo-relative.

---

## S0 — Install deps + scaffold stubs 🟢 Light

### Why
Pure mechanical work. Get the three new packages on disk and every new file created as a typed stub so S1, S2, and S3 can run in parallel without collisions.

### Recommended model
`qwen2.5-coder:14b` (Ollama) or `deepseek-coder-v2:16b`. Any local model can follow exact file-write + CLI instructions.

### Prompt to paste

> You are working in the FundedEdge monorepo. The working directory is the repo root. Do exactly the following steps — no improvisation, no extra files, no logic.
>
> **Step 1 — Add packages.**
>
> Edit `apps/web/package.json` to add to `dependencies`:
> - `"zustand": "^5.0.0"`
> - `"next-themes": "^0.4.0"`
>
> Edit `packages/ui/package.json` to add to `dependencies`:
> - `"react-resizable-panels": "^2.1.0"`
> - `"@radix-ui/react-tabs": "^1.1.0"`
> - `"@radix-ui/react-popover": "^1.1.0"`
> - `"@radix-ui/react-dropdown-menu": "^2.1.0"`
> - `"@radix-ui/react-avatar": "^1.1.0"`
>
> Also add `"next-themes": "^0.4.0"` to `packages/ui/package.json` `peerDependencies` (ThemeProvider wraps next-themes).
>
> **Step 2 — Install.**
>
> ```bash
> pnpm install
> ```
>
> **Step 3 — Create stub files.**
>
> Rules:
> - `.tsx` component files → `export default function Placeholder() { return null; }`
> - `.ts` store files → `export {};`
> - `layout.tsx` files → `export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }`
> - `page.tsx` files → `export default function Page() { return null; }`
>
> Create every file listed below with the matching stub rule. Create parent directories as needed.
>
> ```
> apps/web/src/components/shell/cockpit.tsx           (component stub)
> apps/web/src/components/shell/top-bar.tsx           (component stub)
> apps/web/src/components/shell/left-panel.tsx        (component stub)
> apps/web/src/components/shell/center-panel.tsx      (component stub)
> apps/web/src/components/shell/right-panel.tsx       (component stub)
> apps/web/src/components/shell/right-panel-tabs.tsx  (component stub)
> apps/web/src/components/shell/user-menu.tsx         (component stub)
> apps/web/src/components/shell/theme-toggle.tsx      (component stub)
> apps/web/src/components/shell/density-toggle.tsx    (component stub)
> apps/web/src/components/shell/desktop-only-notice.tsx (component stub)
> apps/web/src/stores/ui.ts                           (store stub)
> apps/web/src/stores/theme.ts                        (store stub)
> apps/web/src/app/(app)/layout.tsx                   (layout stub)
> apps/web/src/app/(app)/page.tsx                     (page stub)
> apps/web/src/app/(app)/settings/page.tsx            (page stub)
> packages/ui/src/components/resizable.tsx            (component stub)
> packages/ui/src/components/tabs.tsx                 (component stub)
> packages/ui/src/components/popover.tsx              (component stub)
> packages/ui/src/components/dropdown-menu.tsx        (component stub)
> packages/ui/src/components/avatar.tsx               (component stub)
> packages/ui/src/components/theme-provider.tsx       (component stub)
> ```
>
> Do NOT add these to `packages/ui/src/index.ts` yet — S3 will do that when the real implementations exist.
>
> **Step 4 — Do NOT delete `apps/web/src/app/app/page.tsx`** — that's deleted in S5.
>
> **Step 5 — Typecheck both packages:**
>
> ```bash
> pnpm --filter @fundededge/web typecheck
> pnpm --filter @fundededge/ui typecheck
> ```
>
> Fix any typecheck errors caused by the stubs. The layout stub needs `import type React from 'react'` if TypeScript complains. Do NOT add real logic.
>
> **Step 6 — Stop and report.** List every file created. Do not proceed further.

### Verify
```bash
ls apps/web/src/components/shell/
ls apps/web/src/stores/
ls apps/web/src/app/\(app\)/
ls packages/ui/src/components/
pnpm --filter @fundededge/web typecheck
pnpm --filter @fundededge/ui typecheck
```
All listed files exist. Both typechecks pass.

### Common failures
- **`pnpm install` fails on missing peer deps** — check that `next-themes` was added to `packages/ui` peerDependencies.
- **Layout stub typecheck error** — add `import type React from 'react'` at the top and change the body to `return <>{children}</>`.
- **Model created extra files** — delete them and note "ONLY create the files in the list."

### Handoff to S1/S2/S3
> S0 is done. All stub files created, both typechecks pass. S1, S2, and S3 can now run in parallel.

---

## S1 — Design tokens + globals 🟡 Medium

### Why
Every downstream component imports CSS variables from `tokens.css`. A local model would invent arbitrary hex values; Medium tier ensures the token system is coherent, matches `docs/standards/design.md`, and covers both dark (default) and light themes correctly.

### Recommended model
**Claude Sonnet 4.6 in Claude Code.**

### Prompt to paste

> Continue Task 04 in the FundedEdge monorepo. S0 is complete. Read these files before writing anything:
> 1. `docs/standards/design.md` § Themes, § Layout, § Motion
> 2. `docs/tasks/04-app-shell.md` § "Glass effect" (exact CSS to use for `.glass`)
> 3. `apps/web/src/styles/tokens.css` (currently just a placeholder comment)
> 4. `apps/web/src/app/globals.css` (currently imports tokens.css + Tailwind)
>
> **Goal 1 — Populate `apps/web/src/styles/tokens.css`:**
>
> Replace the placeholder comment with the full CSS variable set. Required structure:
>
> ```css
> /* dark theme — default */
> :root {
>   /* from design.md */
>   --color-bg-primary: #0a0b0d;
>   --color-bg-elevated: rgba(255, 255, 255, 0.04);
>   --color-bg-glass: rgba(255, 255, 255, 0.06);
>   --color-border-subtle: rgba(255, 255, 255, 0.08);
>   --color-text-primary: #f5f5f7;
>   --color-text-secondary: #a1a1aa;
>   --color-text-tertiary: #71717a;
>   --color-success: #10b981;
>   --color-warning: #f59e0b;
>   --color-danger: #ef4444;
>   --color-info: #3b82f6;
>   --color-bull: #22c55e;
>   --color-bear: #ef4444;
>   --color-neutral: #71717a;
>   /* shell geometry */
>   --topbar-height: 3.5rem;
>   --panel-icon-rail: 60px;
>   /* density — comfortable (default) */
>   --density-padding-sm: 0.5rem;
>   --density-padding-md: 1rem;
>   --density-font-scale: 1;
> }
>
> /* light theme */
> .light {
>   --color-bg-primary: #ffffff;
>   --color-bg-elevated: rgba(0, 0, 0, 0.03);
>   --color-bg-glass: rgba(255, 255, 255, 0.72);
>   --color-border-subtle: rgba(0, 0, 0, 0.1);
>   --color-text-primary: #09090b;
>   --color-text-secondary: #52525b;
>   --color-text-tertiary: #a1a1aa;
>   /* semantic and trader colors stay the same in light */
> }
>
> /* compact density */
> [data-density="compact"] {
>   --density-padding-sm: 0.25rem;
>   --density-padding-md: 0.5rem;
>   --density-font-scale: 0.875;
> }
> ```
>
> Add any additional tokens you think are missing (border-radius, shadow, z-index layers, focus ring color). Derive sensible values — dark is primary, light is secondary.
>
> **Goal 2 — Update `apps/web/src/app/globals.css`:**
>
> Add after the existing `@import` lines:
>
> 1. Base styles:
> ```css
> html, body {
>   height: 100%;
> }
> body {
>   background: var(--color-bg-primary);
>   color: var(--color-text-primary);
> }
> ```
>
> 2. The `.glass` utility exactly as specified in `docs/tasks/04-app-shell.md`:
> ```css
> .glass {
>   background: color-mix(in oklch, var(--color-bg-elevated) 80%, transparent);
>   backdrop-filter: blur(16px) saturate(140%);
>   -webkit-backdrop-filter: blur(16px) saturate(140%);
>   border: 1px solid var(--color-border-subtle);
> }
> ```
>
> 3. Reduced-motion global override:
> ```css
> @media (prefers-reduced-motion: reduce) {
>   *, *::before, *::after {
>     animation-duration: 0.01ms !important;
>     animation-iteration-count: 1 !important;
>     transition-duration: 0.01ms !important;
>   }
> }
> ```
>
> **Verify before reporting done:**
> ```bash
> pnpm --filter @fundededge/web typecheck
> ```
> Must pass.

### Verify
```bash
pnpm --filter @fundededge/web typecheck
grep -c "\-\-color-" apps/web/src/styles/tokens.css
```
Typecheck passes. At least 10 `--color-*` variables in the file.

### Common failures
- **Tailwind v4 doesn't pick up the custom CSS variables** — Tailwind v4 uses CSS variables natively; as long as the tokens file is imported in `globals.css` (it already is), they're available.

### Handoff to S4
> S1 done. Design tokens and globals populated. Move to S4 when S2 and S3 are also complete.

---

## S2 — Zustand stores 🟡 Medium

### Why
The cockpit reads panel sizes and density from Zustand. Needs judgment because Zustand + `localStorage` persistence has an SSR hydration footgun — the `skipHydration: true` + `useEffect` rehydration pattern must be correct or panels flash their default sizes on every page load.

### Recommended model
**Claude Sonnet 4.6 in Claude Code.**

### Prompt to paste

> Continue Task 04 in the FundedEdge monorepo. S0 is complete.
>
> **Goal:** Implement the two Zustand stores.
>
> Read first:
> 1. `docs/tasks/04-app-shell.md` § "Panel sizes persist per-user (Zustand + localStorage)" and the `Cockpit` code example (shows `useUi()` hook usage)
> 2. The Zustand docs for the `persist` middleware, specifically the `skipHydration` option — this is required to avoid SSR/client mismatch
>
> **`apps/web/src/stores/ui.ts`** — replace the stub with:
>
> A store that holds panel geometry and density preference, persisted to `localStorage` under the key `'fundededge-ui'`.
>
> Interface:
> ```ts
> interface UiState {
>   leftPanelSize: number | null    // percentage (react-resizable-panels uses percentages)
>   rightPanelSize: number | null
>   leftCollapsed: boolean
>   rightCollapsed: boolean
>   density: 'comfortable' | 'compact'
>   setLeftPanelSize: (v: number) => void
>   setRightPanelSize: (v: number) => void
>   setLeftCollapsed: (v: boolean) => void
>   setRightCollapsed: (v: boolean) => void
>   setDensity: (v: 'comfortable' | 'compact') => void
> }
> ```
>
> Use `create<UiState>()(persist(..., { name: 'fundededge-ui', skipHydration: true }))`.
>
> Export the store as `useUiStore`. Also export a convenience hook `useUi()` that returns the full state.
>
> **`apps/web/src/stores/theme.ts`** — this file can stay minimal. `next-themes` owns the light/dark state. Use this file only if you need a typed wrapper around `useTheme()` from `next-themes` — otherwise export a comment explaining that `useTheme()` from `next-themes` is the primary hook and leave the file as `export {};`.
>
> **Verify before reporting done:**
> ```bash
> pnpm --filter @fundededge/web typecheck
> ```
> Must pass.

### Verify
```bash
pnpm --filter @fundededge/web typecheck
grep "skipHydration" apps/web/src/stores/ui.ts
```
Typecheck passes. `skipHydration` is present.

### Common failures
- **`useUiStore` accessed during SSR and throws** — `skipHydration: true` prevents the store from reading `localStorage` on the server. The shell components call `useUiStore.persist.rehydrate()` inside a `useEffect` — this is correct behavior, not a bug.
- **Zustand v5 import syntax** — Zustand v5 uses `import { create } from 'zustand'` and `import { persist } from 'zustand/middleware'`. If the model uses v4 syntax, ask it to correct.

### Handoff to S4
> S2 done. Zustand stores implemented with `skipHydration`. Move to S4 when S1 and S3 are also complete.

---

## S3 — `packages/ui` new components 🟡 Medium

### Why
Shell components import `ResizablePanel*`, `Tabs`, `Popover`, `DropdownMenu`, `Avatar`, and `ThemeProvider` from `@fundededge/ui`. These need correct APIs and Tailwind styling so S4 can wire them together cleanly. Medium tier because the API surface design matters — a mis-shaped Radix wrapper forces S4 to work around it.

### Recommended model
**Claude Sonnet 4.6 in Claude Code.**

### Prompt to paste

> Continue Task 04 in the FundedEdge monorepo. S0 is complete. Radix and react-resizable-panels are installed.
>
> **Goal:** Implement six new components in `packages/ui/src/components/` and update the package's index exports.
>
> Read first:
> 1. `docs/tasks/04-app-shell.md` § "Files to create" (packages/ui section) and the `Cockpit` code example — this shows how `ResizablePanel*` is imported
> 2. `docs/standards/design.md` § "Glass effects" and § "Component primitives"
> 3. The existing `packages/ui/src/components/button.tsx` to understand the export style in use
>
> ---
>
> **`packages/ui/src/components/resizable.tsx`:**
> Re-export `ResizablePanelGroup`, `ResizablePanel`, `ResizableHandle` from `react-resizable-panels`. Apply Tailwind classes to `ResizableHandle` for the 1px border treatment and a subtle hover highlight. Accept and forward a `className` prop.
>
> ---
>
> **`packages/ui/src/components/tabs.tsx`:**
> Wrap `@radix-ui/react-tabs`. Export `Tabs` (Root), `TabsList`, `TabsTrigger`, `TabsContent`. Style `TabsList` as a horizontal compact pill nav: small border-radius, subtle background, full-width or fit-content based on a `stretch` prop. `TabsTrigger` gets `aria-selected` styles. All Radix props pass through.
>
> ---
>
> **`packages/ui/src/components/popover.tsx`:**
> Wrap `@radix-ui/react-popover`. Export `Popover` (Root), `PopoverTrigger`, `PopoverContent`. Apply `.glass` class to `PopoverContent` by default (it's a floating element per design.md). Set `sideOffset={8}` as the default. Accept `className` to override.
>
> ---
>
> **`packages/ui/src/components/dropdown-menu.tsx`:**
> Wrap `@radix-ui/react-dropdown-menu`. Export: `DropdownMenu` (Root), `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`. Apply `.glass` class to `DropdownMenuContent`. `DropdownMenuItem` gets hover state via Tailwind `hover:bg-white/10` (dark-mode-first). Export types for each.
>
> ---
>
> **`packages/ui/src/components/avatar.tsx`:**
> A simple circular avatar component. Props: `name?: string`, `src?: string`, `size?: 'sm' | 'md'`. If `src` is provided, render an `<img>`. Otherwise show the first two initials of `name` in uppercase. `sm` = 28px, `md` = 36px. Background: `var(--color-bg-elevated)`, text: `var(--color-text-secondary)`.
>
> ---
>
> **`packages/ui/src/components/theme-provider.tsx`:**
> Wrap `next-themes`' `ThemeProvider`. Re-export as `ThemeProvider` with `defaultTheme="dark"` and `attribute="class"` as defaults (overridable via props). Mark as `"use client"` at the top of the file — next-themes requires a client boundary.
>
> ---
>
> **Update `packages/ui/src/index.ts`:**
> Add exports for all six new components and their types. Follow the existing export style (`export { Foo } from './components/foo'`).
>
> ---
>
> **Verify before reporting done:**
> ```bash
> pnpm --filter @fundededge/ui typecheck
> ```
> Must pass with zero errors.

### Verify
```bash
pnpm --filter @fundededge/ui typecheck
grep "ResizablePanel\|Tabs\|Popover\|DropdownMenu\|Avatar\|ThemeProvider" packages/ui/src/index.ts
```
Typecheck passes. All six components are exported from `index.ts`.

### Common failures
- **`"use client"` missing on ThemeProvider** — next-themes `ThemeProvider` is a client component; the wrapper must have `"use client"` as its first line.
- **Radix types conflict** — if you see `Property 'ref' types are incompatible`, add `forwardRef` or use the newer Radix v2 API which doesn't require it.
- **`.glass` class not applying** — `.glass` is defined in `apps/web/src/app/globals.css`, not in `packages/ui`. The Radix components render into the app's DOM where that CSS is loaded — it will work. Do not try to import it from within the package.

### Handoff to S4
> S3 done. All six UI components implemented and exported. Move to S4 when S1 and S2 are also complete.

---

## S4 — Shell components 🔴 Heavy

### Why
This is the highest-complexity session: the cockpit layout, all panel logic, collapse/resize wiring to Zustand, keyboard accessibility, `prefers-reduced-motion`, and consistent density behavior — all cross-cutting concerns that need to be handled together. A Medium session will get things rendering but will miss `aria-expanded` states, tab key order, and the reduced-motion overrides. **Heavy tier mandatory.**

### Recommended model
**Claude Sonnet 4.6 minimum. Consider Opus 4.7** if you want belt-and-suspenders on the a11y work (the Lighthouse a11y target is 100).

### Prompt to paste

> Continue Task 04 in the FundedEdge monorepo. S1, S2, and S3 are all complete.
>
> **Read these in order before writing a single line:**
> 1. `docs/tasks/04-app-shell.md` — full spec, acceptance criteria, and code example for `Cockpit`
> 2. `docs/standards/design.md` § Layout, § Motion, § Accessibility
> 3. `apps/web/src/stores/ui.ts` — the `useUiStore` hook and full state interface
> 4. `packages/ui/src/index.ts` — what's exported (ResizablePanel*, Tabs*, DropdownMenu*, Avatar, ThemeProvider)
>
> **Goal:** Implement all ten shell components in `apps/web/src/components/shell/`. Replace every stub.
>
> ---
>
> **`cockpit.tsx`** — `"use client"`. The root panel component. Use the code example from the spec as your base. Wire `onResize`, `onCollapse`, `onExpand` on both outer panels to the Zustand store setters. Call `useUiStore.persist.rehydrate()` inside a `useEffect(() => { useUiStore.persist.rehydrate() }, [])` — this loads the persisted panel sizes from localStorage after hydration. `defaultSize` should read from the store (`leftPanelSize ?? 22`, `rightPanelSize ?? 22` — react-resizable-panels uses percentage). `collapsedSize={4}` keeps an icon rail visible.
>
> ---
>
> **`top-bar.tsx`** — `"use client"` only if it uses any hooks; otherwise RSC. Fixed-height `h-14` sticky bar at the top. Three zones:
> - Left: `<span className="font-semibold tracking-tight">FundedEdge</span>` wordmark placeholder
> - Center: `<span className="text-sm text-[--color-text-secondary]">NQ · 5m</span>` symbol/timeframe placeholder
> - Right: `<UserMenu />`
>
> Use `position: sticky; top: 0; z-index: 50` with `background: var(--color-bg-primary)` and a subtle 1px bottom border.
>
> ---
>
> **`left-panel.tsx`** — Renders a content area (`children` slot) with a collapse toggle button pinned to the right edge. When `leftCollapsed` is `true` in the Zustand store, the panel is in icon rail mode — show only the collapse button (centered). When expanded, show full content. The toggle button must have `aria-expanded={!leftCollapsed}` and `aria-label={leftCollapsed ? "Expand left panel" : "Collapse left panel"}`. Animate the collapse with `transition-all duration-250 motion-reduce:transition-none`.
>
> ---
>
> **`center-panel.tsx`** — Thin wrapper: `flex flex-col flex-1 overflow-hidden h-full`. Renders `children`. No collapse, no state.
>
> ---
>
> **`right-panel.tsx`** — Mirror of `left-panel.tsx` but for the right side. Collapse toggle pinned to left edge. When expanded, renders `<RightPanelTabs />`. In collapsed mode, show only the toggle.
>
> ---
>
> **`right-panel-tabs.tsx`** — `"use client"`. Use `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from `@fundededge/ui`. Three tabs: **News**, **Checklist**, **Journal**. Each content area is a `<div className="p-4 text-sm text-[--color-text-secondary]">Coming soon.</div>` placeholder. The tab list must have proper ARIA: the Radix Tabs component handles `role="tablist"`, `role="tab"`, and `role="tabpanel"` automatically — verify this is not being overridden.
>
> ---
>
> **`user-menu.tsx`** — `"use client"`. Use `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator` from `@fundededge/ui`. Trigger is an `<Avatar>` with the user's name/email initials. Get the current user from Supabase: import `createBrowserClient` from `@/lib/supabase/browser`, call `.auth.getUser()` in a `useEffect`, store in local state. Menu items:
> 1. Non-interactive display item showing email (dimmed text, `pointer-events-none`)
> 2. `<DropdownMenuSeparator />`
> 3. `<ThemeToggle />` rendered inline as a menu item row
> 4. `<DensityToggle />` rendered inline as a menu item row
> 5. Settings link: `<DropdownMenuItem asChild><a href="/app/settings">Settings</a></DropdownMenuItem>`
> 6. `<DropdownMenuSeparator />`
> 7. Logout button: calls `signOutAction` from `@/lib/auth/actions` on click
>
> ---
>
> **`theme-toggle.tsx`** — `"use client"`. Import `useTheme` from `next-themes`. Cycle through `system → light → dark → system` on click. Show a sun icon for light, moon for dark, monitor/display for system. Use inline SVG icons (no icon library dependency). `aria-label` must describe the current theme and what clicking will do: `"Switch to dark mode"`, etc.
>
> ---
>
> **`density-toggle.tsx`** — `"use client"`. Read `density` from `useUiStore()`. Toggle between `'comfortable'` and `'compact'` on click. On change, call `setDensity()` and also set `document.documentElement.dataset.density = value` so CSS variables respond immediately. Show a compact rows icon vs. spacious rows icon (inline SVG). `aria-label="Switch to compact density"` etc.
>
> ---
>
> **`desktop-only-notice.tsx`** — RSC (no hooks needed). Full-screen centered message:
> ```tsx
> <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
>   <p className="text-2xl font-semibold">FundedEdge is built for desktop trading.</p>
>   <p className="text-sm text-[--color-text-secondary]">
>     Please open this on a screen wider than 1024px.
>   </p>
> </div>
> ```
>
> ---
>
> **Cross-cutting requirements (apply to all components):**
> - Every animation class uses `motion-reduce:transition-none` or `motion-reduce:animate-none` alongside the animation class
> - Collapse toggle buttons: `aria-expanded`, descriptive `aria-label`
> - All interactive elements reachable by keyboard tab in logical order
> - No hardcoded hex colors — use CSS variables from `tokens.css`
>
> **Verify before reporting done:**
> ```bash
> pnpm --filter @fundededge/web typecheck
> ```
> Must pass with zero errors.
>
> Also start the dev server and manually confirm:
> - `http://localhost:3000/app` renders the cockpit shell (logged in)
> - Left and right panel collapse buttons are clickable
> - Right panel tab bar is visible with News / Checklist / Journal
> - No console errors

### Verify
```bash
pnpm --filter @fundededge/web typecheck
```
Zero errors. Dev server confirms cockpit renders.

### Common failures
- **`useUiStore` SSR crash** — all components using the store must be `"use client"`. Cockpit, left-panel, right-panel, theme-toggle, density-toggle, and user-menu all need `"use client"`.
- **`useTheme` returns `undefined` theme** — this happens if `ThemeProvider` is not in the React tree above the component. It gets added in S5; for now, the dev server may show this — it is expected until the layout is wired.
- **Radix DropdownMenu portals to `<body>` and glass styles don't apply** — this is normal; Radix portals render outside the panel DOM. The `.glass` class in `globals.css` applies globally to any element with that class regardless of where it's portalled.

### Handoff to S5
> S4 done. All shell components implemented, typecheck green, cockpit renders in dev. Move to S5.

---

## S5 — Route group + layout + pages 🟡 Medium

### Why
Wires all the shell components into the actual Next.js routing layer. Needs judgment for the `(app)/layout.tsx` auth guard (server-side session check), the desktop-only gate (client-side media query), and `ThemeProvider` placement in the root layout.

### Recommended model
**Claude Sonnet 4.6 in Claude Code.**

### Prompt to paste

> Continue Task 04 in the FundedEdge monorepo. S4 is complete.
>
> Read first:
> 1. `docs/tasks/04-app-shell.md` § "Files to create" (app section) and the desktop check note
> 2. `apps/web/src/app/layout.tsx` — the root layout (currently does not have ThemeProvider)
> 3. `apps/web/src/lib/supabase/server.ts` — for the server-side session read
> 4. `apps/web/src/middleware.ts` — already protects `/app/*`; the layout adds belt-and-suspenders
>
> **Goal 1 — Update `apps/web/src/app/layout.tsx` (root layout):**
>
> Import `ThemeProvider` from `@fundededge/ui`. Wrap the `<body>` children with `<ThemeProvider defaultTheme="dark" attribute="class">`. Keep everything else the same (PostHogProvider, PostHogPageView, Suspense). ThemeProvider must be inside `<body>`, outside PostHogProvider (order: ThemeProvider → PostHogProvider → children).
>
> **Goal 2 — `apps/web/src/app/(app)/layout.tsx`:**
>
> Server Component. It should:
> 1. Call `createServerClient()` from `@/lib/supabase/server` and `.auth.getUser()`
> 2. If `user` is null or there's an error: `redirect('/login')` (import from `next/navigation`)
> 3. Return a layout that renders `<TopBar />` above `{children}` in a `flex flex-col h-screen` container
>
> Do not try to read the density preference server-side — it lives in localStorage and is applied client-side by `density-toggle.tsx`.
>
> **Goal 3 — `apps/web/src/app/(app)/page.tsx`:**
>
> Client component (`"use client"`). Uses `useMediaQuery` — install `@custom-react-hooks/use-media-query` if a media query hook is not already available, or implement a simple one inline:
>
> ```ts
> function useMediaQuery(query: string) {
>   const [matches, setMatches] = React.useState(false)
>   React.useEffect(() => {
>     const mq = window.matchMedia(query)
>     setMatches(mq.matches)
>     const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
>     mq.addEventListener('change', handler)
>     return () => mq.removeEventListener('change', handler)
>   }, [query])
>   return matches
> }
> ```
>
> Render: `isDesktop ? <Cockpit /> : <DesktopOnlyNotice />`.
>
> During SSR/initial render before the effect fires, render `<Cockpit />` (assume desktop) to avoid layout shift on real desktops.
>
> **Goal 4 — `apps/web/src/app/(app)/settings/page.tsx`:**
>
> RSC stub: `<main className="p-8"><h1 className="text-2xl font-semibold">Settings</h1><p className="mt-2 text-[--color-text-secondary]">Coming soon.</p></main>`
>
> **Goal 5 — Delete `apps/web/src/app/app/page.tsx`:**
>
> This file creates a conflicting `/app` route alongside the `(app)` route group. Delete it.
>
> **Verify before reporting done:**
> ```bash
> pnpm --filter @fundededge/web typecheck
> pnpm --filter @fundededge/web dev
> ```
> Then manually verify:
> 1. Visiting `http://localhost:3000/app` without a session → redirects to `/login` ✓
> 2. Logged in → cockpit shell renders with top bar + three panels ✓
> 3. Shrink browser to 800px wide → "built for desktop" notice shows ✓
> 4. `html` element has `class="dark"` attribute ✓
> 5. `/app/settings` renders the stub settings page ✓
>
> Report results of all five checks.

### Verify
All five manual checks pass.

### Common failures
- **`apps/web/src/app/app/page.tsx` still exists** — if both `app/app/page.tsx` and `app/(app)/page.tsx` exist, Next.js will throw a build error about conflicting `/app` routes. Delete the old one.
- **ThemeProvider hydration warning** — if you see "Expected server HTML to contain a matching `<html>`", ensure `suppressHydrationWarning` is on the `<html>` tag in root `layout.tsx`. Add it.
- **`redirect` import** — must come from `next/navigation`, not `next/router`.

### Handoff to S6 and S7
> S5 done. Route group wired, cockpit renders end-to-end. S6 (Storybook stories) and S7 (Playwright E2E) can now run in parallel.

---

## S6 — Storybook stories 🟢 Light

### Why
Pure mechanical work — render each component in its key states. A local model can follow the existing story pattern from `apps/web/src/components/auth/login-form.stories.tsx`.

### Recommended model
`qwen2.5-coder:14b` (Ollama) or `deepseek-coder-v2:16b`. Follow the pattern exactly.

### Prompt to paste

> Working in the FundedEdge monorepo. S5 is complete. Create Storybook stories for the shell components.
>
> Look at `apps/web/src/components/auth/login-form.stories.tsx` for the story format to follow.
>
> Create these files in `apps/web/src/components/shell/`:
>
> 1. **`cockpit.stories.tsx`** — one story: `Default`. Render `<Cockpit />` inside a full-height `div`. Note: Cockpit is `"use client"` and uses Zustand — wrap it in `<div style={{ height: '100vh' }}>`.
>
> 2. **`top-bar.stories.tsx`** — one story: `Default`. Render `<TopBar />`.
>
> 3. **`left-panel.stories.tsx`** — two stories: `Expanded` (default) and `Collapsed`. For Collapsed, you need to stub the Zustand store — just wrap with a mock that sets `leftCollapsed: true`.
>
> 4. **`right-panel.stories.tsx`** — two stories: `Expanded` and `Collapsed`. Similar approach.
>
> 5. **`user-menu.stories.tsx`** — one story: `Default`. Note: `UserMenu` calls Supabase `getUser()` — provide a decorator that mocks the Supabase browser client or renders the component with `userId="test@example.com"` hardcoded (whichever is simpler).
>
> 6. **`desktop-only-notice.stories.tsx`** — one story: `Default`. Simple — just render `<DesktopOnlyNotice />`.
>
> 7. **`theme-toggle.stories.tsx`** — three stories: `SystemTheme`, `LightTheme`, `DarkTheme`. Wrap each in a decorator that applies `data-theme` to the story container.
>
> For each story file, add a `parameters.backgrounds` config with both dark (`#0a0b0d`) and light (`#ffffff`) options. Default to dark.
>
> **Verify before reporting done:**
> ```bash
> pnpm --filter @fundededge/web storybook:build
> ```
> Must complete with zero errors. Do not launch the Storybook server — just build.

### Verify
```bash
pnpm --filter @fundededge/web storybook:build
```
Build completes without errors.

### Common failures
- **Zustand store not available in Storybook** — Storybook runs outside Next.js; any `useUiStore()` calls need the store initialized. Either wrap stories in a provider that initializes the store, or mock the hook using `vi.mock` in the story file.
- **Model invented extra stories** — delete them and re-run the build.

### Handoff to S8
> S6 done. Storybook build passes. Move to S8 when S7 is also complete.

---

## S7 — Playwright E2E tests 🔴 Heavy

### Why
Four behavioral guarantees need regression protection: panel resize + persist, panel collapse + expand, theme toggle + persist across reload, desktop-only notice. These span multiple components, involve `localStorage`, and have timing subtleties — non-trivial to get right without flakiness. **Heavy tier mandatory.**

### Recommended model
**Claude Sonnet 4.6 minimum. Opus 4.7** if you want confidence on the resize/drag mechanics.

### Prompt to paste

> Continue Task 04 in the FundedEdge monorepo. S5 is complete.
>
> **Read first:**
> 1. Any existing Playwright config at `apps/web/playwright.config.ts`
> 2. Any existing E2E tests in `apps/web/e2e/` — follow the auth/login patterns for how to create a logged-in session
>
> **Goal:** Create `apps/web/e2e/shell/cockpit.spec.ts` with four test groups.
>
> **Login helper:** If there's an existing `loginAs(page, email, password)` helper in the E2E suite, use it. If not, write a `beforeEach` that navigates to `/login`, fills the email/password form with a test account (`test+cockpit@example.com`), and submits. The account itself doesn't need to exist in a real DB for tests that don't need auth — use `page.route()` to intercept Supabase auth calls and return a mocked session if needed.
>
> **Test 1 — Panel resize + localStorage persist:**
> ```ts
> test('left panel resize persists across page reload', async ({ page }) => {
>   await loginAs(page)
>   await page.goto('/app')
>   // find the left resize handle (react-resizable-panels adds data-panel-resize-handle-id)
>   const handle = page.locator('[data-panel-resize-handle-id]').first()
>   const box = await handle.boundingBox()
>   // drag handle 80px to the right
>   await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
>   await page.mouse.down()
>   await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2)
>   await page.mouse.up()
>   const widthBefore = await page.locator('[data-panel-id="left"]').evaluate(el => el.getBoundingClientRect().width)
>   await page.reload()
>   const widthAfter = await page.locator('[data-panel-id="left"]').evaluate(el => el.getBoundingClientRect().width)
>   expect(widthAfter).toBeGreaterThan(300) // default is ~320px-ish; we made it wider
> })
> ```
>
> Adjust the selector to match the actual `data-panel` attribute that `react-resizable-panels` outputs — check the DOM in the dev server and use whatever attribute uniquely identifies each panel.
>
> **Test 2 — Left panel collapse + expand:**
> ```ts
> test('left panel collapses to icon rail and expands', async ({ page }) => {
>   await loginAs(page)
>   await page.goto('/app')
>   const collapseBtn = page.getByRole('button', { name: /collapse left panel/i })
>   await collapseBtn.click()
>   // panel should be ~60px (the icon rail width)
>   const collapsed = await page.locator('<left panel selector>').evaluate(el => el.getBoundingClientRect().width)
>   expect(collapsed).toBeLessThan(80)
>   const expandBtn = page.getByRole('button', { name: /expand left panel/i })
>   await expandBtn.click()
>   const expanded = await page.locator('<left panel selector>').evaluate(el => el.getBoundingClientRect().width)
>   expect(expanded).toBeGreaterThan(200)
> })
> ```
>
> **Test 3 — Theme toggle persists across reload:**
> ```ts
> test('theme toggle switches to light and persists', async ({ page }) => {
>   await loginAs(page)
>   await page.goto('/app')
>   // default is dark
>   await expect(page.locator('html')).toHaveClass(/dark/)
>   // open user menu, click theme toggle
>   await page.getByRole('button', { name: /user menu|avatar/i }).click()
>   await page.getByRole('button', { name: /switch to light/i }).click()
>   await expect(page.locator('html')).toHaveClass(/light/)
>   await page.reload()
>   await expect(page.locator('html')).toHaveClass(/light/)
> })
> ```
>
> **Test 4 — Desktop-only notice below 1024px:**
> ```ts
> test('shows desktop-only notice on narrow viewport', async ({ page }) => {
>   await page.setViewportSize({ width: 800, height: 600 })
>   await loginAs(page)
>   await page.goto('/app')
>   await expect(page.getByText(/built for desktop trading/i)).toBeVisible()
>   // cockpit panels should not be visible
>   await expect(page.locator('[data-panel-group]')).not.toBeVisible()
> })
> ```
>
> Use `toBeVisible()` over `toBeInViewport()` for reliability.
>
> **Add the test to turbo / CI:** check `apps/web/package.json` for the existing `"test:e2e"` script and confirm it would pick up the new file automatically (it should, since Playwright collects all `*.spec.ts` files).
>
> **Verify before reporting done:**
> ```bash
> pnpm --filter @fundededge/web test:e2e --grep="cockpit"
> ```
> All four tests pass. Report the pass/fail count and any flakiness observed.

### Verify
All four Playwright tests pass. No flakiness on three consecutive runs.

### Common failures
- **Resize handle selector wrong** — `react-resizable-panels` v2 uses `data-resize-handle-id` (not `data-panel-resize-handle-id` from v1). Inspect the rendered DOM and match the actual attribute.
- **Theme test fails because `html` has `class="dark"` literally vs in a class list** — use `.toHaveClass(/dark/)` (regex) not `.toHaveClass('dark')` (exact) to match Next.js `attribute="class"` output.
- **Test 4 flaky because the mediaQuery effect fires after the assertion** — add `await page.waitForSelector('[text*="built for desktop"]')` before the expect.

### Handoff to S8
> S7 done. All four Playwright tests passing. Move to S8 when S6 is also complete.

---

## S8 — Lighthouse CI + registry update 🟡 Medium

### Why
The acceptance criteria include Lighthouse a11y = 100 and performance ≥ 95 on the empty shell. Without CI enforcement, these regressions are invisible. Medium tier — LHCI config is mechanical but the `assert` thresholds need care.

### Recommended model
**Claude Sonnet 4.6 in Claude Code.**

### Prompt to paste

> Continue Task 04 in the FundedEdge monorepo. S6 and S7 are both complete.
>
> **Goal 1 — Wire up Lighthouse CI.**
>
> 1. Add `@lhci/cli` as a dev dep in `apps/web`: `pnpm add -D @lhci/cli --filter @fundededge/web`
>
> 2. Create `apps/web/lighthouserc.js`:
> ```js
> module.exports = {
>   ci: {
>     collect: {
>       url: ['http://localhost:3000/app'],
>       startServerCommand: 'pnpm --filter @fundededge/web start',
>       startServerReadyPattern: 'ready',
>       numberOfRuns: 3,
>     },
>     assert: {
>       assertions: {
>         'categories:accessibility': ['error', { minScore: 1.0 }],
>         'categories:performance': ['error', { minScore: 0.95 }],
>       },
>     },
>     upload: {
>       target: 'temporary-public-storage',
>     },
>   },
> }
> ```
>
> 3. Create `.github/workflows/lighthouse.yml`:
> - Trigger: `on: pull_request` with path filter `apps/web/src/**`
> - Steps: checkout, pnpm setup (follow existing workflow pattern from `.github/workflows/`), `pnpm --filter @fundededge/web build`, then `pnpm exec lhci autorun --config=apps/web/lighthouserc.js`
> - Timeout: 10 minutes
> - The workflow needs a Supabase connection for the `/app` route to render (it redirects unauthenticated users). Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as env vars in the job, sourced from GitHub Actions secrets (`${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}`).
>
> **Goal 2 — Final verification.**
>
> Run:
> ```bash
> pnpm --filter @fundededge/web typecheck
> pnpm --filter @fundededge/ui typecheck
> pnpm biome lint apps/web/src/components/shell/
> ```
> All must pass. Fix any Biome lint findings (do NOT disable rules — fix the code).
>
> **Goal 3 — Registry update.**
>
> Update `CLAUDE.md` component registry: Task 04 status → 🟢 Done.
>
> **Report done** with:
> - Typecheck status for both packages
> - Biome lint status
> - Path to the new `lighthouse.yml` workflow
> - Confirmation that CLAUDE.md is updated

### Verify
```bash
pnpm --filter @fundededge/web typecheck
pnpm --filter @fundededge/ui typecheck
grep "04.*Done" CLAUDE.md
```
Both typechecks pass. CLAUDE.md shows 🟢 Done for component 04.

### Common failures
- **LHCI fails because `/app` redirects to `/login`** — Lighthouse can't log in. Solutions: (a) provide a static page that doesn't require auth for the Lighthouse run, or (b) configure LHCI to `collect` against `/login` or a public marketing page instead, and add `/app` as a separate authenticated run. For now, testing `/login` (which has no auth requirement) for a11y/performance is acceptable as a proxy — note this in a TODO comment in `lighthouserc.js`.
- **Biome complains about `aria-label` having redundant role description** — fix the label text, don't suppress the rule.

### Task 04 complete ✅
Update `CLAUDE.md` registry one final time if S8 missed it.

---

## 4. Quality gates between sessions

Don't move from session N to session N+1 until:

1. The verify step for N passes
2. The session's output is committed to git on a branch
3. If the session opened a PR, it is merged OR the next session continues on the same branch
4. The status table below has N marked 🟢

---

## 5. Failure recovery

If a session goes sideways (model made a mess, build broke, etc.):

1. **Don't merge anything.** Close the PR, delete the branch.
2. Run `git status` and `git stash` any work-in-progress.
3. Restart the session with the same prompt — be explicit about what went wrong last time: "Last attempt did X which was wrong because Y. Try again without doing X."
4. If two attempts fail, **escalate the tier**: light → medium → heavy.

---

## 6. Session status

Update this table as each session completes.

| # | Session | Status | PR | Notes |
|---|---------|--------|----|-------|
| S0 | Install deps + scaffold stubs | 🟢 Done | #62 | zustand, next-themes, react-resizable-panels, Radix deps; 21 stub files; both typechecks pass |
| S1 | Design tokens + globals | 🟢 Done | #63 | 40 color vars, dark/light themes, compact density, .glass, focus ring, reduced-motion |
| S2 | Zustand stores | 🟢 Done | #67 | useUiStore with persist + skipHydration; useUi() hook; theme.ts documents next-themes |
| S3 | `packages/ui` new components | 🟢 Done | #69 | Resizable, Tabs, Popover (.glass), DropdownMenu (.glass), Avatar, ThemeProvider — all exported from index.ts |
| S4 | Shell components | 🟢 Done | #71 | All 10 components: cockpit (imperative refs + rehydration), panels (collapse/expand), top-bar, user-menu, theme/density toggles, tabs, desktop-only notice |
| S5 | Route group + layout + pages | 🟢 Done | #72 | ThemeProvider in root layout; app/app/layout.tsx auth guard (force-dynamic); cockpit page with useMediaQuery; settings stub |
| S6 | Storybook stories | 🟢 Done | #73 | 7 story files; user-menu/top-bar refactored to take signOutAction as prop (RSC→client DI); storybook:build passes |
| S7 | Playwright E2E | 🟢 Done | #74 | 4 cockpit tests (resize/collapse/theme/desktop-gate) gated behind FULL_AUTH_TESTS; 21 pass / 8 skip in CI; fixed 2 latent flows.spec.ts bugs |
| S8 | Lighthouse CI + registry update | 🔴 Not started | — | |

---

## 7. Future-proofing notes

- **Panel `data-panel-id` attributes** — `react-resizable-panels` v2 changed several attribute names from v1. If upgrading the package, re-check the Playwright selectors in S7.
- **ThemeProvider + next-themes** — when next-themes releases a major version, verify the `attribute="class"` behavior hasn't changed (some versions use `data-theme` instead of class). Tailwind v4 expects class-based dark mode by default; keep them in sync.
- **If S4 is too large** — split it: do cockpit + panel layout first (S4a), then user-menu + toggles in S4b. The Heavy rating stands for both halves.
- **Lighthouse a11y target of 100** — this is strict. Radix UI components ship with correct ARIA by default, but any custom icon button without an `aria-label` will knock the score down. S4's prompt flags this explicitly; if the score misses after S8, the fix is usually a missing `aria-label` on a collapse/expand button.
