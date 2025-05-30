'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { organizationService } from '@/lib/organizations/organization.service'
import type { Organization } from '@/types/organization'

export default function OrganizationProjectsPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.id as string
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const org = await organizationService.getOrganization(orgId)
        if (!org) {
          router.push('/dashboard/organizations')
          return
        }
        setOrganization(org)
        // TODO: Fetch projects when project service is ready
        setProjects([])
      } catch (error) {
        console.error('Failed to fetch organization:', error)
        router.push('/dashboard/organizations')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [orgId, router])

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
          <p className="text-foreground-muted">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Projects</h1>
        <p className="mt-2 text-foreground-muted">
          Manage your SSH connections and server configurations
        </p>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background-secondary/50 p-8 text-center">
          <div className="mx-auto max-w-sm">
            <div className="mb-4 text-5xl">📁</div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">No projects yet</h3>
            <p className="mb-6 text-sm text-foreground-muted">
              Create your first project to start organizing your SSH connections and server
              configurations.
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
              New Project
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Project cards will go here */}
          {projects.map((project: any) => (
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
              <span className="text-sm font-medium text-foreground">New Project</span>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

function ProjectCard({ project, orgId }: { project: any; orgId: string }) {
  const createdDate = new Date(project.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Link
      href={`/dashboard/organizations/${orgId}/projects/${project.id}`}
      className="group relative overflow-hidden rounded-lg border border-border bg-background-secondary p-6 transition-all hover:border-terminal-green/50 hover:shadow-lg"
    >
      <div className="mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-terminal-green/10 text-terminal-green">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        </div>
      </div>

      <h3 className="mb-1 font-semibold text-foreground transition-colors group-hover:text-terminal-green">
        {project.name}
      </h3>
      <p className="mb-4 line-clamp-2 text-sm text-foreground-muted">
        {project.description || 'No description'}
      </p>

      <div className="flex items-center gap-2 text-xs text-foreground-subtle">
        <span>{project.serversCount || 0} servers</span>
        <span>•</span>
        <span>Created {createdDate}</span>
      </div>
    </Link>
  )
}
