'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useIntl } from '@/lib/i18n'
import { organizationService } from '@/lib/organizations/organization.service'
import { projectService } from '@/lib/projects/project.service'
import Logo from '@/components/layout/Logo'
import { Icon } from '@/components/ui'
import { BreadcrumbItem } from './Breadcrumb'
import {
  getOrgIdFromPath,
  getProjectIdFromPath,
  isOrganizationPage,
  isProjectPage,
  isNewProjectPage
} from './utils'

interface UseBreadcrumbsOptions {
  pathname: string
}

interface UseBreadcrumbsReturn {
  breadcrumbs: BreadcrumbItem[]
  isLoading: boolean
  error: string | null
}

export const useBreadcrumbs = ({ pathname }: UseBreadcrumbsOptions): UseBreadcrumbsReturn => {
  const intl = useIntl()
  const [organizationName, setOrganizationName] = useState<string | null>(null)
  const [projectName, setProjectName] = useState<string | null>(null)
  const [isLoadingOrg, setIsLoadingOrg] = useState(false)
  const [isLoadingProject, setIsLoadingProject] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch organization and project names when needed
  useEffect(() => {
    const fetchData = async () => {
      const orgId = getOrgIdFromPath(pathname)
      const projectId = getProjectIdFromPath(pathname)

      // Reset states
      setOrganizationName(null)
      setProjectName(null)
      setError(null)

      if (orgId && isOrganizationPage(pathname)) {
        setIsLoadingOrg(true)
        try {
          const org = await organizationService.getOrganization(orgId)
          if (org) {
            setOrganizationName(org.name)
          }
        } catch (err) {
          console.error('Failed to fetch organization:', err)
          setError('Failed to load organization')
        } finally {
          setIsLoadingOrg(false)
        }

        // If it's a project page, fetch project details too
        if (projectId && isProjectPage(pathname)) {
          setIsLoadingProject(true)
          try {
            const project = await projectService.getProject(projectId)
            if (project) {
              setProjectName(project.name)
            }
          } catch (err) {
            console.error('Failed to fetch project:', err)
            setError('Failed to load project')
          } finally {
            setIsLoadingProject(false)
          }
        }
      }
    }

    fetchData()
  }, [pathname])

  // Build breadcrumb items based on current path
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = []
    const orgId = getOrgIdFromPath(pathname)

    // Always start with logo/home
    items.push({
      label: 'C',
      href: '/dashboard',
      icon: (
        <Link
          href="/dashboard/organizations"
          className="flex h-8 w-8 items-center justify-center rounded-md bg-terminal-green"
        >
          <Logo iconOnly />
        </Link>
      ),
    })

    // Simple breadcrumb logic
    if (pathname === '/dashboard/organizations') {
      items.push({
        label: intl.formatMessage({ id: 'dashboard.breadcrumb.organizations' }),
        labelId: 'dashboard.breadcrumb.organizations',
      })
    } else if (pathname === '/dashboard/organizations/new') {
      items.push({
        label: intl.formatMessage({ id: 'dashboard.breadcrumb.newOrganization' }),
        labelId: 'dashboard.breadcrumb.newOrganization',
      })
    } else if (isOrganizationPage(pathname)) {
      // Add organization breadcrumb
      // Make it clickable if we're on any project-related page
      const isOnProjectRelatedPage = isProjectPage(pathname) || isNewProjectPage(pathname)

      items.push({
        label: isLoadingOrg
          ? intl.formatMessage({ id: 'common.loading' })
          : organizationName || intl.formatMessage({ id: 'dashboard.breadcrumb.organization' }),
        href: isOnProjectRelatedPage && orgId ? `/dashboard/organizations/${orgId}` : undefined,
        icon: <Icon name="organization" size="sm" />,
      })

      // Add project breadcrumb if on project page (but never clickable)
      if (isNewProjectPage(pathname)) {
        items.push({
          label: intl.formatMessage({ id: 'dashboard.breadcrumb.newProject' }),
          labelId: 'dashboard.breadcrumb.newProject',
        })
      } else if (isProjectPage(pathname)) {
        items.push({
          label: isLoadingProject
            ? intl.formatMessage({ id: 'common.loading' })
            : projectName || intl.formatMessage({ id: 'dashboard.breadcrumb.project' }),
          icon: <Icon name="folder" size="sm" />,
        })
      }
    }

    return items
  }

  const breadcrumbs = getBreadcrumbs()
  const isLoading = isLoadingOrg || isLoadingProject

  return {
    breadcrumbs,
    isLoading,
    error
  }
}