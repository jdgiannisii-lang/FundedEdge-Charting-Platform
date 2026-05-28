import type * as React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={[
        'rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur',
        className ?? '',
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}
