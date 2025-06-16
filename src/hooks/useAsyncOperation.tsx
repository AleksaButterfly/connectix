'use client'

import { useState, useCallback } from 'react'

interface UseAsyncOperationOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

interface UseAsyncOperationReturn<T> {
  data: T | null
  loading: boolean
  error: Error | null
  execute: (operation: () => Promise<T>) => Promise<T | null>
  reset: () => void
}

export const useAsyncOperation = <T = unknown>(
  options: UseAsyncOperationOptions<T> = {}
): UseAsyncOperationReturn<T> => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const execute = useCallback(async (operation: () => Promise<T>): Promise<T | null> => {
    setLoading(true)
    setError(null)

    try {
      const result = await operation()
      setData(result)
      
      if (options.onSuccess) {
        options.onSuccess(result)
      }
      
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unexpected error occurred')
      setError(error)
      
      if (options.onError) {
        options.onError(error)
      }
      
      return null
    } finally {
      setLoading(false)
    }
  }, [options])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    execute,
    reset
  }
}