'use client'

import { useUiStore } from '@/stores/ui'
import RightPanelTabs from './right-panel-tabs'

interface RightPanelProps {
  onToggle: () => void
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      {collapsed ? (
        // Chevron left — expand (right panel expands leftward)
        <path d="M9 2.5L5 7l4 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        // Chevron right — collapse
        <path d="M5 2.5l4 4.5-4 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )
}

export default function RightPanel({ onToggle }: RightPanelProps) {
  const rightCollapsed = useUiStore((s) => s.rightCollapsed)

  return (
    <div className="relative flex h-full flex-col bg-[--color-bg-primary] border-l border-[--color-border-subtle]">
      {/* Content area — hidden in icon rail mode */}
      {!rightCollapsed && (
        <div className="flex-1 overflow-hidden">
          <RightPanelTabs />
        </div>
      )}

      {/* Collapse toggle pinned to left edge */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!rightCollapsed}
        aria-label={rightCollapsed ? 'Expand right panel' : 'Collapse right panel'}
        className={[
          'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10',
          'flex h-6 w-6 items-center justify-center rounded-full',
          'bg-[--color-bg-elevated] border border-[--color-border-subtle]',
          'text-[--color-text-secondary] hover:text-[--color-text-primary]',
          'hover:bg-[--color-bg-hover] transition-colors duration-150',
          'motion-reduce:transition-none',
          'focus-visible:outline-2 focus-visible:outline-[--color-focus-ring]',
        ].join(' ')}
      >
        <CollapseIcon collapsed={rightCollapsed} />
      </button>
    </div>
  )
}
