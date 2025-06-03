'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { projectService } from '@/lib/projects/project.service'
import { organizationService } from '@/lib/organizations/organization.service'
import type { ProjectWithDetails } from '@/types/project'
import type { Organization } from '@/types/organization'
import { useIntl, FormattedMessage } from '@/lib/i18n'

export default function ProjectOverviewPage() {
  const intl = useIntl()
  const params = useParams()
  const router = useRouter()
  const orgId = params.id as string
  const projectId = params.projectId as string
  const [project, setProject] = useState<ProjectWithDetails | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [orgId, projectId])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Check access first
      const hasAccess = await projectService.checkProjectAccess(projectId)
      if (!hasAccess) {
        router.push('/dashboard/organizations')
        return
      }

      // Fetch project details
      const [proj, org] = await Promise.all([
        projectService.getProject(projectId),
        organizationService.getOrganization(orgId),
      ])

      if (!proj || !org) {
        router.push('/dashboard/organizations')
        return
      }

      // Get project with details (including creator username)
      const projects = await projectService.getOrganizationProjects(orgId)
      const projectWithDetails = projects.find((p) => p.id === projectId)

      setProject(projectWithDetails || proj)
      setOrganization(org)
    } catch (err: any) {
      console.error('Failed to fetch project:', err)
      setError(err.message || intl.formatMessage({ id: 'projects.error.loadFailed' }))
    } finally {
      setIsLoading(false)
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
          <p className="text-foreground-muted">
            <FormattedMessage id="projects.loading" />
          </p>
        </div>
      </div>
    )
  }

  if (error || !project || !organization) {
    return (
      <div className="container mx-auto max-w-6xl px-6 py-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-red-500">
              {error || intl.formatMessage({ id: 'projects.error.notFound' })}
            </p>
            <button onClick={fetchData} className="btn-secondary">
              <FormattedMessage id="common.tryAgain" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const createdDate = new Date(project.created_at).toLocaleDateString(intl.locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const updatedDate = new Date(project.updated_at).toLocaleDateString(intl.locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="mb-3 text-3xl font-bold text-foreground">{project.name}</h1>

        {project.description && (
          <p className="text-lg text-foreground-muted">{project.description}</p>
        )}
      </div>

      {/* Project Info Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Details Card */}
        <div className="rounded-lg border border-border bg-background-secondary p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            <FormattedMessage id="projects.details.title" />
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-foreground-muted">
                <FormattedMessage id="projects.details.createdBy" />
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {project.created_by_username || intl.formatMessage({ id: 'common.unknown' })}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-foreground-muted">
                <FormattedMessage id="projects.details.createdAt" />
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{createdDate}</dd>
            </div>
            <div>
              <dt className="text-sm text-foreground-muted">
                <FormattedMessage id="projects.details.lastUpdated" />
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">{updatedDate}</dd>
            </div>
          </dl>
        </div>

        {/* Quick Actions Card */}
        <div className="rounded-lg border border-border bg-background-secondary p-6">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            <FormattedMessage id="projects.quickActions.title" />
          </h2>
          <div className="space-y-3">
            <button
              onClick={() =>
                router.push(`/dashboard/organizations/${orgId}/projects/${projectId}/settings`)
              }
              className="flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm transition-colors hover:bg-background-tertiary"
            >
              <svg
                className="h-5 w-5 text-foreground-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-foreground">
                <FormattedMessage id="projects.quickActions.settings" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
