export interface AvatarProps {
  name?: string
  src?: string
  size?: 'sm' | 'md'
  className?: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const dimension = size === 'sm' ? 28 : 36
  const fontSize = size === 'sm' ? 11 : 13

  const base = [
    'inline-flex items-center justify-center rounded-full overflow-hidden',
    'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]',
    'font-medium select-none shrink-0',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (src) {
    return (
      <img
        src={src}
        alt={name ?? 'Avatar'}
        width={dimension}
        height={dimension}
        className={base}
        style={{ width: dimension, height: dimension }}
      />
    )
  }

  return (
    <span
      className={base}
      style={{ width: dimension, height: dimension, fontSize }}
      aria-label={name ?? 'User avatar'}
    >
      {name ? getInitials(name) : '?'}
    </span>
  )
}
