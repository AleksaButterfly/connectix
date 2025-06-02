'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { organizationService } from '@/lib/organizations/organization.service'
import type { OrganizationWithDetails } from '@/types/organization'

export default function OrganizationsPage() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<OrganizationWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    try {
      setIsLoading(true)
      const orgs = await organizationService.getOrganizations()
      setOrganizations(orgs)
    } catch (err: any) {
      setError(err.message || 'Failed to load organizations')
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewOrganization = () => {
    router.push('/dashboard/organizations/new')
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-6xl px-6 py-8">
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
            <p className="text-foreground-muted">Loading organizations...</p>
          </div>
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
            <button onClick={loadOrganizations} className="btn-secondary">
              Try again
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
        <h1 className="text-3xl font-bold text-foreground">Your Organizations</h1>
        <p className="mt-2 text-foreground-muted">
          Manage your organizations and collaborate with your team
        </p>
      </div>

      {/* Organizations Grid */}
      {organizations.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background-secondary/50 p-8 text-center">
          <div className="mx-auto max-w-sm">
            <div className="mb-4 text-5xl">🏢</div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">No organizations yet</h3>
            <p className="mb-6 text-sm text-foreground-muted">
              Create your first organization to start managing your SSH connections and
              collaborating with your team.
            </p>
            <button
              onClick={handleNewOrganization}
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
              New Organization
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Organization cards */}
          {organizations.map((org) => (
            <OrganizationCard key={org.id} organization={org} />
          ))}

          {/* New Organization Card */}
          <button
            onClick={handleNewOrganization}
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
              <span className="text-sm font-medium text-foreground">New Organization</span>
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

function OrganizationCard({ organization }: { organization: OrganizationWithDetails }) {
  const createdDate = new Date(organization.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Link
      href={`/dashboard/organizations/${organization.id}`}
      className="group relative overflow-hidden rounded-lg border border-border bg-background-secondary p-6 transition-all hover:border-terminal-green/50 hover:shadow-lg"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-terminal-green/10 text-terminal-green">
          <span className="text-xl font-bold">{organization.name[0].toUpperCase()}</span>
        </div>
        <span className="rounded-full bg-background-tertiary px-2 py-1 text-xs text-foreground-muted">
          Free
        </span>
      </div>

      <h3 className="mb-1 font-semibold text-foreground transition-colors group-hover:text-terminal-green">
        {organization.name}
      </h3>
      <p className="mb-4 text-sm text-foreground-muted">
        {organization.projectsCount} {organization.projectsCount === 1 ? 'project' : 'projects'}
      </p>

      <div className="flex items-center gap-2 text-xs text-foreground-subtle">
        <span>
          {organization.membersCount} {organization.membersCount === 1 ? 'member' : 'members'}
        </span>
        <span>•</span>
        <span>Created {createdDate}</span>
      </div>
    </Link>
  )
}
