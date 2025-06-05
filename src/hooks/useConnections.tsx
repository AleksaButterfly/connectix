import { useState, useCallback } from 'react'
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
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

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
        // Fetch connections for specific project
        connectionsData = await connectionService.getProjectConnections(projectId)
      } else {
        // Fetch connections for organization
        connectionsData = await connectionService.getOrganizationConnections(organizationId)
      }

      setConnections(connectionsData)
    } catch (err: any) {
      console.error('Error loading connections:', err)
      setError(err.message || 'Failed to load connections')
      toast.error(err.message || 'Failed to load connections')
      setConnections([])
    } finally {
      setIsLoading(false)
    }
  }, [organizationId, projectId, toast])

  const deleteConnection = useCallback(
    async (connectionId: string) => {
      try {
        await connectionService.deleteConnection(connectionId)
        toast.success('Connection deleted successfully')

        // Remove from local state
        setConnections((prev) => prev.filter((conn) => conn.id !== connectionId))
      } catch (err: any) {
        console.error('Error deleting connection:', err)
        toast.error(err.message || 'Failed to delete connection')
        throw err
      }
    },
    [toast]
  )

  const testConnection = useCallback(
    async (connectionId: string) => {
      try {
        const result = await connectionService.testExistingConnection(connectionId)

        if (result.success) {
          toast.success(`Connection test successful! Latency: ${result.latency_ms}ms`)
        } else {
          toast.error(`Connection test failed: ${result.error || 'Unknown error'}`)
        }

        // Reload connections to get updated test status
        await loadConnections()

        return result
      } catch (err: any) {
        console.error('Error testing connection:', err)
        toast.error(err.message || 'Connection test failed')

        // Still reload to get any status updates
        await loadConnections()
        throw err
      }
    },
    [toast, loadConnections]
  )

  return {
    connections,
    isLoading,
    error,
    loadConnections,
    deleteConnection,
    testConnection,
  }
}
