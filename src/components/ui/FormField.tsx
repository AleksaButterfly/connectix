'use client'

import { cn } from '@/lib/utils/cn'

export interface FormFieldProps {
  children: React.ReactNode
  label?: string
  error?: string
  hint?: string
  required?: boolean
  optional?: boolean
  labelAction?: React.ReactNode
  className?: string
}

const FormField = ({
  children,
  label,
  error,
  hint,
  required = false,
  optional = false,
  labelAction,
  className
}: FormFieldProps) => {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
            {optional && <span className="ml-1 text-foreground-muted">(optional)</span>}
          </label>
          {labelAction}
        </div>
      )}
      
      {children}
      
      {hint && !error && (
        <p className="text-xs text-foreground-muted">{hint}</p>
      )}
      
      {error && (
        <p className="flex items-center gap-2 text-xs text-red-500">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

export { FormField }