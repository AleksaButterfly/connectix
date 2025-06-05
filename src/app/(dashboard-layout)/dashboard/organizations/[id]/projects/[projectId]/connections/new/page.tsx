'use client'

import { useParams, useRouter } from 'next/navigation'
import { FormattedMessage } from '@/lib/i18n'
import ConnectionForm from '@/components/connections/ConnectionForm'

export default function NewConnectionPage() {
  const params = useParams()
  const router = useRouter()

  const orgId = params.id as string
  const projectId = params.projectId as string

  if (!orgId || !projectId) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h2 className="mb-2 text-xl font-semibold text-foreground">Missing Parameters</h2>
          <p className="mb-4 text-foreground-muted">
            Organization ID or Project ID is missing from the URL.
          </p>
          <p className="text-sm text-foreground-muted">
            Org ID: {orgId || 'MISSING'} | Project ID: {projectId || 'MISSING'}
          </p>
        </div>
      </div>
    )
  }

  const handleComplete = (connectionId?: string) => {
    // Navigate back to connections page with the newly created connection selected
    if (connectionId) {
      router.push(
        `/dashboard/organizations/${orgId}/projects/${projectId}/connections?selected=${connectionId}`
      )
    } else {
      router.push(`/dashboard/organizations/${orgId}/projects/${projectId}/connections`)
    }
  }

  const handleCancel = () => {
    // Navigate back to connections page
    router.push(`/dashboard/organizations/${orgId}/projects/${projectId}/connections`)
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      {/* Back Button */}
      <div className="mb-6">
        <button
          onClick={handleCancel}
          className="flex items-center gap-2 text-sm text-foreground-muted hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <FormattedMessage id="common.back" defaultMessage="Back" />
        </button>
      </div>

      <ConnectionForm
        organizationId={orgId}
        projectId={projectId}
        onComplete={handleComplete}
        onCancel={handleCancel}
      />
    </div>
  )
}
