'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import UserMenu from './UserMenu'
import { useEffect, useState } from 'react'
import { organizationService } from '@/lib/organizations/organization.service'

export default function DashboardHeader() {
  const { user } = useAuthStore()
  const pathname = usePathname()
  const [organizationName, setOrganizationName] = useState<string | null>(null)

  // Extract organization ID from pathname if viewing a specific org
  useEffect(() => {
    const fetchOrgName = async () => {
      // Match pattern like /dashboard/organizations/[uuid]
      const orgMatch = pathname.match(/^\/dashboard\/organizations\/([a-f0-9-]{36})/)
      if (orgMatch) {
        const orgId = orgMatch[1]
        try {
          const org = await organizationService.getOrganization(orgId)
          if (org) {
            setOrganizationName(org.name)
          }
        } catch (error) {
          console.error('Failed to fetch organization:', error)
        }
      } else {
        setOrganizationName(null)
      }
    }

    fetchOrgName()
  }, [pathname])

  // Build breadcrumb items based on current path
  const getBreadcrumbs = () => {
    const items: Array<{ label: string; href?: string; icon?: React.ReactNode }> = []

    // Always start with logo/home
    items.push({
      label: 'C',
      href: '/dashboard/organizations',
      icon: (
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-terminal-green">
          <span className="text-sm font-bold text-background">C</span>
        </div>
      ),
    })

    // Add path-specific breadcrumbs
    if (pathname === '/dashboard/organizations') {
      items.push({ label: 'Organizations' })
    } else if (pathname === '/dashboard/organizations/new') {
      items.push({ label: 'New Organization' })
    } else if (pathname.match(/^\/dashboard\/organizations\/[a-f0-9-]{36}$/)) {
      // Viewing specific organization
      items.push({
        label: organizationName || 'Loading...',
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
    // Add more patterns as needed for projects, settings, etc.

    return items
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo and Breadcrumbs */}
        <div className="flex items-center">
          <nav className="flex items-center space-x-2 text-sm">
            {breadcrumbs.map((item, index) => (
              <div key={index} className="flex items-center">
                {index > 0 && (
                  <svg
                    className="mx-2 h-4 w-4 text-foreground-muted"
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

                {item.href ? (
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 text-foreground-muted transition-colors hover:text-foreground"
                  >
                    {item.icon}
                    {index > 0 && <span>{item.label}</span>}
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 text-foreground">
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Future: Add notifications, etc. */}

          {/* User Menu */}
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  )
}
