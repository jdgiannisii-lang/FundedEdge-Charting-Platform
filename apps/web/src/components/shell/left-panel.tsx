'use client'

import type * as React from 'react'
import { useUiStore } from '@/stores/ui'

interface LeftPanelProps {
  children?: React.ReactNode
  onToggle: () => void
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      {collapsed ? (
        // Chevron right — expand
        <path d="M5 2.5l4 4.5-4 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        // Chevron left — collapse
        <path d="M9 2.5L5 7l4 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )
}

export default function LeftPanel({ children, onToggle }: LeftPanelProps) {
  const leftCollapsed = useUiStore((s) => s.leftCollapsed)

  return (
    <div className="relative flex h-full flex-col bg-[--color-bg-primary] border-r border-[--color-border-subtle]">
      {/* Content area — hidden in icon rail mode */}
      {!leftCollapsed && (
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      )}

      {/* Collapse toggle pinned to right edge */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!leftCollapsed}
        aria-label={leftCollapsed ? 'Expand left panel' : 'Collapse left panel'}
        className={[
          'absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10',
          'flex h-6 w-6 items-center justify-center rounded-full',
          'bg-[--color-bg-elevated] border border-[--color-border-subtle]',
          'text-[--color-text-secondary] hover:text-[--color-text-primary]',
          'hover:bg-[--color-bg-hover] transition-colors duration-150',
          'motion-reduce:transition-none',
          'focus-visible:outline-2 focus-visible:outline-[--color-focus-ring]',
        ].join(' ')}
      >
        <CollapseIcon collapsed={leftCollapsed} />
      </button>
    </div>
  )
}
