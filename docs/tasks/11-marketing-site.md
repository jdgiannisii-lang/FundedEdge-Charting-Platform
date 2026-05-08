# Task 11: Marketing Site

## Goal
A simple, premium landing page at the root of `apps/marketing` that converts ICT prop traders into beta signups. Hero, features, social proof (later), pricing (later), FAQ, footer.

## Dependencies
- Task 01

## Acceptance criteria

- [ ] Hero with headline, subheadline, CTA, hero visual (chart screenshot or animated demo)
- [ ] Three-feature grid (rules engine, chart, journal)
- [ ] How-it-works section
- [ ] Pricing section (placeholder until decided)
- [ ] FAQ
- [ ] Footer with legal links
- [ ] Open Graph meta + Twitter Card meta
- [ ] Lighthouse 100/100/100/100 (perf, a11y, best practices, SEO)
- [ ] Sitemap.xml + robots.txt
- [ ] Analytics: PostHog tracks page views and CTA clicks

## Files to create

```
apps/marketing/src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── pricing/page.tsx
│   ├── faq/page.tsx
│   ├── privacy/page.tsx
│   ├── terms/page.tsx
│   ├── opengraph-image.tsx
│   └── globals.css
├── components/
│   ├── hero.tsx
│   ├── features.tsx
│   ├── how-it-works.tsx
│   ├── pricing.tsx
│   ├── faq.tsx
│   ├── footer.tsx
│   ├── nav.tsx
│   └── cta-button.tsx
├── lib/
│   └── analytics.ts
└── content/
    ├── features.ts
    └── faq.ts
```

## Implementation notes

### Hero copy direction (founder will refine)

> **Stay funded.**
>
> The trading cockpit built for ICT futures traders running prop firm capital. Live rule tracking, instant breach alerts, ICT-grade charts. One window. No surprises.
>
> [ Start your free beta ]   [ See it in action ]

### Pricing placeholder

Three columns until pricing is decided:
- Free Beta — full access during beta
- TBD
- TBD

### FAQ seed

- "What prop firms does FundedEdge support?" → Apex, TPT, Tradeify, Lucid presets, plus custom rules.
- "Will it execute trades?" → No. We integrate read-only with brokers in v2 to track P&L.
- "Is it just a TradingView clone?" → No. Charting is one piece. The rules engine is the differentiator.
- "Will it work for non-prop traders?" → Eventually yes; v1 is optimized for prop.
- "What about ICT-specific tooling?" → On the roadmap. Custom FVG/order-block detection in v1.x.

## Testing requirements
- Playwright: smoke test confirms landing renders
- Lighthouse CI: all four metrics 100

## Definition of done
- [ ] All acceptance criteria checked
- [ ] Founder-approved copy and visuals
- [ ] CLAUDE.md component registry updated: 11 → 🟢 Done
