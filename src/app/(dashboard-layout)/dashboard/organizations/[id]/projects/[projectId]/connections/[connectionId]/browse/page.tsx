'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileBrowser } from '@/components/ssh/FileBrowser'
import { connectionService } from '@/lib/connections/connection.service'
import { useToast } from '@/components/ui/ToastContext'
import type { ConnectionWithDetails } from '@/types/connection'

export default function ConnectionBrowsePage() {
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

  useEffect(() => {
    if (connectionId) {
      loadConnectionAndSession()
    }
  }, [connectionId])

  const loadConnectionAndSession = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Load connection details
      const conn = await connectionService.getConnection(connectionId)
      if (!conn) {
        setError('Connection not found')
        return
      }

      // Check access
      const hasAccess = await connectionService.checkConnectionAccess(connectionId)
      if (!hasAccess) {
        setError('Access denied')
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
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          // Response is not JSON, use status text
        }

        throw new Error(errorMessage)
      }

      const sessionData = await sessionResponse.json()
      setSessionToken(sessionData.sessionToken)
    } catch (err: any) {
      console.error('Failed to load connection or create session:', err)
      setError(err.message || 'Failed to initialize connection')
      toast.error(err.message || 'Failed to initialize connection')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    try {
      // Close SSH session
      if (sessionToken) {
        await fetch(`/api/connections/${connectionId}/session`, {
          method: 'DELETE',
          headers: {
            'x-session-token': sessionToken,
          },
        })
      }
    } catch (err) {
      console.error('Error closing session:', err)
    } finally {
      router.push(`/dashboard/organizations/${orgId}/projects/${projectId}/connections`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
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
          <p className="text-foreground-muted">Connecting to server...</p>
        </div>
      </div>
    )
  }

  if (error || !connection) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">Connection Error</h2>
          <p className="mb-4 text-foreground-muted">
            {error || 'Unable to access this SSH connection.'}
          </p>
          <Link
            href={`/dashboard/organizations/${orgId}/projects/${projectId}/connections`}
            className="btn-primary"
          >
            Back to Connections
          </Link>
        </div>
      </div>
    )
  }

  if (!sessionToken) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">🔑</div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">Session Required</h2>
          <p className="mb-4 text-foreground-muted">
            Failed to establish SSH session. Please try again.
          </p>
          <button onClick={loadConnectionAndSession} className="btn-primary">
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background-secondary px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/organizations/${orgId}/projects/${projectId}/connections`}
              className="hover:text-terminal-green-hover text-terminal-green"
            >
              ← Back
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-foreground">{connection.name}</h1>
              <p className="text-sm text-foreground-muted">
                {connection.username}@{connection.host}:{connection.port}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-terminal-green/10 px-3 py-1 text-xs font-medium text-terminal-green">
              <span>●</span>
              Connected
            </span>
            <button
              onClick={handleDisconnect}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background-secondary"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>

      {/* File Browser */}
      <div className="flex-1 overflow-hidden">
        <FileBrowser
          connectionId={connectionId}
          sessionToken={sessionToken}
          onDisconnect={handleDisconnect}
        />
      </div>
    </div>
  )
}
