'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FormattedMessage } from '@/lib/i18n'
import { Button, Icon, useToast } from '@/components/ui'
import type { ProjectWithDetails } from '@/types/project'
import type { Organization } from '@/types/organization'

interface ProjectHeaderProps {
  project: ProjectWithDetails
  organization: Organization
  isAdmin: boolean
  orgId: string
}

export const ProjectHeader = ({ project, organization, isAdmin, orgId }: ProjectHeaderProps) => {
  const [isCopied, setIsCopied] = useState(false)
  const { toast } = useToast()

  const handleCopyProjectId = () => {
    navigator.clipboard.writeText(project.id)
    setIsCopied(true)
    toast.success(<FormattedMessage id="projects.overview.idCopied" />)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    const diffInWeeks = Math.floor(diffInDays / 7)
    const diffInMonths = Math.floor(diffInDays / 30)
    const diffInYears = Math.floor(diffInDays / 365)

    if (diffInDays === 0) {
      return <FormattedMessage id="projects.overview.createdToday" />
    } else if (diffInDays === 1) {
      return <FormattedMessage id="projects.overview.createdYesterday" />
    } else if (diffInDays < 7) {
      return <FormattedMessage id="projects.overview.createdDaysAgo" values={{ days: diffInDays }} />
    } else if (diffInWeeks < 4) {
      return <FormattedMessage id="projects.overview.createdWeeksAgo" values={{ weeks: diffInWeeks }} />
    } else if (diffInMonths < 12) {
      return <FormattedMessage id="projects.overview.createdMonthsAgo" values={{ months: diffInMonths }} />
    } else {
      return <FormattedMessage id="projects.overview.createdYearsAgo" values={{ years: diffInYears }} />
    }
  }

  return (
    <div className="mb-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href={`/dashboard/organizations/${orgId}`}
          className="inline-flex items-center gap-2 text-sm text-terminal-green hover:text-terminal-green/80"
        >
          <Icon name="chevronLeft" size="sm" />
          <FormattedMessage id="projects.overview.backToOrganization" />
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            {isAdmin && (
              <span className="rounded-full bg-terminal-green/10 px-2 py-1 text-xs font-medium text-terminal-green">
                <FormattedMessage id="projects.overview.adminBadge" />
              </span>
            )}
          </div>
          {project.description && (
            <p className="mt-2 text-foreground-muted">{project.description}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-foreground-muted">
            <span>{formatDate(project.created_at)}</span>
            {project.created_by_username && (
              <span>
                <FormattedMessage
                  id="projects.details.createdBy"
                />{' '}
                {project.created_by_username}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleCopyProjectId}
            leftIcon={<Icon name={isCopied ? 'check' : 'copy'} size="sm" />}
          >
            {isCopied ? <FormattedMessage id="common.copied" /> : <FormattedMessage id="projects.overview.projectId" />}
          </Button>
          {isAdmin && (
            <Link href={`/dashboard/organizations/${orgId}/projects/${project.id}/settings`}>
              <Button
                variant="secondary"
                leftIcon={<Icon name="settings" size="sm" />}
              >
                <FormattedMessage id="projects.overview.settings" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}