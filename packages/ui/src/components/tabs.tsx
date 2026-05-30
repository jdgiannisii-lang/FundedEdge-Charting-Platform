'use client'

import * as TabsPrimitive from '@radix-ui/react-tabs'
import type * as React from 'react'

const Tabs = TabsPrimitive.Root

function TabsList({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={[
        'inline-flex items-center rounded-md',
        'bg-[var(--color-bg-elevated)] p-0.5',
        'border border-[var(--color-border-subtle)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={[
        'inline-flex items-center justify-center whitespace-nowrap',
        'rounded px-3 py-1 text-sm font-medium',
        'text-[var(--color-text-secondary)] transition-colors duration-150',
        'hover:text-[var(--color-text-primary)]',
        'data-[state=active]:bg-[var(--color-bg-active)]',
        'data-[state=active]:text-[var(--color-text-primary)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)]',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={['focus-visible:outline-none', className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
