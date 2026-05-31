'use client'

import { useEffect, useRef } from 'react'
import type { ImperativePanelHandle } from '@fundededge/ui'
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@fundededge/ui'
import { useUiStore } from '@/stores/ui'
import LeftPanel from './left-panel'
import CenterPanel from './center-panel'
import RightPanel from './right-panel'

export default function Cockpit() {
  const {
    leftPanelSize,
    rightPanelSize,
    leftCollapsed,
    rightCollapsed,
    setLeftPanelSize,
    setRightPanelSize,
    setLeftCollapsed,
    setRightCollapsed,
  } = useUiStore()

  const leftPanelRef = useRef<ImperativePanelHandle>(null)
  const rightPanelRef = useRef<ImperativePanelHandle>(null)

  // Load persisted sizes from localStorage after hydration
  useEffect(() => {
    useUiStore.persist.rehydrate()
  }, [])

  function handleToggleLeft() {
    if (leftCollapsed) {
      leftPanelRef.current?.expand()
    } else {
      leftPanelRef.current?.collapse()
    }
  }

  function handleToggleRight() {
    if (rightCollapsed) {
      rightPanelRef.current?.expand()
    } else {
      rightPanelRef.current?.collapse()
    }
  }

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-[calc(100vh-3.5rem)]"
    >
      <ResizablePanel
        ref={leftPanelRef}
        defaultSize={leftPanelSize ?? 22}
        minSize={18}
        maxSize={32}
        collapsible
        collapsedSize={4}
        onResize={setLeftPanelSize}
        onCollapse={() => setLeftCollapsed(true)}
        onExpand={() => setLeftCollapsed(false)}
      >
        <LeftPanel onToggle={handleToggleLeft} />
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel defaultSize={56}>
        <CenterPanel />
      </ResizablePanel>

      <ResizableHandle />

      <ResizablePanel
        ref={rightPanelRef}
        defaultSize={rightPanelSize ?? 22}
        minSize={20}
        maxSize={36}
        collapsible
        collapsedSize={4}
        onResize={setRightPanelSize}
        onCollapse={() => setRightCollapsed(true)}
        onExpand={() => setRightCollapsed(false)}
      >
        <RightPanel onToggle={handleToggleRight} />
      </ResizablePanel>
    </ResizablePanelGroup>
  )
}
