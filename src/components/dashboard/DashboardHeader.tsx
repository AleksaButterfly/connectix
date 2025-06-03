'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import UserMenu from '../layout/UserMenu'
import { useEffect, useState } from 'react'
import { organizationService } from '@/lib/organizations/organization.service'
import { useIntl, FormattedMessage } from '@/lib/i18n'

// Define organization pages that should show the org name
const ORGANIZATION_PAGES = [
  '/dashboard/organizations/[id]',
  '/dashboard/organizations/[id]/team',
  '/dashboard/organizations/[id]/settings',
  '/dashboard/organizations/[id]/projects',
  '/dashboard/organizations/[id]/projects/[projectId]',
]

interface BreadcrumbItem {
  label: string
  labelId?: string // For i18n translation keys
  href?: string
  icon?: React.ReactNode
}

export default function DashboardHeader() {
  const intl = useIntl()
  const { user } = useAuthStore()
  const pathname = usePathname()
  const [organizationName, setOrganizationName] = useState<string | null>(null)
  const [isLoadingOrg, setIsLoadingOrg] = useState(false)

  // Extract organization ID from pathname
  const getOrgIdFromPath = (path: string): string | null => {
    const match = path.match(/\/dashboard\/organizations\/([a-f0-9-]{36})/)
    return match ? match[1] : null
  }

  // Check if current path is an organization page
  const isOrganizationPage = (path: string): boolean => {
    const orgId = getOrgIdFromPath(path)
    if (!orgId) return false

    // Check if the path matches any of our organization page patterns
    return ORGANIZATION_PAGES.some((pattern) => {
      const regex = pattern.replace('[id]', orgId).replace('[projectId]', '[a-f0-9-]{36}')
      return new RegExp(`^${regex}$`).test(path)
    })
  }

  // Fetch organization name when on org pages
  useEffect(() => {
    const fetchOrgName = async () => {
      const orgId = getOrgIdFromPath(pathname)

      if (orgId && isOrganizationPage(pathname)) {
        setIsLoadingOrg(true)
        try {
          const org = await organizationService.getOrganization(orgId)
          if (org) {
            setOrganizationName(org.name)
          }
        } catch (error) {
          console.error('Failed to fetch organization:', error)
          setOrganizationName(null)
        } finally {
          setIsLoadingOrg(false)
        }
      } else {
        setOrganizationName(null)
        setIsLoadingOrg(false)
      }
    }

    fetchOrgName()
  }, [pathname])

  // Build breadcrumb items based on current path
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = []

    // Always start with logo/home
    items.push({
      label: 'C',
      href: '/dashboard',
      icon: (
        <Link
          href="/dashboard/organizations"
          className="flex h-8 w-8 items-center justify-center rounded-md bg-terminal-green"
        >
          <span className="text-sm font-bold text-background">C</span>
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
      // For any organization page, just show the org name
      items.push({
        label: isLoadingOrg
          ? intl.formatMessage({ id: 'common.loading' })
          : organizationName || intl.formatMessage({ id: 'dashboard.breadcrumb.organization' }),
        icon: (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        ),
      })
    }

    return items
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-3">
        {/* Logo and Breadcrumbs */}
        <div className="flex items-center">
          <nav className="flex items-center text-sm">
            {breadcrumbs.map((item, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && (
                  <svg
                    className="mx-4 h-3.5 w-3.5 text-foreground-muted"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}

                <div className="flex items-center gap-2 text-foreground">
                  {item.icon}
                  {(index > 0 || !item.icon) && (
                    <span className="font-medium">
                      {item.labelId ? (
                        <FormattedMessage id={item.labelId} defaultMessage={item.label} />
                      ) : (
                        item.label
                      )}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Future: Add notifications, help, etc. */}

          {/* User Menu */}
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  )
}
