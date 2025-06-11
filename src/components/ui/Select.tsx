'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'
import { Icon } from './Icon'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[]
  placeholder?: string
  error?: boolean
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, error, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            'w-full rounded-lg border border-border bg-background px-4 py-3 pr-10 text-sm text-foreground transition-all',
            'focus:border-terminal-green focus:outline-none focus:ring-2 focus:ring-terminal-green/20',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          ref={ref}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
          <Icon name="chevronDown" size="sm" />
        </div>
      </div>
    )
  }
)

Select.displayName = 'Select'

export { Select }