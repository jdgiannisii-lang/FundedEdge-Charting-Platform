# Task 04: App Shell — 3-Panel Cockpit Layout

## Goal
The skeleton of the cockpit. Three-panel responsive layout (left dashboard / center chart / right tabs), light + dark theme, panel collapse/resize, all per the Stripe + Apple-glass design direction. No content yet — this task is about the chrome.

## Out of scope
- Actual prop dashboard content (task 07)
- Actual chart (task 08)
- Actual right-sidebar tab content (tasks 09, 10)

## Dependencies
- Task 01, 03

## Acceptance criteria

- [ ] Logged-in user lands at `/app` and sees the 3-panel cockpit shell
- [ ] Left panel: collapsible to 60px icon rail, resizable 280–480px, default 320px
- [ ] Center panel: flex-1, never collapsible
- [ ] Right panel: collapsible to 60px icon rail, resizable 320–540px, default 360px, with tab navigation (News, Checklist, Journal — empty content)
- [ ] Panel sizes persist per-user (Zustand + localStorage)
- [ ] Dark mode (default) and light mode both polished
- [ ] Theme toggle in user menu
- [ ] User menu (top-right): avatar, email, theme toggle, settings link, logout
- [ ] Top bar: brand mark (left) + symbol/timeframe placeholders + user menu (right)
- [ ] Below 1024px: shell shows a "FundedEdge is desktop-only — please use a larger screen" landing
- [ ] Glass effects on user menu popover, modals; flat surfaces for everything else
- [ ] Density preference (compact/comfortable) wired and respected
- [ ] All animations honor `prefers-reduced-motion`
- [ ] Lighthouse a11y score 100, performance score 95+ on the empty shell

## Files to create

```
apps/web/src/
├── app/
│   └── (app)/
│       ├── layout.tsx
│       ├── page.tsx
│       └── settings/
│           └── page.tsx
├── components/
│   └── shell/
│       ├── cockpit.tsx
│       ├── top-bar.tsx
│       ├── left-panel.tsx
│       ├── center-panel.tsx
│       ├── right-panel.tsx
│       ├── right-panel-tabs.tsx
│       ├── user-menu.tsx
│       ├── theme-toggle.tsx
│       ├── density-toggle.tsx
│       └── desktop-only-notice.tsx
├── stores/
│   ├── ui.ts
│   └── theme.ts
└── styles/
    ├── tokens.css
    └── globals.css

packages/ui/src/
├── components/
│   ├── resizable.tsx
│   ├── tabs.tsx
│   ├── popover.tsx
│   ├── dropdown-menu.tsx
│   ├── avatar.tsx
│   ├── button.tsx
│   └── theme-provider.tsx
└── stories/
    ├── cockpit.stories.tsx
    └── (one story per shell component)
```

## Implementation notes

### Layout uses CSS grid + Resizable from `react-resizable-panels`

```tsx
'use client'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@fundededge/ui'
import { useUi } from '@/stores/ui'

export function Cockpit() {
  const { leftPanelSize, rightPanelSize, setLeftPanelSize, setRightPanelSize } = useUi()
  return (
    <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-3.5rem)]">
      <ResizablePanel
        defaultSize={leftPanelSize ?? 22}
        minSize={18}
        maxSize={32}
        onResize={setLeftPanelSize}
        collapsible
        collapsedSize={4}
      >
        <LeftPanel />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={56}>
        <CenterPanel />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel
        defaultSize={rightPanelSize ?? 22}
        minSize={20}
        maxSize={36}
        onResize={setRightPanelSize}
        collapsible
        collapsedSize={4}
      >
        <RightPanel />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
```

### Theme

Use `next-themes` for light/dark with system option. Tokens in `tokens.css` use CSS variables that change based on `[data-theme]` attribute. shadcn components reference these.

### Glass effect

```css
.glass {
  background: color-mix(in oklch, var(--color-bg-elevated) 80%, transparent);
  backdrop-filter: blur(16px) saturate(140%);
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  border: 1px solid var(--color-border-subtle);
}
```

Applied only to floating elements (popovers, modals, command palette). Side panels are flat.

### Desktop-only check

Server-side via UA sniffing + client-side via `useMediaQuery('(min-width: 1024px)')`. Below threshold, the entire `/app` route shows the landing instead.

## Testing requirements

- Playwright: panels resize and persist
- Playwright: panels collapse and expand
- Playwright: theme toggle persists across reloads
- Playwright: below 1024px shows desktop-only notice
- Storybook visual regression: each panel state in light + dark
- Lighthouse CI: a11y = 100, performance >= 95

## Definition of done

- [ ] All acceptance criteria checked
- [ ] Storybook stories cover every shell state
- [ ] Visual sign-off from founder
- [ ] CLAUDE.md component registry updated: 04 → 🟢 Done
