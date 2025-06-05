'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useIntl, FormattedMessage } from '@/lib/i18n'
import { useConnections } from '@/hooks/useConnections'
import { useConfirmation } from '@/hooks/useConfirmation'
import { useToast } from '@/components/ui/ToastContext'
import ConnectionDetails from '@/components/connections/ConnectionDetails'
import type { ConnectionWithDetails } from '@/types/connection'

export default function SingleConnectionPage() {
  const intl = useIntl()
  const params = useParams()
  const router = useRouter()
  const orgId = params.id as string
  const projectId = params.projectId as string
  const connectionId = params.connectionId as string

  const { toast } = useToast()
  const [isTestingConnection, setIsTestingConnection] = useState<string | null>(null)

  if (!orgId || !projectId || !connectionId) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">Missing Parameters</h2>
          <p className="mb-4 text-foreground-muted">Required URL parameters are missing.</p>
        </div>
      </div>
    )
  }

  const { connections, isLoading, loadConnections, deleteConnection } = useConnections({
    organizationId: orgId,
    projectId: projectId,
  })

  const { confirm, ConfirmationModal } = useConfirmation()

  // Load connections once on mount
  useEffect(() => {
    loadConnections().catch((error) => {
      console.error('Failed to load connections:', error)
      toast.error('Failed to load connections: ' + error.message)
    })
  }, [loadConnections, toast])

  // Find the selected connection from URL - no state needed!
  const selectedConnection = connections.find((conn) => conn.id === connectionId) || null

  // If connections are loaded but connection not found, redirect to first
  useEffect(() => {
    if (!isLoading && connections.length > 0 && !selectedConnection) {
      const firstConnection = connections[0]
      router.replace(
        `/dashboard/organizations/${orgId}/projects/${projectId}/connections/${firstConnection.id}`
      )
    }
  }, [isLoading, connections.length, selectedConnection, router, orgId, projectId])

  const handleCreateNew = () => {
    router.push(`/dashboard/organizations/${orgId}/projects/${projectId}/connections/new`)
  }

  const handleSelectConnection = (connection: ConnectionWithDetails) => {
    // Just update URL - component will re-render with new connection automatically
    router.push(
      `/dashboard/organizations/${orgId}/projects/${projectId}/connections/${connection.id}`,
      { scroll: false }
    )
  }

  const handleEdit = () => {
    if (!selectedConnection) return
    router.push(
      `/dashboard/organizations/${orgId}/projects/${projectId}/connections/${selectedConnection.id}/edit`
    )
  }

  const handleDelete = (connection: ConnectionWithDetails) => {
    confirm({
      title: intl.formatMessage({ id: 'connections.delete.title' }),
      message: intl.formatMessage(
        { id: 'connections.delete.message' },
        { connectionName: connection.name }
      ),
      confirmText: intl.formatMessage({ id: 'connections.delete.confirmButton' }),
      cancelText: intl.formatMessage({ id: 'common.cancel' }),
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteConnection(connection.id)

          // If we deleted the selected connection, pick a new one
          if (selectedConnection?.id === connection.id) {
            const remainingConnections = connections.filter((c) => c.id !== connection.id)
            if (remainingConnections.length > 0) {
              const newSelected = remainingConnections[0]
              router.replace(
                `/dashboard/organizations/${orgId}/projects/${projectId}/connections/${newSelected.id}`,
                { scroll: false }
              )
            } else {
              // No connections left, go back to connections page
              router.replace(`/dashboard/organizations/${orgId}/projects/${projectId}/connections`)
            }
          }
        } catch (error: any) {
          console.error('Delete connection error:', error)
          toast.error(error.message || intl.formatMessage({ id: 'connections.delete.error' }))
        }
      },
    })
  }

  const handleTest = async (connection: ConnectionWithDetails) => {
    if (isTestingConnection === connection.id) return // Prevent double clicks

    setIsTestingConnection(connection.id)

    try {
      const response = await fetch(`/api/connections/${connection.id}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (response.ok && result.success) {
        toast.success(`Connection test successful! Latency: ${result.latency_ms}ms`)
      } else {
        toast.error(`Connection test failed: ${result.error || 'Unknown error'}`)
      }

      // Only refresh data if the test completed (success or failure)
      // This prevents unnecessary re-renders
      if (response.ok) {
        await loadConnections()
      }
    } catch (error: any) {
      console.error('Test connection error:', error)
      toast.error('Connection test failed: ' + error.message)
    } finally {
      setIsTestingConnection(null)
    }
  }

  const handleBrowse = (connection: ConnectionWithDetails) => {
    router.push(
      `/dashboard/organizations/${orgId}/projects/${projectId}/connections/${connection.id}/browse`
    )
  }

  const getConnectionStatus = (connection: ConnectionWithDetails) => {
    if (!connection.connection_test_status || connection.connection_test_status === 'untested') {
      return {
        color: 'text-foreground-muted',
        icon: '○',
        text: intl.formatMessage({ id: 'connections.list.testStatus.untested' }),
      }
    }
    if (connection.connection_test_status === 'success') {
      return {
        color: 'text-terminal-green',
        icon: '●',
        text: intl.formatMessage({ id: 'connections.list.testStatus.success' }),
      }
    }
    return {
      color: 'text-red-500',
      icon: '●',
      text: intl.formatMessage({ id: 'connections.list.testStatus.failed' }),
    }
  }

  // Show loading during initial load
  if (isLoading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <svg
            className="mx-auto mb-4 h-8 w-8 animate-spin text-terminal-green"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-foreground-muted">
            <FormattedMessage id="common.loading" />
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-border bg-background-secondary">
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="border-b border-border p-4">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-foreground">
                <FormattedMessage id="connections.title" />
              </h1>
              <button
                onClick={handleCreateNew}
                className="hover:bg-terminal-green-hover rounded-lg bg-terminal-green px-3 py-1.5 text-sm font-medium text-background transition-colors"
              >
                <FormattedMessage id="common.new" />
              </button>
            </div>
          </div>

          {/* Connections List */}
          <div className="flex-1 overflow-y-auto">
            {connections.length === 0 ? (
              <div className="p-4 text-left">
                <p className="text-sm text-foreground-muted">
                  <FormattedMessage id="connections.empty.description" />
                </p>
              </div>
            ) : (
              <div className="p-2">
                {connections.map((connection) => {
                  const status = getConnectionStatus(connection)
                  const isSelected = selectedConnection?.id === connection.id

                  return (
                    <div
                      key={connection.id}
                      className={`group mb-1 w-full rounded-lg border transition-colors ${
                        isSelected
                          ? 'border-terminal-green/30 bg-terminal-green/10'
                          : 'border-transparent hover:bg-background-tertiary'
                      }`}
                    >
                      <div className="flex items-center">
                        {/* Main connection button */}
                        <button
                          onClick={() => handleSelectConnection(connection)}
                          className="min-w-0 flex-1 p-3 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`flex-shrink-0 text-xs ${status.color}`}>
                              {status.icon}
                            </span>
                            <h3 className="truncate font-medium text-foreground">
                              {connection.name}
                            </h3>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-foreground-muted">
                            {connection.username}@{connection.host}:{connection.port}
                          </p>
                          {connection.last_test_error &&
                            connection.connection_test_status === 'failed' && (
                              <p className="mt-0.5 truncate text-xs text-red-500">
                                {connection.last_test_error}
                              </p>
                            )}
                        </button>

                        {/* Quick Browse Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleBrowse(connection)
                          }}
                          className="mr-3 flex-shrink-0 rounded px-2 py-1 text-xs text-terminal-green opacity-0 transition-opacity hover:bg-terminal-green/10 group-hover:opacity-100"
                          title="Browse Files"
                        >
                          📁
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl">
          <div className="min-h-full px-6 py-6">
            {selectedConnection ? (
              <div className="w-full">
                <ConnectionDetails
                  connection={selectedConnection}
                  onEdit={handleEdit}
                  onDelete={() => handleDelete(selectedConnection)}
                  onTest={() => handleTest(selectedConnection)}
                  onBrowse={() => handleBrowse(selectedConnection)}
                  isTestingConnection={isTestingConnection === selectedConnection.id}
                />
              </div>
            ) : (
              <div className="mb-16 flex min-h-[400px] w-full items-center justify-center">
                <div className="text-center">
                  <svg
                    className="mx-auto mb-4 h-16 w-16 text-foreground-muted/30"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 002 2z"
                    />
                  </svg>
                  <h2 className="mb-2 text-xl font-semibold text-foreground">
                    Connection Not Found
                  </h2>
                  <p className="mb-4 max-w-[28.125rem] text-sm text-foreground-muted">
                    The requested connection could not be found.
                  </p>
                  <button onClick={handleCreateNew} className="btn-primary">
                    <FormattedMessage id="connections.empty.createButton" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal />
    </div>
  )
}
