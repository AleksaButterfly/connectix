import { forwardRef, useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { Icon } from './Icon'

export interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: string
  rightIcon?: string
  showPasswordToggle?: boolean
  optional?: boolean
  labelAction?: React.ReactNode
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ 
    className, 
    label, 
    error, 
    hint, 
    type = 'text', 
    leftIcon,
    rightIcon,
    showPasswordToggle = false,
    optional = false,
    labelAction,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false)
    const inputType = showPasswordToggle && type === 'password' 
      ? (showPassword ? 'text' : 'password')
      : type

    return (
      <div className="space-y-2">
        {label && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              {label}
              {optional && <span className="ml-1 text-foreground-muted">(optional)</span>}
            </label>
            {labelAction}
          </div>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted">
              <Icon name={leftIcon} size="sm" />
            </div>
          )}
          
          <input
            type={inputType}
            className={cn(
              'w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder-foreground-muted transition-all',
              'focus:border-terminal-green focus:outline-none focus:ring-2 focus:ring-terminal-green/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
              leftIcon && 'pl-10',
              (rightIcon || showPasswordToggle) && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />
          
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground"
            >
              <Icon name={showPassword ? 'eyeOff' : 'eye'} size="sm" />
            </button>
          )}
          
          {rightIcon && !showPasswordToggle && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted">
              <Icon name={rightIcon} size="sm" />
            </div>
          )}
        </div>
        
        {hint && !error && (
          <p className="text-xs text-foreground-muted">{hint}</p>
        )}
        
        {error && (
          <p className="flex items-center gap-2 text-xs text-red-500">
            <Icon name="exclamation" size="sm" />
            <span>{error}</span>
          </p>
        )}
      </div>
    )
  }
)

FormInput.displayName = 'FormInput'

export { FormInput }
export default FormInput
