import { useState, useCallback, useRef } from 'react'
import { connectionService } from '@/lib/connections/connection.service'
import { useToast } from '@/components/ui/ToastContext'
import type { ConnectionWithDetails } from '@/types/connection'

interface UseConnectionsProps {
  organizationId: string
  projectId?: string // Make projectId optional
}

interface UseConnectionsReturn {
  connections: ConnectionWithDetails[]
  isLoading: boolean
  isTestingConnection: boolean
  error: string | null
  loadConnections: () => Promise<void>
  deleteConnection: (connectionId: string) => Promise<void>
  testConnection: (connectionId: string) => Promise<void>
}

export function useConnections({
  organizationId,
  projectId,
}: UseConnectionsProps): UseConnectionsReturn {
  const [connections, setConnections] = useState<ConnectionWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Use refs to store stable references
  const toastRef = useRef(toast)
  toastRef.current = toast

  const loadConnections = useCallback(async () => {
    if (!organizationId) {
      setError('Organization ID is required')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      let connectionsData: ConnectionWithDetails[]

      if (projectId) {
        connectionsData = await connectionService.getProjectConnections(projectId)
      } else {
        connectionsData = await connectionService.getOrganizationConnections(organizationId)
      }

      setConnections(connectionsData)
    } catch (err: any) {
      console.error('Error loading connections:', err)
      setError(err.message || 'Failed to load connections')
      toastRef.current.error(err.message || 'Failed to load connections')
      setConnections([])
    } finally {
      setIsLoading(false)
    }
  }, [organizationId, projectId]) // Removed toast from dependencies

  const deleteConnection = useCallback(
    async (connectionId: string) => {
      try {
        await connectionService.deleteConnection(connectionId)
        toastRef.current.success('Connection deleted successfully')

        // Remove from local state
        setConnections((prev) => prev.filter((conn) => conn.id !== connectionId))
      } catch (err: any) {
        console.error('Error deleting connection:', err)
        toastRef.current.error(err.message || 'Failed to delete connection')
        throw err
      }
    },
    [] // No dependencies needed
  )

  const testConnection = useCallback(
    async (connectionId: string) => {
      try {
        setIsTestingConnection(true)
        const result = await connectionService.testExistingConnection(connectionId)
        toastRef.current.success('Connection test successful')

        // Update the specific connection's test status in local state
        // instead of reloading everything
        setConnections((prevConnections) =>
          prevConnections.map((conn) =>
            conn.id === connectionId
              ? {
                  ...conn,
                  connection_test_status: 'success' as const,
                  last_test_at: new Date().toISOString(),
                  last_test_error: null,
                }
              : conn
          )
        )
      } catch (err: any) {
        console.error('Error testing connection:', err)
        toastRef.current.error(err.message || 'Connection test failed')

        // Update the specific connection's test status to failed
        setConnections((prevConnections) =>
          prevConnections.map((conn) =>
            conn.id === connectionId
              ? {
                  ...conn,
                  connection_test_status: 'failed' as const,
                  last_test_at: new Date().toISOString(),
                  last_test_error: err.message || 'Connection test failed',
                }
              : conn
          )
        )
        throw err
      } finally {
        setIsTestingConnection(false)
      }
    },
    [] // No dependencies needed
  )

  return {
    connections,
    isLoading,
    isTestingConnection,
    error,
    loadConnections,
    deleteConnection,
    testConnection,
  }
}
