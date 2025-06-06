'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useIntl, FormattedMessage } from '@/lib/i18n'
import { connectionService } from '@/lib/connections/connection.service'
import ConnectionForm from '@/components/connections/ConnectionForm'
import type { Connection } from '@/types/connection'

export default function EditConnectionPage() {
  const params = useParams()
  const router = useRouter()
  const intl = useIntl()

  const orgId = params.id as string
  const projectId = params.projectId as string
  const connectionId = params.connectionId as string

  const [connection, setConnection] = useState<Connection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadConnection = async () => {
      if (!connectionId) {
        setError(intl.formatMessage({ id: 'connections.edit.error.missingConnectionId' }))
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const connectionData = await connectionService.getConnection(connectionId)

        if (!connectionData) {
          setError(intl.formatMessage({ id: 'connections.edit.error.notFound' }))
          return
        }

        setConnection(connectionData)
      } catch (err: any) {
        console.error('Failed to load connection:', err)
        setError(err.message || intl.formatMessage({ id: 'connections.edit.error.loadFailed' }))
      } finally {
        setIsLoading(false)
      }
    }

    loadConnection()
  }, [connectionId, intl])

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
          <p className="text-sm text-foreground-muted">
            <FormattedMessage
              id="connections.edit.error.missingParams.details"
              values={{
                orgId: orgId || intl.formatMessage({ id: 'connections.edit.error.missing' }),
                projectId:
                  projectId || intl.formatMessage({ id: 'connections.edit.error.missing' }),
                connectionId:
                  connectionId || intl.formatMessage({ id: 'connections.edit.error.missing' }),
              }}
            />
          </p>
        </div>
      </div>
    )
  }

  const handleComplete = () => {
    // Navigate back to the edited connection's single page
    router.push(
      `/dashboard/organizations/${orgId}/projects/${projectId}/connections/${connectionId}`
    )
  }

  const handleCancel = () => {
    // Navigate back to the connection's single page
    router.push(
      `/dashboard/organizations/${orgId}/projects/${projectId}/connections/${connectionId}`
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
            <FormattedMessage id="common.loading" />
          </p>
          <p className="mt-2 text-xs text-foreground-muted">
            <FormattedMessage id="connections.edit.loadingDetails" />
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">❌</div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            <FormattedMessage id="connections.edit.error.loadError.title" />
          </h2>
          <p className="mb-4 text-foreground-muted">{error}</p>
          <button onClick={handleCancel} className="btn-primary">
            <FormattedMessage id="common.back" />
          </button>
        </div>
      </div>
    )
  }

  if (!connection) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">🔍</div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            <FormattedMessage id="connections.edit.error.connectionNotFound.title" />
          </h2>
          <p className="mb-4 text-foreground-muted">
            <FormattedMessage id="connections.edit.error.connectionNotFound.description" />
          </p>
          <button onClick={handleCancel} className="btn-primary">
            <FormattedMessage id="common.back" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="w-full">
        {/* Back Button - Now properly aligned */}
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
