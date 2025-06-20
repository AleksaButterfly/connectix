import { useState, useCallback, useRef } from 'react'
import { useErrorHandler } from '@/lib/utils/error'
import { apiCall } from '@/lib/api/client'

interface UseApiCallOptions {
  showErrorToast?: boolean
  showSuccessToast?: boolean
  successMessage?: string
  retryable?: boolean
  maxRetries?: number
}

interface UseApiCallState<T> {
  isLoading: boolean
  error: unknown
  data: T | null
}

export function useApiCall<T = unknown>(options?: UseApiCallOptions) {
  const [state, setState] = useState<UseApiCallState<T>>({
    isLoading: false,
    error: null,
    data: null
  })
  
  const { handleError } = useErrorHandler()
  
  // Use ref to avoid re-creating execute function when options change
  const optionsRef = useRef(options)
  optionsRef.current = options

  const execute = useCallback(async (
    url: string,
    requestOptions?: RequestInit
  ): Promise<T | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const data = await apiCall<T>(url, requestOptions)
      
      setState(prev => ({ ...prev, data, isLoading: false }))
      
      return data
    } catch (error) {
      const parsedError = handleError(error, {
        showToast: optionsRef.current?.showErrorToast ?? true
      })
      
      setState(prev => ({ 
        ...prev, 
        error: parsedError, 
        isLoading: false 
      }))
      
      return null
    }
  }, [handleError])

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: null
    })
  }, [])

  return {
    ...state,
    execute,
    reset
  }
}

// Specialized hook for file operations
export function useFileApiCall() {
  return useApiCall({
    showErrorToast: true,
    retryable: true,
    maxRetries: 2
  })
}

// Specialized hook for form submissions
export function useFormApiCall() {
  return useApiCall({
    showErrorToast: true,
    showSuccessToast: true,
    retryable: false
  })
}

// Hook for operations that shouldn't show error toasts
export function useSilentApiCall() {
  return useApiCall({
    showErrorToast: false,
    retryable: false
  })
}