'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  inputClassName?: string
  label?: string
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, inputClassName, label, id, checked, ...props }, ref) => {
    return (
      <div className="flex items-center">
        <div className={cn('relative', className)}>
          <input
            type="checkbox"
            id={id}
            ref={ref}
            checked={checked}
            className={cn(
              'peer h-4 w-4 shrink-0 rounded border border-border bg-background-tertiary',
              'cursor-pointer appearance-none transition-all',
              'focus:outline-none focus:ring-2 focus:ring-terminal-green/20 focus:ring-offset-2 focus:ring-offset-background',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'checked:border-terminal-green checked:bg-terminal-green',
              inputClassName
            )}
            {...props}
          />
          <svg
            className={cn(
              'pointer-events-none absolute inset-0 h-4 w-4 p-0.5',
              'text-background opacity-0 transition-all duration-200',
              'peer-checked:scale-100 peer-checked:opacity-100',
              checked ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
            )}
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3,8 7,12 13,4" />
          </svg>
        </div>
        {label && (
          <label
            htmlFor={id}
            className="ml-2 cursor-pointer select-none text-sm text-foreground-muted peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
          >
            {label}
          </label>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export default Checkbox
