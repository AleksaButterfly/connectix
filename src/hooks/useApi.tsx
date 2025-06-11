'use client'

import { useState, useCallback } from 'react'
import { apiCall } from '@/lib/api/client'
import { useToast } from '@/components/ui'

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  showSuccessToast?: boolean
  showErrorToast?: boolean
  successMessage?: string
}

interface UseApiReturn<T> {
  data: T | null
  loading: boolean
  error: Error | null
  execute: (url: string, options?: RequestInit) => Promise<T | null>
  reset: () => void
}

export const useApi = <T = any>(options: UseApiOptions<T> = {}): UseApiReturn<T> => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  const execute = useCallback(async (url: string, requestOptions?: RequestInit): Promise<T | null> => {
    setLoading(true)
    setError(null)

    try {
      const result = await apiCall<T>(url, requestOptions)
      setData(result)
      
      if (options.onSuccess) {
        options.onSuccess(result)
      }
      
      if (options.showSuccessToast && options.successMessage) {
        toast.success(options.successMessage)
      }
      
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An unexpected error occurred')
      setError(error)
      
      if (options.onError) {
        options.onError(error)
      }
      
      if (options.showErrorToast) {
        toast.error(error.message)
      }
      
      return null
    } finally {
      setLoading(false)
    }
  }, [options, toast])

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