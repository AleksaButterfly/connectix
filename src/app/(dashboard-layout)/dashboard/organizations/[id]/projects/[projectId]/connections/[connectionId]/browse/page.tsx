'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileBrowser } from '@/components/ssh/FileBrowser'
import { connectionService } from '@/lib/connections/connection.service'
import { useToast } from '@/components/ui/ToastContext'
import { useIntl, FormattedMessage } from '@/lib/i18n'
import type { ConnectionWithDetails } from '@/types/connection'

export default function ConnectionBrowsePage() {
  const intl = useIntl()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const connectionId = params.connectionId as string
  const projectId = params.projectId as string
  const orgId = params.id as string

  const [connection, setConnection] = useState<ConnectionWithDetails | null>(null)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Prevent duplicate initialization
  const initializingRef = useRef(false)

  const loadConnectionAndSession = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Load connection details
      const conn = await connectionService.getConnection(connectionId)
      if (!conn) {
        setError(intl.formatMessage({ id: 'browse.error.connectionNotFound' }))
        return
      }

      // Check access
      const hasAccess = await connectionService.checkConnectionAccess(connectionId)
      if (!hasAccess) {
        setError(intl.formatMessage({ id: 'browse.error.accessDenied' }))
        return
      }

      setConnection(conn as ConnectionWithDetails)

      // Create SSH session
      const sessionResponse = await fetch(`/api/connections/${connectionId}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!sessionResponse.ok) {
        let errorMessage = `HTTP ${sessionResponse.status}: ${sessionResponse.statusText}`

        try {
          const errorData = await sessionResponse.json()
          errorMessage = errorData.error || errorData.message || errorMessage
        } catch {
          // Response is not JSON, use status text
        }

        throw new Error(errorMessage)
      }

      const sessionData = await sessionResponse.json()
      if (sessionData.sessionToken) {
        setSessionToken(sessionData.sessionToken)
      } else {
        throw new Error('No session token received')
      }
    } catch (err) {
      console.error('Failed to load connection or create session:', err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage || intl.formatMessage({ id: 'browse.error.initializeFailed' }))

      // Only show toast for actual errors, not for initial load
      if (errorMessage && !errorMessage.includes('Connection not found')) {
        toast.error(errorMessage)
      }
    } finally {
      setIsLoading(false)
      initializingRef.current = false
    }
  }, [connectionId])

  useEffect(() => {
    if (connectionId && !initializingRef.current) {
      initializingRef.current = true
      loadConnectionAndSession()
    }
  }, [connectionId])

  useEffect(() => {
    // Cleanup session on unmount
    return () => {
      if (sessionToken) {
        fetch(`/api/connections/${connectionId}/session`, {
          method: 'DELETE',
          headers: { 'x-session-token': sessionToken },
        }).catch((err) => {
          console.error('Failed to cleanup session:', err)
        })
      }
    }
  }, [connectionId, sessionToken])

  const handleDisconnect = useCallback(() => {
    setSessionToken(null)
    router.push(
      `/dashboard/organizations/${orgId}/projects/${projectId}/connections/${connectionId}`
    )
  }, [router, orgId, projectId, connectionId])

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
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
            <FormattedMessage id="browse.loading" />
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !connection) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <svg
            className="mx-auto mb-4 h-16 w-16 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="mb-2 text-lg font-medium text-foreground">
            <FormattedMessage id="browse.error.title" />
          </h3>
          <p className="mb-6 text-sm text-foreground-muted">{error}</p>
          <Link
            href={`/dashboard/organizations/${orgId}/projects/${projectId}/connections/${connectionId}`}
            className="btn-primary"
          >
            <FormattedMessage id="browse.error.goBack" />
          </Link>
        </div>
      </div>
    )
  }

  // Main content
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{connection.name}</h1>
            <p className="mt-1 text-sm text-foreground-muted">
              {connection.username}@{connection.host}:{connection.port}
            </p>
          </div>
          <Link
            href={`/dashboard/organizations/${orgId}/projects/${projectId}/connections/${connectionId}`}
            className="rounded-lg border border-border bg-background-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background-tertiary"
          >
            <FormattedMessage id="files.navigation.back" />
          </Link>
        </div>
      </div>

      {/* File Browser */}
      <div className="flex-1 overflow-hidden">
        {sessionToken ? (
          <FileBrowser
            connectionId={connectionId}
            sessionToken={sessionToken}
            onDisconnect={handleDisconnect}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-foreground-muted">
              <FormattedMessage id="browse.error.noSession" />
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
