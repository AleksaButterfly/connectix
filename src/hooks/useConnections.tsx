import { useState, useEffect, useCallback, useRef } from 'react'
import { connectionService } from '@/lib/connections/connection.service'
import { useToast } from '@/components/ui/ToastContext'
import type {
  Connection,
  ConnectionWithDetails,
  CreateConnectionInput,
  UpdateConnectionInput,
  TestConnectionResult,
} from '@/types/connection'

interface UseConnectionsOptions {
  organizationId: string // Still needed for creating connections
  projectId: string // Made required
  autoLoad?: boolean
}

export function useConnections(options: UseConnectionsOptions) {
  const { organizationId, projectId, autoLoad = true } = options
  const [connections, setConnections] = useState<ConnectionWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { toast } = useToast()
  const hasLoadedRef = useRef(false)
  const toastRef = useRef(toast)

  // Keep toast ref updated
  useEffect(() => {
    toastRef.current = toast
  }, [toast])

  // Load connections
  const loadConnections = useCallback(async () => {
    if (!projectId || isLoading) return // Prevent concurrent loads

    try {
      setIsLoading(true)
      setError(null)

      const data = await connectionService.getProjectConnections(projectId)
      setConnections(data)
      hasLoadedRef.current = true
    } catch (err) {
      const error = err as Error
      setError(error)
      console.error('Failed to load connections:', error.message)
    } finally {
      setIsLoading(false)
    }
  }, [projectId, isLoading])

  // Create connection
  const createConnection = useCallback(
    async (input: CreateConnectionInput) => {
      if (!organizationId) throw new Error('Organization ID is required')

      try {
        const newConnection = await connectionService.createConnection(organizationId, input)

        // Reload connections to get full details
        hasLoadedRef.current = false
        await loadConnections()

        toast.success('Connection created successfully')
        return newConnection
      } catch (err) {
        const error = err as Error
        toast.error(`Failed to create connection: ${error.message}`)
        throw error
      }
    },
    [organizationId, loadConnections]
  )

  // Update connection
  const updateConnection = useCallback(
    async (connectionId: string, updates: UpdateConnectionInput) => {
      try {
        const updated = await connectionService.updateConnection(connectionId, updates)

        // Update local state
        setConnections((prev) =>
          prev.map((conn) => (conn.id === connectionId ? { ...conn, ...updated } : conn))
        )

        toast.success('Connection updated successfully')
        return updated
      } catch (err) {
        const error = err as Error
        toast.error(`Failed to update connection: ${error.message}`)
        throw error
      }
    },
    []
  )

  // Delete connection
  const deleteConnection = useCallback(async (connectionId: string) => {
    try {
      await connectionService.deleteConnection(connectionId)

      // Update local state
      setConnections((prev) => prev.filter((conn) => conn.id !== connectionId))

      toast.success('Connection deleted successfully')
    } catch (err) {
      const error = err as Error
      toast.error(`Failed to delete connection: ${error.message}`)
      throw error
    }
  }, [])

  // Test connection
  const testConnection = useCallback(
    async (connectionId: string): Promise<TestConnectionResult> => {
      try {
        const result = await connectionService.testExistingConnection(connectionId)

        if (result.success) {
          toast.success('Connection test successful')
        } else {
          toast.error(`Connection test failed: ${result.error}`)
        }

        // Reload to get updated test status
        hasLoadedRef.current = false
        await loadConnections()

        return result
      } catch (err) {
        const error = err as Error
        toast.error(`Failed to test connection: ${error.message}`)
        throw error
      }
    },
    [loadConnections]
  )

  // Auto-load connections on mount/changes
  useEffect(() => {
    // Reset the loaded flag when project changes
    hasLoadedRef.current = false
  }, [projectId])

  useEffect(() => {
    if (autoLoad && projectId && !hasLoadedRef.current && !isLoading) {
      loadConnections()
    }
  }, [autoLoad, projectId, loadConnections])

  return {
    connections,
    isLoading,
    error,
    loadConnections,
    createConnection,
    updateConnection,
    deleteConnection,
    testConnection,
  }
}

// Hook for a single connection
export function useConnection(connectionId: string | null) {
  const [connection, setConnection] = useState<Connection | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!connectionId) {
      setConnection(null)
      return
    }

    const loadConnection = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await connectionService.getConnection(connectionId)
        setConnection(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    loadConnection()
  }, [connectionId])

  return { connection, isLoading, error }
}
