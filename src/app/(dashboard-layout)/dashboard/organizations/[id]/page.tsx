'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { organizationService } from '@/lib/organizations/organization.service'
import { projectService } from '@/lib/projects/project.service'
import type { Organization } from '@/types/organization'
import type { ProjectWithDetails } from '@/types/project'
import { useIntl, FormattedMessage } from '@/lib/i18n'

export default function OrganizationProjectsPage() {
  const intl = useIntl()
  const params = useParams()
  const router = useRouter()
  const orgId = params.id as string
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [projects, setProjects] = useState<ProjectWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchData()
  }, [orgId])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Fetch organization details
      const org = await organizationService.getOrganization(orgId)
      if (!org) {
        router.push('/dashboard/organizations')
        return
      }
      setOrganization(org)

      // Fetch projects
      const projectsList = await projectService.getOrganizationProjects(orgId)
      setProjects(projectsList)
    } catch (err: any) {
      console.error('Failed to fetch data:', err)
      setError(err.message || intl.formatMessage({ id: 'projects.error.loadFailed' }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewProject = () => {
    router.push(`/dashboard/organizations/${orgId}/projects/new`)
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

  if (error) {
    return (
      <div className="container mx-auto max-w-6xl px-6 py-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-red-500">{error}</p>
            <button onClick={fetchData} className="btn-secondary">
              <FormattedMessage id="common.tryAgain" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          <FormattedMessage id="projects.title" />
        </h1>
        <p className="mt-2 text-foreground-muted">
          <FormattedMessage id="projects.subtitle" />
        </p>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background-secondary/50 p-8 text-center">
          <div className="mx-auto max-w-sm">
            <div className="mb-4 text-5xl">📁</div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              <FormattedMessage id="projects.empty.title" />
            </h3>
            <p className="mb-6 text-sm text-foreground-muted">
              <FormattedMessage id="projects.empty.description" />
            </p>
            <button
              onClick={handleNewProject}
              className="btn-primary inline-flex items-center gap-2"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <FormattedMessage id="projects.newProject" />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Project cards */}
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} orgId={orgId} />
          ))}

          {/* New Project Card */}
          <button
            onClick={handleNewProject}
            className="group relative overflow-hidden rounded-lg border border-dashed border-border bg-background-secondary/50 p-6 text-left transition-all hover:border-terminal-green/50 hover:bg-background-secondary"
          >
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-border group-hover:border-terminal-green/50">
                <svg
                  className="h-6 w-6 text-foreground-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium text-foreground">
                <FormattedMessage id="projects.newProject" />
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project, orgId }: { project: ProjectWithDetails; orgId: string }) {
  const intl = useIntl()

  const createdDate = new Date(project.created_at).toLocaleDateString(intl.locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Link
      href={`/dashboard/organizations/${orgId}/projects/${project.id}`}
      className="group relative flex h-[190px] justify-between overflow-hidden rounded-lg border border-border bg-background-secondary p-6 transition-all hover:border-terminal-green/50 hover:shadow-lg"
    >
      <div>
        <h3 className="mb-2 font-semibold text-foreground transition-colors group-hover:text-terminal-green">
          {project.name}
        </h3>

        <div className="text-xs text-foreground-subtle">
          <span>
            <FormattedMessage id="projects.createdDate" values={{ date: createdDate }} />
          </span>
        </div>
      </div>

      <div className="text-foreground-muted transition-colors group-hover:text-terminal-green">
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
