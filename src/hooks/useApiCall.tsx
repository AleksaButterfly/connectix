import { useState, useCallback } from 'react'
import { useErrorHandler } from '@/lib/utils/error'
import { apiCall } from '@/lib/api/client'

interface UseApiCallOptions {
  showErrorToast?: boolean
  showSuccessToast?: boolean
  successMessage?: string
  retryable?: boolean
  maxRetries?: number
}

interface UseApiCallState {
  isLoading: boolean
  error: any
  data: any
}

export function useApiCall<T = any>(options?: UseApiCallOptions) {
  const [state, setState] = useState<UseApiCallState>({
    isLoading: false,
    error: null,
    data: null
  })
  
  const { handleError } = useErrorHandler()

  const execute = useCallback(async (
    url: string,
    requestOptions?: RequestInit
  ): Promise<T | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const data = await apiCall<T>(url, requestOptions)
      
      setState(prev => ({ ...prev, data, isLoading: false }))
      
      // Show success toast if requested
      if (options?.showSuccessToast && options?.successMessage) {
        // Note: We would need to access toast here, but for now we'll skip this
        // The handleError already has toast access
      }
      
      return data
    } catch (error) {
      const parsedError = handleError(error, {
        showToast: options?.showErrorToast ?? true
      })
      
      setState(prev => ({ 
        ...prev, 
        error: parsedError, 
        isLoading: false 
      }))
      
      return null
    }
  }, [handleError, options])

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