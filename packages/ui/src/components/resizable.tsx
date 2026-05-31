'use client'

import {
  PanelGroup as ResizablePanelGroup,
  Panel as ResizablePanel,
  PanelResizeHandle,
} from 'react-resizable-panels'
import type { PanelGroupProps, PanelProps, PanelResizeHandleProps, ImperativePanelHandle } from 'react-resizable-panels'

function ResizableHandle({ className, ...props }: PanelResizeHandleProps) {
  return (
    <PanelResizeHandle
      className={[
        'relative w-px bg-[var(--color-border-subtle)] transition-colors duration-150',
        'hover:bg-[var(--color-border-default)] focus-visible:outline-none',
        'after:absolute after:inset-y-0 after:-left-1 after:-right-1 after:content-[""]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
export type { PanelGroupProps, PanelProps, PanelResizeHandleProps, ImperativePanelHandle }
