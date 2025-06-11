'use client'

import { cn } from '@/lib/utils/cn'

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
  variant?: 'spinner' | 'dots' | 'pulse'
}

const LoadingSpinner = ({ 
  size = 'md', 
  className, 
  text,
  variant = 'spinner' 
}: LoadingSpinnerProps) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }

  const renderSpinner = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  'rounded-full bg-current animate-pulse',
                  size === 'sm' ? 'h-1 w-1' : size === 'md' ? 'h-2 w-2' : 'h-3 w-3'
                )}
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        )
      
      case 'pulse':
        return (
          <div 
            className={cn(
              'rounded-full bg-current animate-pulse',
              sizes[size]
            )}
          />
        )
      
      default:
        return (
          <div
            className={cn(
              'animate-spin rounded-full border-2 border-current border-t-transparent',
              sizes[size]
            )}
          />
        )
    }
  }

  return (
    <div className={cn('flex items-center justify-center gap-3', className)}>
      {renderSpinner()}
      {text && (
        <span className={cn('text-foreground-muted', textSizes[size])}>
          {text}
        </span>
      )}
    </div>
  )
}

export { LoadingSpinner }