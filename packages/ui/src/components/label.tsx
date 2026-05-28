import type * as React from 'react'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export function Label({ children, className, required, htmlFor, ...props }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={['block text-sm font-medium text-slate-300', className ?? ''].join(' ')}
      {...props}
    >
      {children}
      {required && <span className="ml-1 text-red-400" aria-hidden="true">*</span>}
    </label>
  )
}
