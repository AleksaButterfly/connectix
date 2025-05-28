import { forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, label, error, hint, type = 'text', ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && <label className="text-sm font-medium text-foreground">{label}</label>}
        <div className="relative">
          <input
            type={type}
            className={cn(
              'w-full rounded-lg border bg-background-tertiary px-4 py-3 text-sm text-foreground placeholder-foreground-subtle transition-all',
              'focus:border-terminal-green focus:outline-none focus:ring-2 focus:ring-terminal-green/20',
              error && 'border-terminal-red focus:border-terminal-red focus:ring-terminal-red/20',
              className
            )}
            ref={ref}
            {...props}
          />
          {type === 'password' && (
            <div className="absolute right-3 top-3 text-xs text-foreground-subtle">
              <span className="font-mono">[hidden]</span>
            </div>
          )}
        </div>
        {hint && !error && <p className="text-xs text-foreground-subtle">{hint}</p>}
        {error && (
          <p className="flex items-center gap-1 text-xs text-terminal-red">
            <span>!</span>
            <span>{error}</span>
          </p>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'

export default FormInput
