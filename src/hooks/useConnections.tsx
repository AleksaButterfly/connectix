import { useState, useCallback } from 'react'
import { useIntl } from '@/lib/i18n'
import { connectionService } from '@/lib/connections/connection.service'
import { useToast } from '@/components/ui/ToastContext'
import type { ConnectionWithDetails } from '@/types/connection'

interface UseConnectionsProps {
  organizationId: string
  projectId?: string
}

interface UseConnectionsReturn {
  connections: ConnectionWithDetails[]
  isLoading: boolean
  error: string | null
  loadConnections: () => Promise<void>
  deleteConnection: (connectionId: string) => Promise<void>
  testConnection: (connectionId: string) => Promise<void>
  operationLoadingStates: {
    testing: Set<string>
    deleting: Set<string>
  }
}

export function useConnections({
  organizationId,
  projectId,
}: UseConnectionsProps): UseConnectionsReturn {
  const [connections, setConnections] = useState<ConnectionWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [operationLoadingStates, setOperationLoadingStates] = useState({
    testing: new Set<string>(),
    deleting: new Set<string>(),
  })

  const { toast } = useToast()
  const intl = useIntl()

  const loadConnections = useCallback(async () => {
    if (!organizationId) {
      setError(intl.formatMessage({ id: 'connections.errors.organizationRequired' }))
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
      const errorMessage =
        err.message || intl.formatMessage({ id: 'connections.errors.loadFailed' })
      setError(errorMessage)
      toast.error(errorMessage)
      setConnections([])
    } finally {
      setIsLoading(false)
    }
  }, [organizationId, projectId, toast, intl])

  const deleteConnection = useCallback(
    async (connectionId: string) => {
      setOperationLoadingStates((prev) => ({
        ...prev,
        deleting: new Set(prev.deleting).add(connectionId),
      }))

      try {
        await connectionService.deleteConnection(connectionId)
        toast.success(intl.formatMessage({ id: 'connections.delete.success' }))

        // Remove from local state
        setConnections((prev) => prev.filter((conn) => conn.id !== connectionId))
      } catch (err: any) {
        console.error('Error deleting connection:', err)
        const errorMessage =
          err.message || intl.formatMessage({ id: 'connections.errors.deleteFailed' })
        toast.error(errorMessage)
        throw err
      } finally {
        setOperationLoadingStates((prev) => {
          const newDeleting = new Set(prev.deleting)
          newDeleting.delete(connectionId)
          return { ...prev, deleting: newDeleting }
        })
      }
    },
    [toast, intl]
  )

  const testConnection = useCallback(
    async (connectionId: string) => {
      setOperationLoadingStates((prev) => ({
        ...prev,
        testing: new Set(prev.testing).add(connectionId),
      }))

      try {
        const result = await connectionService.testExistingConnection(connectionId)

        // Check if the test was successful before showing toast
        if (result.success) {
          toast.success(
            intl.formatMessage(
              {
                id: 'connections.test.successWithLatency',
              },
              {
                latency: result.latency_ms || 0,
              }
            )
          )
        } else {
          // Show error toast if test failed
          toast.error(
            intl.formatMessage(
              {
                id: 'connections.test.failedWithError',
              },
              {
                error: result.error || intl.formatMessage({ id: 'connections.errors.testFailed' }),
              }
            )
          )
        }

        setConnections((prev) =>
          prev.map((conn) => {
            if (conn.id === connectionId) {
              return {
                ...conn,
                connection_test_status: result.success ? 'success' : 'failed',
                last_test_at: new Date().toISOString(),
                last_test_error: result.success ? null : result.error || null,
              }
            }
            return conn
          })
        )
      } catch (err: any) {
        console.error('Error testing connection:', err)
        const errorMessage =
          err.message || intl.formatMessage({ id: 'connections.errors.testFailed' })
        toast.error(errorMessage)

        setConnections((prev) =>
          prev.map((conn) => {
            if (conn.id === connectionId) {
              return {
                ...conn,
                connection_test_status: 'failed',
                last_test_at: new Date().toISOString(),
                last_test_error:
                  err.message || intl.formatMessage({ id: 'connections.errors.testFailed' }),
              }
            }
            return conn
          })
        )

        throw err
      } finally {
        // Clear loading state
        setOperationLoadingStates((prev) => {
          const newTesting = new Set(prev.testing)
          newTesting.delete(connectionId)
          return { ...prev, testing: newTesting }
        })
      }
    },
    [toast, intl]
  )

  return {
    connections,
    isLoading,
    error,
    loadConnections,
    deleteConnection,
    testConnection,
    operationLoadingStates,
  }
}
