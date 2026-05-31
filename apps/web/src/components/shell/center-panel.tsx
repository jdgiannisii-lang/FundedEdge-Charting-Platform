import type * as React from 'react'

interface CenterPanelProps {
  children?: React.ReactNode
}

export default function CenterPanel({ children }: CenterPanelProps) {
  return (
    <div className="flex h-full flex-col flex-1 overflow-hidden">
      {children}
    </div>
  )
}
