# Design Standards

> Note: detailed visual identity (colors, logo, typography) will be provided by the founder. This file documents the structural design rules that don't depend on brand specifics.

## Visual direction

**Reference points:** Stripe Dashboard (precision, clarity, density done well) + Apple-style materials (subtle glass, soft depth, generous spacing). The result should feel like a 2026 product, not a 2018 SaaS.

**What we are:** modern, premium, focused, calm.
**What we are not:** Bloomberg-dense, gamified, Robinhood-cute, generic-fintech.

## Themes

Both light and dark mode are first-class. **Dark is the default** because traders use this app for hours and dark is easier on eyes. Theme is a user preference, persists per-user.

Tokens defined in `packages/ui/src/tokens/` and imported into Tailwind config. Brand colors will fill the placeholders below.

```css
/* dark theme placeholders — replace with brand */
--color-bg-primary: #0a0b0d
--color-bg-elevated: rgba(255, 255, 255, 0.04)
--color-bg-glass: rgba(255, 255, 255, 0.06)
--color-border-subtle: rgba(255, 255, 255, 0.08)
--color-text-primary: #f5f5f7
--color-text-secondary: #a1a1aa
--color-text-tertiary: #71717a

--color-success: #10b981
--color-warning: #f59e0b
--color-danger: #ef4444
--color-info: #3b82f6

/* trader-specific */
--color-bull: #22c55e
--color-bear: #ef4444
--color-neutral: #71717a
```

## Layout

### Cockpit

Three-panel layout, all panels resizable, all panels collapsible.

- **Left panel:** Prop dashboard. Default 320px, min 280px, max 480px, collapsible to 60px (icon rail).
- **Center panel:** Chart. Flex-1 to fill remaining space. Never collapsible.
- **Right panel:** Tabbed context. Default 360px, min 320px, max 540px, collapsible to 60px.

Panels separated by 1px border with subtle hover affordance for the resize handle. Resizing persists.

### Density

Two density modes via user preference:
- **Comfortable** (default) — generous padding, larger touch targets, easier to scan
- **Compact** — tighter spacing, smaller font, more data on screen — for power users

Components react to `data-density` attribute on the root element. CSS variables shift padding/font tokens.

### Glass effects

Used sparingly:
- Floating panels (modals, popovers, command palette) get backdrop-blur + semi-transparent fill
- Side panels get a subtle gradient fill, no backdrop blur (performance)
- Cards inside panels are flat — not every surface needs glass

## Typography

- **Display/headings:** Inter (or whatever brand specifies). Tight letter-spacing, semibold.
- **Body:** Inter. Regular weight.
- **Numerics:** JetBrains Mono or Geist Mono. Tabular figures (`font-feature-settings: "tnum"`) on every P&L, balance, price.

Scale (rem, base 16px):

| Token | Size | Usage |
|---|---|---|
| `text-xs` | 0.75 | helpers, captions |
| `text-sm` | 0.875 | body small |
| `text-base` | 1.0 | body |
| `text-lg` | 1.125 | small headings |
| `text-xl` | 1.25 | section headings |
| `text-2xl` | 1.5 | page headings |
| `text-3xl` | 1.875 | display |

## Motion

- **Durations:** 150ms (micro), 250ms (transitions), 400ms (entry/exit)
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (standard), `cubic-bezier(0.16, 1, 0.3, 1)` (entry), `cubic-bezier(0.7, 0, 0.84, 0)` (exit)
- **Reduced motion:** every animation has a `@media (prefers-reduced-motion)` fallback
- **No bouncy springs** in numeric displays — distracting for traders
- **Micro-interactions:** scale on press (0.96), color shift on hover, focus ring on tab

## Component primitives

All from shadcn/ui in `packages/ui/`. We don't build custom primitives without an ADR. Customizations go through Tailwind variants.

## Accessibility

- **Color is never the only signal.** A status pill always has both color and icon/text.
- **Focus rings** use `outline-2 outline-offset-2 outline-[--color-info]` and are always visible on tab.
- **Keyboard shortcuts** for everything important — listed in a `?` overlay (Linear-style).
- **ARIA live regions** for dashboard alerts so screen readers announce rule warnings.

## Empty states

Every empty state has:
- An illustration or relevant icon (not stock)
- A one-sentence explanation
- A clear primary action ("Create your first account")
- No mocked-up fake data

## Error states

- Inline errors at the source of the problem
- Toast for global errors
- Full-page error boundary as a last resort
- Always include a retry path
