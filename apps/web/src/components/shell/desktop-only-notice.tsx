export default function DesktopOnlyNotice() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-2xl font-semibold text-[--color-text-primary]">
        FundedEdge is built for desktop trading.
      </p>
      <p className="text-sm text-[--color-text-secondary]">
        Please open this on a screen wider than 1024px.
      </p>
    </div>
  )
}
