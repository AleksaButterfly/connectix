import { useState, useCallback, useRef } from 'react'
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

  // Use refs to avoid recreating callbacks
  const organizationIdRef = useRef(organizationId)
  const projectIdRef = useRef(projectId)

  organizationIdRef.current = organizationId
  projectIdRef.current = projectId

  const loadConnections = useCallback(async () => {
    if (!organizationIdRef.current) {
      setError(intl.formatMessage({ id: 'connections.errors.organizationRequired' }))
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      let connectionsData: ConnectionWithDetails[]

      if (projectIdRef.current) {
        connectionsData = await connectionService.getProjectConnections(projectIdRef.current)
      } else {
        connectionsData = await connectionService.getOrganizationConnections(
          organizationIdRef.current
        )
      }

      setConnections(connectionsData)
    } catch (err) {
      console.error('Error loading connections:', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      const finalMessage =
        errorMessage || intl.formatMessage({ id: 'connections.errors.loadFailed' })
      setError(finalMessage)
      toast.error(finalMessage)
      setConnections([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  const deleteConnection = useCallback(async (connectionId: string) => {
    setOperationLoadingStates((prev) => ({
      ...prev,
      deleting: new Set(prev.deleting).add(connectionId),
    }))

    try {
      await connectionService.deleteConnection(connectionId)
      toast.success(intl.formatMessage({ id: 'connections.delete.success' }))

      // Remove from local state
      setConnections((prev) => prev.filter((conn) => conn.id !== connectionId))
    } catch (err) {
      console.error('Error deleting connection:', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      const finalMessage =
        errorMessage || intl.formatMessage({ id: 'connections.errors.deleteFailed' })
      toast.error(finalMessage)
      throw err
    } finally {
      setOperationLoadingStates((prev) => {
        const newDeleting = new Set(prev.deleting)
        newDeleting.delete(connectionId)
        return { ...prev, deleting: newDeleting }
      })
    }
  }, [])

  const testConnection = useCallback(async (connectionId: string) => {
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
    } catch (err) {
      console.error('Error testing connection:', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      const finalMessage =
        errorMessage || intl.formatMessage({ id: 'connections.errors.testFailed' })
      toast.error(finalMessage)

      setConnections((prev) =>
        prev.map((conn) => {
          if (conn.id === connectionId) {
            return {
              ...conn,
              connection_test_status: 'failed',
              last_test_at: new Date().toISOString(),
              last_test_error:
                errorMessage || intl.formatMessage({ id: 'connections.errors.testFailed' }),
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
  }, [])

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
