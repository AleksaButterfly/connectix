'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost' | 'link'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  as?: React.ElementType
  href?: string
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    as: Component = 'button',
    ...props
  }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
    
    const variants = {
      primary: 'bg-terminal-green text-terminal-black hover:bg-terminal-green/90 focus-visible:ring-terminal-green',
      secondary: 'bg-background-secondary text-foreground hover:bg-background-secondary/80 focus-visible:ring-background-secondary',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
      outline: 'border border-border bg-transparent hover:bg-background-secondary focus-visible:ring-border',
      ghost: 'hover:bg-background-secondary focus-visible:ring-background-secondary',
      link: 'text-terminal-green underline-offset-4 hover:underline focus-visible:ring-terminal-green'
    }
    
    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-9 px-4 text-sm',
      lg: 'h-10 px-6 text-base'
    }

    return (
      <Component
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : leftIcon}
        {children}
        {!loading && rightIcon}
      </Component>
    )
  }
)

Button.displayName = 'Button'

export { Button }