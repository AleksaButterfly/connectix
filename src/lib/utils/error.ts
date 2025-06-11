import { useToast } from '@/components/ui'
import { useIntl, type IntlShape } from '@/lib/i18n'

export interface AppError {
  code: string
  message: string
  details?: Record<string, unknown>
  statusCode?: number
}

export class AppErrorClass extends Error implements AppError {
  code: string
  details?: Record<string, unknown>
  statusCode?: number

  constructor(code: string, message: string, details?: Record<string, unknown>, statusCode?: number) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
    this.statusCode = statusCode
  }
}

// Error codes enum for consistency
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
  CONNECTION_REFUSED: 'CONNECTION_REFUSED',
  
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // File operation errors
  FILE_NOT_FOUND: 'FILE_NOT_FOUND',
  FILE_PERMISSION_DENIED: 'FILE_PERMISSION_DENIED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Generic errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  API_ERROR: 'API_ERROR'
} as const

// Parse API errors into a consistent format
export function parseApiError(error: unknown): AppError {
  // If it's already an AppError, return as is
  if (error instanceof AppErrorClass) {
    return error
  }

  // Handle Response object errors
  if (error instanceof Response) {
    return new AppErrorClass(
      ERROR_CODES.API_ERROR,
      `Request failed with status ${error.status}`,
      { status: error.status, statusText: error.statusText },
      error.status
    )
  }

  // Handle fetch errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new AppErrorClass(
      ERROR_CODES.NETWORK_ERROR,
      'Network connection failed. Please check your internet connection.',
      error.message
    )
  }

  // Handle structured API error responses
  if (error && typeof error === 'object') {
    if (error.code && error.message) {
      return new AppErrorClass(
        error.code,
        error.message,
        error.details,
        error.statusCode
      )
    }

    if (error.error) {
      return parseApiError(error.error)
    }

    if (error.message) {
      return new AppErrorClass(
        ERROR_CODES.API_ERROR,
        error.message,
        error
      )
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return new AppErrorClass(
      ERROR_CODES.UNKNOWN_ERROR,
      error
    )
  }

  // Handle native Error objects
  if (error instanceof Error) {
    return new AppErrorClass(
      ERROR_CODES.UNKNOWN_ERROR,
      error.message,
      { stack: error.stack }
    )
  }

  // Fallback for unknown error types
  return new AppErrorClass(
    ERROR_CODES.UNKNOWN_ERROR,
    'An unexpected error occurred',
    error
  )
}

// Get user-friendly error message based on error code
export function getErrorMessage(error: AppError, intl: IntlShape): string {
  const messageKey = `errors.${error.code}`
  
  // Try to get localized message
  const localizedMessage = intl.formatMessage(
    { id: messageKey },
    { defaultMessage: error.message }
  )

  // If localization key doesn't exist, fall back to error message
  return localizedMessage !== messageKey ? localizedMessage : error.message
}

// Hook for standardized error handling
export function useErrorHandler() {
  const { toast } = useToast()
  const intl = useIntl()

  const handleError = (error: unknown, options?: {
    showToast?: boolean
    toastDuration?: number
    fallbackMessage?: string
    onError?: (parsedError: AppError) => void
  }) => {
    const {
      showToast = true,
      toastDuration = 5000,
      fallbackMessage,
      onError
    } = options || {}

    const parsedError = parseApiError(error)
    
    // Log error for debugging
    console.error('Error handled:', parsedError)

    // Show toast notification
    if (showToast) {
      const message = fallbackMessage || getErrorMessage(parsedError, intl)
      toast.error(message, { duration: toastDuration })
    }

    // Call custom error handler
    onError?.(parsedError)

    return parsedError
  }

  return { handleError }
}

// Utility to create a standardized async error handler
export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  options?: {
    fallbackMessage?: string
    showToast?: boolean
    retryable?: boolean
    maxRetries?: number
  }
) {
  const { showToast = true, retryable = false, maxRetries = 3 } = options || {}

  return async (...args: T): Promise<R | null> => {
    let attempts = 0
    let lastError: unknown

    do {
      try {
        return await fn(...args)
      } catch (error) {
        lastError = error
        attempts++

        const parsedError = parseApiError(error)
        
        // Don't retry on certain error types
        if (!retryable || parsedError.statusCode === 401 || parsedError.statusCode === 403) {
          break
        }
        
        // Add delay between retries
        if (attempts < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts))
        }
      }
    } while (attempts < maxRetries)

    // Handle final error
    const parsedError = parseApiError(lastError)
    
    if (showToast) {
      console.error('Operation failed after retries:', parsedError)
    }

    return null
  }
}

// Type-safe error boundaries for specific error types
export function isNetworkError(error: AppError): boolean {
  return [
    ERROR_CODES.NETWORK_ERROR,
    ERROR_CODES.CONNECTION_TIMEOUT,
    ERROR_CODES.CONNECTION_REFUSED
  ].includes(error.code as keyof typeof ERROR_CODES)
}

export function isAuthError(error: AppError): boolean {
  return [
    ERROR_CODES.UNAUTHORIZED,
    ERROR_CODES.FORBIDDEN,
    ERROR_CODES.SESSION_EXPIRED
  ].includes(error.code as keyof typeof ERROR_CODES)
}

export function isFileError(error: AppError): boolean {
  return [
    ERROR_CODES.FILE_NOT_FOUND,
    ERROR_CODES.FILE_PERMISSION_DENIED,
    ERROR_CODES.FILE_TOO_LARGE,
    ERROR_CODES.INVALID_FILE_TYPE
  ].includes(error.code as keyof typeof ERROR_CODES)
}

export function isValidationError(error: AppError): boolean {
  return [
    ERROR_CODES.VALIDATION_ERROR,
    ERROR_CODES.INVALID_INPUT
  ].includes(error.code as keyof typeof ERROR_CODES)
}