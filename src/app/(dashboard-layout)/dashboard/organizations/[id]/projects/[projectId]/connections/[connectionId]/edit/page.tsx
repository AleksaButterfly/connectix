'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FormattedMessage } from '@/lib/i18n'
import { connectionService } from '@/lib/connections/connection.service'
import ConnectionForm from '@/components/connections/ConnectionForm'
import type { Connection } from '@/types/connection'

export default function EditConnectionPage() {
  const params = useParams()
  const router = useRouter()

  const orgId = params.id as string
  const projectId = params.projectId as string
  const connectionId = params.connectionId as string

  const [connection, setConnection] = useState<Connection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadConnection = async () => {
      if (!connectionId) {
        setError('Connection ID is missing')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const connectionData = await connectionService.getConnection(connectionId)

        if (!connectionData) {
          setError('Connection not found')
          return
        }

        setConnection(connectionData)
      } catch (err: any) {
        console.error('Failed to load connection:', err)
        setError(err.message || 'Failed to load connection')
      } finally {
        setIsLoading(false)
      }
    }

    loadConnection()
  }, [connectionId])

  if (!orgId || !projectId || !connectionId) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">Missing Parameters</h2>
          <p className="mb-4 text-foreground-muted">
            Required parameters are missing from the URL.
          </p>
          <p className="text-sm text-foreground-muted">
            Org ID: {orgId || 'MISSING'} | Project ID: {projectId || 'MISSING'} | Connection ID:{' '}
            {connectionId || 'MISSING'}
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
            <FormattedMessage id="common.loading" defaultMessage="Loading..." />
          </p>
          <p className="mt-2 text-xs text-foreground-muted">Loading connection details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">❌</div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">Error Loading Connection</h2>
          <p className="mb-4 text-foreground-muted">{error}</p>
          <button onClick={handleCancel} className="btn-primary">
            <FormattedMessage id="common.back" defaultMessage="Back" />
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
          <h2 className="mb-2 text-xl font-semibold text-foreground">Connection Not Found</h2>
          <p className="mb-4 text-foreground-muted">
            The connection you're looking for doesn't exist or you don't have access to it.
          </p>
          <button onClick={handleCancel} className="btn-primary">
            <FormattedMessage id="common.back" defaultMessage="Back" />
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
            <FormattedMessage id="common.back" defaultMessage="Back to Connection" />
          </button>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Edit Connection of <span className="text-terminal-green">{connection.name}</span>
          </h1>
          <p className="mt-2 text-foreground-muted">Update the SSH connection settings.</p>
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
