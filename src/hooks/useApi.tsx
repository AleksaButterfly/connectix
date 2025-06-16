'use client'

import { useState, useCallback, useRef } from 'react'
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

export const useApi = <T = unknown,>(options: UseApiOptions<T> = {}): UseApiReturn<T> => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()

  // Use refs to avoid re-creating the execute function
  const optionsRef = useRef(options)
  optionsRef.current = options

  const execute = useCallback(
    async (url: string, requestOptions?: RequestInit): Promise<T | null> => {
      setLoading(true)
      setError(null)

      try {
        const result = await apiCall<T>(url, requestOptions)
        setData(result)

        if (optionsRef.current.onSuccess) {
          optionsRef.current.onSuccess(result)
        }

        if (optionsRef.current.showSuccessToast && optionsRef.current.successMessage) {
          toast.success(optionsRef.current.successMessage)
        }

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('An unexpected error occurred')
        setError(error)

        if (optionsRef.current.onError) {
          optionsRef.current.onError(error)
        }

        if (optionsRef.current.showErrorToast) {
          toast.error(error.message)
        }

        return null
      } finally {
        setLoading(false)
      }
    },
    []
  )

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
    reset,
  }
}
