import UserMenu from './user-menu'

interface TopBarProps {
  signOutAction: () => void
}

export default function TopBar({ signOutAction }: TopBarProps) {
  return (
    <header
      className="sticky top-0 z-[--z-topbar] flex h-14 items-center border-b border-[--color-border-subtle] bg-[--color-bg-primary] px-4"
    >
      {/* Left — brand wordmark */}
      <div className="flex-1">
        <span className="font-semibold tracking-tight text-[--color-text-primary]">
          FundedEdge
        </span>
      </div>

      {/* Center — symbol / timeframe placeholder */}
      <div className="flex-1 flex justify-center">
        <span className="text-sm text-[--color-text-secondary]">NQ · 5m</span>
      </div>

      {/* Right — user menu */}
      <div className="flex-1 flex justify-end">
        <UserMenu signOutAction={signOutAction} />
      </div>
    </header>
  )
}
