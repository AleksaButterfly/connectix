'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useConnections } from '@/hooks/useConnections'
import { useToast } from '@/components/ui/ToastContext'
import { useIntl, FormattedMessage } from '@/lib/i18n'

export default function AllConnectionsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const intl = useIntl()

  const orgId = params.id as string
  const projectId = params.projectId as string

  const [isRedirecting, setIsRedirecting] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)

  const { connections, isLoading, loadConnections } = useConnections({
    organizationId: orgId,
    projectId: projectId,
  })

  useEffect(() => {
    loadConnections()
      .then(() => {
        setHasLoadedOnce(true)
      })
      .catch((error) => {
        console.error('Failed to load connections:', error)
        toast.error(
          intl.formatMessage({ id: 'connections.errors.loadFailed' }) + ': ' + error.message
        )
        setHasLoadedOnce(true)
      })
  }, []) // Empty deps - only load once on mount

  // Handle redirect when connections are loaded
  useEffect(() => {
    if (!isLoading && connections.length > 0 && !isRedirecting) {
      setIsRedirecting(true)
      const firstConnection = connections[0]
      router.replace(
        `/dashboard/organizations/${orgId}/projects/${projectId}/connections/${firstConnection.id}`
      )
    }
  }, [isLoading, connections, isRedirecting, router, orgId, projectId])

  // Show loading state during initial load, while actually loading, OR while redirecting
  if (!hasLoadedOnce || isLoading || isRedirecting) {
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

  // Only show empty state if we've loaded at least once and have no connections
  if (connections.length === 0) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
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
            <FormattedMessage id="connections.empty.title" />
          </h2>
          <p className="mb-4 max-w-[28.125rem] text-sm text-foreground-muted">
            <FormattedMessage id="connections.empty.description" />
          </p>
          <Link
            href={`/dashboard/organizations/${orgId}/projects/${projectId}/connections/new`}
            className="btn-primary"
          >
            <FormattedMessage id="connections.empty.createButton" />
          </Link>
        </div>
      </div>
    )
  }

  // This should never be reached, but just in case
  return null
}
