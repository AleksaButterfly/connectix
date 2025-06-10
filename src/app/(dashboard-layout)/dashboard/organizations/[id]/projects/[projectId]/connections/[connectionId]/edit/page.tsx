'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useIntl, FormattedMessage } from '@/lib/i18n'
import { useToast } from '@/components/ui/ToastContext'
import ConnectionForm from '@/components/connections/ConnectionForm'
import { connectionService } from '@/lib/connections/connection.service'
import type { ConnectionWithDetails } from '@/types/connection'

export default function EditConnectionPage() {
  const params = useParams()
  const router = useRouter()
  const intl = useIntl()
  const { toast } = useToast()

  const orgId = params.id as string
  const projectId = params.projectId as string
  const connectionId = params.connectionId as string

  const [connection, setConnection] = useState<ConnectionWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load connection data
  useEffect(() => {
    const loadConnection = async () => {
      if (!connectionId || !projectId) {
        return
      }

      try {
        setIsLoading(true)

        // Get project connections to find the specific one with all details
        const connections = await connectionService.getProjectConnections(projectId)
        const foundConnection = connections.find((c) => c.id === connectionId)

        if (!foundConnection) {
          throw new Error(intl.formatMessage({ id: 'connections.errors.notFound' }))
        }

        setConnection(foundConnection)
      } catch (error: any) {
        console.error('Failed to load connection:', error)
        toast.error(error.message || intl.formatMessage({ id: 'connections.errors.loadFailed' }))
        // Redirect back to connections list on error
        router.push(`/dashboard/organizations/${orgId}/projects/${projectId}/connections`)
      } finally {
        setIsLoading(false)
      }
    }

    loadConnection()
  }, [connectionId, projectId, orgId, router])

  if (!orgId || !projectId || !connectionId) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            <FormattedMessage id="connections.edit.error.missingParams.title" />
          </h2>
          <p className="mb-4 text-foreground-muted">
            <FormattedMessage id="connections.edit.error.missingParams.description" />
          </p>
        </div>
      </div>
    )
  }

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
            <FormattedMessage id="connections.edit.loading" />
          </p>
        </div>
      </div>
    )
  }

  if (!connection) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">❌</div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            <FormattedMessage id="connections.errors.notFound" />
          </h2>
          <p className="mb-4 text-foreground-muted">
            <FormattedMessage id="connections.edit.error.notFound.description" />
          </p>
          <button
            onClick={() =>
              router.push(`/dashboard/organizations/${orgId}/projects/${projectId}/connections`)
            }
            className="btn-primary"
          >
            <FormattedMessage id="connections.edit.backToConnections" />
          </button>
        </div>
      </div>
    )
  }

  const handleComplete = (connectionId?: string) => {
    // Navigate back to the connection's single page
    if (connectionId) {
      router.push(
        `/dashboard/organizations/${orgId}/projects/${projectId}/connections/${connectionId}`
      )
    } else {
      // Fallback to connections list
      router.push(`/dashboard/organizations/${orgId}/projects/${projectId}/connections`)
    }
  }

  const handleCancel = () => {
    // Navigate back to the connection's single page
    router.push(
      `/dashboard/organizations/${orgId}/projects/${projectId}/connections/${connectionId}`
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="w-full">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-sm text-foreground-muted transition-colors hover:text-foreground"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <FormattedMessage id="connections.edit.backToConnection" />
          </button>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            <FormattedMessage
              id="connections.edit.title"
              values={{
                connectionName: <span className="text-terminal-green">{connection.name}</span>,
              }}
            />
          </h1>
          <p className="mt-2 text-foreground-muted">
            <FormattedMessage id="connections.edit.subtitle" />
          </p>
        </div>

        {/* Connection Form */}
        <ConnectionForm
          organizationId={orgId}
          projectId={projectId}
          connection={connection}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
