'use client'

import { useUiStore } from '@/stores/ui'

function ComfortableIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="3" width="14" height="2.5" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="1" y="7.5" width="14" height="2.5" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="1" y="12" width="14" height="2.5" rx="1" fill="currentColor" opacity="0.8" />
    </svg>
  )
}

function CompactIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1" y="2" width="14" height="2" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="1" y="5.5" width="14" height="2" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="1" y="9" width="14" height="2" rx="1" fill="currentColor" opacity="0.8" />
      <rect x="1" y="12.5" width="14" height="2" rx="1" fill="currentColor" opacity="0.8" />
    </svg>
  )
}

export default function DensityToggle() {
  const { density, setDensity } = useUiStore()
  const isCompact = density === 'compact'

  function toggle() {
    const next = isCompact ? 'comfortable' : 'compact'
    setDensity(next)
    if (typeof document !== 'undefined') {
      if (next === 'compact') {
        document.documentElement.dataset.density = 'compact'
      } else {
        delete document.documentElement.dataset.density
      }
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isCompact ? 'Switch to comfortable density' : 'Switch to compact density'}
      className="flex items-center gap-2 text-sm text-[--color-text-primary] w-full"
    >
      {isCompact ? <CompactIcon /> : <ComfortableIcon />}
      <span className="capitalize">{density} density</span>
    </button>
  )
}
