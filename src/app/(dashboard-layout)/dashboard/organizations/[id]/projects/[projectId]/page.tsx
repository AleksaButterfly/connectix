'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { projectService } from '@/lib/projects/project.service'
import { organizationService } from '@/lib/organizations/organization.service'
import { useConnections } from '@/hooks/useConnections'
import type { ProjectWithDetails } from '@/types/project'
import type { Organization } from '@/types/organization'
import { useIntl, FormattedMessage } from '@/lib/i18n'
import { useToast } from '@/components/ui/ToastContext'

export default function ProjectOverviewPage() {
  const intl = useIntl()
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const orgId = params.id as string
  const projectId = params.projectId as string
  const [project, setProject] = useState<ProjectWithDetails | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  // Get connection data
  const { connections, loadConnections } = useConnections({
    organizationId: orgId,
    projectId: projectId,
  })

  useEffect(() => {
    fetchData()
  }, [orgId, projectId])

  useEffect(() => {
    if (orgId && projectId) {
      loadConnections()
    }
  }, [orgId, projectId, loadConnections])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Check access first
      const hasAccess = await projectService.checkProjectAccess(projectId)
      if (!hasAccess) {
        router.push(`/dashboard/organizations/${orgId}`)
        return
      }

      // Check admin access
      const adminAccess = await projectService.checkProjectAdminAccess(projectId)
      setIsAdmin(adminAccess)

      // Fetch project details
      const [proj, org] = await Promise.all([
        projectService.getProject(projectId),
        organizationService.getOrganization(orgId),
      ])

      if (!proj || !org) {
        router.push(`/dashboard/organizations/${orgId}`)
        return
      }

      // Get project with details (including creator username)
      const projects = await projectService.getOrganizationProjects(orgId)
      const projectWithDetails = projects.find((p) => p.id === projectId)

      // If we have projectWithDetails, use it; otherwise create a ProjectWithDetails object
      if (projectWithDetails) {
        setProject(projectWithDetails)
      } else {
        // Convert Project to ProjectWithDetails
        const enhancedProject: ProjectWithDetails = {
          ...proj,
          created_by_username: null,
        }
        setProject(enhancedProject)
      }

      setOrganization(org)
    } catch (err: any) {
      console.error('Failed to fetch project:', err)
      setError(err.message || intl.formatMessage({ id: 'projects.error.loadFailed' }))
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyProjectId = () => {
    if (project?.id) {
      navigator.clipboard.writeText(project.id)
      setIsCopied(true)
      toast.success(intl.formatMessage({ id: 'projects.overview.idCopied' }))
      setTimeout(() => setIsCopied(false), 2000)
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
            <FormattedMessage id="projects.overview.loading" />
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

  const timeSinceCreation = () => {
    const created = new Date(project.created_at)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return intl.formatMessage({ id: 'projects.overview.createdToday' })
    if (diffInDays === 1) return intl.formatMessage({ id: 'projects.overview.createdYesterday' })
    if (diffInDays < 7)
      return intl.formatMessage({ id: 'projects.overview.createdDaysAgo' }, { days: diffInDays })
    if (diffInDays < 30)
      return intl.formatMessage(
        { id: 'projects.overview.createdWeeksAgo' },
        { weeks: Math.floor(diffInDays / 7) }
      )
    if (diffInDays < 365)
      return intl.formatMessage(
        { id: 'projects.overview.createdMonthsAgo' },
        { months: Math.floor(diffInDays / 30) }
      )
    return intl.formatMessage(
      { id: 'projects.overview.createdYearsAgo' },
      { years: Math.floor(diffInDays / 365) }
    )
  }

  // Connection stats
  const activeConnections = connections.filter(
    (conn) => conn.connection_test_status === 'success'
  ).length

  const totalConnections = connections.length
  const hasConnections = totalConnections > 0

  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      {/* Page Header with Hero Section */}
      <div className="mb-8 rounded-lg border border-border bg-gradient-to-r from-background-secondary to-background-tertiary p-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
              {isAdmin && (
                <span className="rounded-full bg-terminal-green/10 px-3 py-1 text-xs font-medium text-terminal-green">
                  <FormattedMessage id="projects.overview.adminBadge" />
                </span>
              )}
            </div>

            {project.description && (
              <p className="mb-4 text-lg text-foreground-muted">{project.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-foreground-muted">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span>{organization.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{timeSinceCreation()}</span>
              </div>
              {hasConnections && (
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span>
                    <FormattedMessage
                      id="projects.overview.connectionsCount"
                      values={{ count: totalConnections }}
                    />
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="ml-6 flex gap-2">
            <Link
              href={`/dashboard/organizations/${orgId}/projects/${projectId}/connections`}
              className="btn-primary flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <FormattedMessage id="projects.overview.sshConnections" />
            </Link>
            {isAdmin && (
              <Link
                href={`/dashboard/organizations/${orgId}/projects/${projectId}/settings`}
                className="btn-secondary flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <FormattedMessage id="projects.overview.settings" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-background-secondary p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-terminal-green/10">
              <svg
                className="h-5 w-5 text-terminal-green"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-foreground-muted">
                <FormattedMessage id="projects.overview.status" />
              </p>
              <p className="text-lg font-semibold text-foreground">
                <FormattedMessage id="projects.overview.statusActive" />
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background-secondary p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <svg
                className="h-5 w-5 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-foreground-muted">
                <FormattedMessage id="projects.overview.sshConnections" />
              </p>
              <p className="text-lg font-semibold text-foreground">
                {totalConnections}
                {totalConnections > 0 && (
                  <span className="ml-2 text-xs text-terminal-green">
                    <FormattedMessage
                      id="projects.overview.activeCount"
                      values={{ count: activeConnections }}
                    />
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background-secondary p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <svg
                className="h-5 w-5 text-purple-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-foreground-muted">
                <FormattedMessage id="projects.overview.projectId" />
              </p>
              <p className="text-lg font-semibold text-foreground" title={project.id}>
                {project.id.substring(0, 8)}...
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyProjectId}
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-200 ${
                isCopied
                  ? 'border-terminal-green bg-terminal-green/10 text-terminal-green'
                  : 'border-border bg-background-tertiary text-foreground-muted hover:bg-background-secondary hover:text-foreground'
              }`}
              title={intl.formatMessage({
                id: isCopied ? 'projects.overview.copied' : 'projects.overview.copyId',
              })}
            >
              {isCopied ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background-secondary p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
              <svg
                className="h-5 w-5 text-orange-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-foreground-muted">
                <FormattedMessage id="projects.overview.connectionHealth" />
              </p>
              <p className="text-lg font-semibold text-foreground">
                {totalConnections === 0 ? (
                  <span className="text-foreground-muted">
                    <FormattedMessage id="projects.overview.noConnections" />
                  </span>
                ) : activeConnections === totalConnections ? (
                  <span className="text-terminal-green">
                    <FormattedMessage id="projects.overview.healthExcellent" />
                  </span>
                ) : activeConnections > totalConnections / 2 ? (
                  <span className="text-yellow-500">
                    <FormattedMessage id="projects.overview.healthGood" />
                  </span>
                ) : (
                  <span className="text-red-500">
                    <FormattedMessage id="projects.overview.healthIssues" />
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - 2 cols */}
        <div className="space-y-6 lg:col-span-2">
          {/* Getting Started Card */}
          <div className="rounded-lg border border-border bg-background-secondary">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">
                <FormattedMessage id="projects.overview.gettingStarted" />
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-terminal-green/30 bg-terminal-green/10">
                    {hasConnections ? (
                      <svg
                        className="h-5 w-5 text-terminal-green"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <span className="text-sm font-medium text-terminal-green">1</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 font-medium text-foreground">
                      <FormattedMessage id="projects.overview.step1Title" />
                    </h3>
                    <p className="text-sm text-foreground-muted">
                      <FormattedMessage id="projects.overview.step1Description" />
                    </p>
                    {!hasConnections && (
                      <Link
                        href={`/dashboard/organizations/${orgId}/projects/${projectId}/connections`}
                        className="hover:text-terminal-green-hover mt-2 inline-flex items-center gap-1 text-sm text-terminal-green"
                      >
                        <FormattedMessage id="projects.overview.addFirstConnection" />
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                      hasConnections
                        ? 'border-terminal-green/30 bg-terminal-green/10'
                        : 'border-foreground-muted/30 bg-foreground-muted/10'
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        hasConnections ? 'text-terminal-green' : 'text-foreground-muted'
                      }`}
                    >
                      2
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 font-medium text-foreground">
                      <FormattedMessage id="projects.overview.step2Title" />
                    </h3>
                    <p className="text-sm text-foreground-muted">
                      <FormattedMessage id="projects.overview.step2Description" />
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                      hasConnections
                        ? 'border-terminal-green/30 bg-terminal-green/10'
                        : 'border-foreground-muted/30 bg-foreground-muted/10'
                    }`}
                  >
                    <span
                      className={`text-sm font-medium ${
                        hasConnections ? 'text-terminal-green' : 'text-foreground-muted'
                      }`}
                    >
                      3
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-1 font-medium text-foreground">
                      <FormattedMessage id="projects.overview.step3Title" />
                    </h3>
                    <p className="text-sm text-foreground-muted">
                      <FormattedMessage id="projects.overview.step3Description" />
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Connections Overview Card */}
          {hasConnections && (
            <div className="rounded-lg border border-border bg-background-secondary">
              <div className="border-b border-border px-6 py-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">
                    <FormattedMessage id="projects.overview.sshConnections" />
                  </h2>
                  <Link
                    href={`/dashboard/organizations/${orgId}/projects/${projectId}/connections`}
                    className="hover:text-terminal-green-hover text-sm text-terminal-green"
                  >
                    <FormattedMessage id="projects.overview.viewAll" />
                  </Link>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {connections.slice(0, 3).map((connection) => (
                    <div
                      key={connection.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            connection.connection_test_status === 'success'
                              ? 'bg-terminal-green'
                              : connection.connection_test_status === 'failed'
                                ? 'bg-red-500'
                                : 'bg-foreground-muted'
                          }`}
                        />
                        <div>
                          <p className="font-medium text-foreground">{connection.name}</p>
                          <p className="text-xs text-foreground-muted">
                            {connection.username}@{connection.host}:{connection.port}
                          </p>
                        </div>
                      </div>
                      <Link
                        href={`/dashboard/organizations/${orgId}/projects/${projectId}/connections/${connection.id}/browse`}
                        className="btn-secondary btn-sm"
                      >
                        <FormattedMessage id="projects.overview.browse" />
                      </Link>
                    </div>
                  ))}
                  {connections.length > 3 && (
                    <p className="text-center text-sm text-foreground-muted">
                      <FormattedMessage
                        id="projects.overview.moreConnections"
                        values={{ count: connections.length - 3 }}
                      />
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Recent Activity Card */}
          <div className="rounded-lg border border-border bg-background-secondary">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">
                <FormattedMessage id="projects.overview.recentActivity" />
              </h2>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-center py-8 text-center">
                <div>
                  <svg
                    className="mx-auto mb-4 h-12 w-12 text-foreground-muted/30"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm text-foreground-muted">
                    <FormattedMessage id="projects.overview.noActivity" />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - 1 col */}
        <div className="space-y-6">
          {/* Project Details Card */}
          <div className="rounded-lg border border-border bg-background-secondary">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">
                <FormattedMessage id="projects.details.title" />
              </h2>
            </div>
            <div className="p-6">
              <dl className="space-y-4">
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
                <div>
                  <dt className="text-sm text-foreground-muted">
                    <FormattedMessage id="projects.details.projectSlug" />
                  </dt>
                  <dd className="mt-1 font-mono text-sm text-foreground">{project.slug}</dd>
                </div>
                <div>
                  <dt className="text-sm text-foreground-muted">
                    <FormattedMessage id="projects.overview.sshConnections" />
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {totalConnections === 0 ? (
                      <span className="text-foreground-muted">
                        <FormattedMessage id="projects.overview.noneConfigured" />
                      </span>
                    ) : (
                      <span>
                        <FormattedMessage
                          id="projects.overview.connectionStats"
                          values={{ total: totalConnections, healthy: activeConnections }}
                        />
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Quick Links Card */}
          <div className="rounded-lg border border-border bg-background-secondary">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">
                <FormattedMessage id="projects.overview.quickLinks" />
              </h2>
            </div>
            <div className="p-6">
              <nav className="space-y-2">
                <Link
                  href={`/dashboard/organizations/${orgId}/projects/${projectId}/connections`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-background-tertiary"
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
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span className="text-foreground">
                    <FormattedMessage id="projects.overview.sshConnections" />
                  </span>
                </Link>
                {isAdmin && (
                  <Link
                    href={`/dashboard/organizations/${orgId}/projects/${projectId}/settings`}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-background-tertiary"
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
                      <FormattedMessage id="projects.overview.projectSettings" />
                    </span>
                  </Link>
                )}
                <Link
                  href={`/dashboard/organizations/${orgId}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-background-tertiary"
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
                      d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                    />
                  </svg>
                  <span className="text-foreground">
                    <FormattedMessage id="projects.overview.backToOrganization" />
                  </span>
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
