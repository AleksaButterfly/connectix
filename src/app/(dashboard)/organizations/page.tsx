'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState([])

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
            <button className="btn-primary inline-flex items-center gap-2">
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
          {/* Organization cards will go here */}
          {organizations.map((org) => (
            <OrganizationCard key={org.id} organization={org} />
          ))}

          {/* New Organization Card */}
          <button className="group relative overflow-hidden rounded-lg border border-dashed border-border bg-background-secondary/50 p-6 text-left transition-all hover:border-terminal-green/50 hover:bg-background-secondary">
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

function OrganizationCard({ organization }: { organization: any }) {
  return (
    <Link
      href={`/${organization.slug}`}
      className="group relative overflow-hidden rounded-lg border border-border bg-background-secondary p-6 transition-all hover:border-terminal-green/50 hover:shadow-lg"
    >
      <div className="mb-4 flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-terminal-green/10 text-terminal-green">
          <span className="text-xl font-bold">{organization.name[0].toUpperCase()}</span>
        </div>
        <span className="rounded-full bg-background-tertiary px-2 py-1 text-xs text-foreground-muted">
          {organization.plan || 'Free'}
        </span>
      </div>

      <h3 className="mb-1 font-semibold text-foreground transition-colors group-hover:text-terminal-green">
        {organization.name}
      </h3>
      <p className="mb-4 text-sm text-foreground-muted">
        {organization.projectsCount || 0} projects
      </p>

      <div className="flex items-center gap-2 text-xs text-foreground-subtle">
        <span>{organization.membersCount || 1} members</span>
        <span>•</span>
        <span>Created {organization.createdAt}</span>
      </div>
    </Link>
  )
}
