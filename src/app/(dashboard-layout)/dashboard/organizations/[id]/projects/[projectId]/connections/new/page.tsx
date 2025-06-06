'use client'

import { useParams, useRouter } from 'next/navigation'
import { useIntl, FormattedMessage } from '@/lib/i18n'
import ConnectionForm from '@/components/connections/ConnectionForm'

export default function NewConnectionPage() {
  const params = useParams()
  const router = useRouter()
  const intl = useIntl()

  const orgId = params.id as string
  const projectId = params.projectId as string

  if (!orgId || !projectId) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            <FormattedMessage id="connections.new.error.missingParams.title" />
          </h2>
          <p className="mb-4 text-foreground-muted">
            <FormattedMessage id="connections.new.error.missingParams.description" />
          </p>
          <p className="text-sm text-foreground-muted">
            <FormattedMessage
              id="connections.new.error.missingParams.details"
              values={{
                orgId: orgId || intl.formatMessage({ id: 'connections.new.error.missing' }),
                projectId: projectId || intl.formatMessage({ id: 'connections.new.error.missing' }),
              }}
            />
          </p>
        </div>
      </div>
    )
  }

  const handleComplete = (connectionId?: string) => {
    // Navigate to the newly created connection's single page
    if (connectionId) {
      router.push(
        `/dashboard/organizations/${orgId}/projects/${projectId}/connections/${connectionId}`
      )
    } else {
      // Fallback to connections list if no ID provided
      router.push(`/dashboard/organizations/${orgId}/projects/${projectId}/connections`)
    }
  }

  const handleCancel = () => {
    // Navigate back to connections page
    router.push(`/dashboard/organizations/${orgId}/projects/${projectId}/connections`)
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
            <FormattedMessage id="connections.new.backToConnections" />
          </button>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            <FormattedMessage id="connections.new.title" />
          </h1>
          <p className="mt-2 text-foreground-muted">
            <FormattedMessage id="connections.new.subtitle" />
          </p>
        </div>

        {/* Connection Form */}
        <ConnectionForm
          organizationId={orgId}
          projectId={projectId}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
