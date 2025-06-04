'use client'

import { useState, useEffect } from 'react'
import { useParams, usePathname } from 'next/navigation'
import Link from 'next/link'
import { organizationService } from '@/lib/organizations/organization.service'
import type { Organization } from '@/types/organization'

interface SidebarItem {
  label: string
  href: string
  icon: React.ReactNode
  active?: boolean
}

export default function OrganizationLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const pathname = usePathname()
  const orgId = params.id as string
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [organization, setOrganization] = useState<Organization | null>(null)

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const org = await organizationService.getOrganization(orgId)
        setOrganization(org)
      } catch (error) {
        console.error('Failed to fetch organization:', error)
      }
    }
    fetchOrganization()
  }, [orgId])

  // Define sidebar items
  const sidebarItems: SidebarItem[] = [
    {
      label: 'Projects',
      href: `/dashboard/organizations/${orgId}`,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z"
          />
        </svg>
      ),
      active: pathname === `/dashboard/organizations/${orgId}`,
    },
    {
      label: 'Team',
      href: `/dashboard/organizations/${orgId}/team`,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      active: pathname === `/dashboard/organizations/${orgId}/team`,
    },
    {
      label: 'Settings',
      href: `/dashboard/organizations/${orgId}/settings`,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      ),
      active: pathname === `/dashboard/organizations/${orgId}/settings`,
    },
  ]

  return (
    <div className="flex h-full">
      {/* Sidebar Container - Fixed width for collapsed state */}
      <div className="relative flex-shrink-0">
        {/* Sidebar - Absolute positioning for overlay effect */}
        <aside
          className={`fixed bottom-0 left-0 top-16 z-10 border-r border-border bg-background-secondary transition-[width] duration-300 ease-in-out ${
            isCollapsed ? 'w-[56px]' : 'w-64'
          }`}
          onMouseEnter={() => setIsCollapsed(false)}
          onMouseLeave={() => setIsCollapsed(true)}
        >
          <div className="flex h-full flex-col">
            {/* Navigation */}
            <nav className="flex-1 py-3">
              <ul className="space-y-2 px-2">
                {sidebarItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`group relative flex h-10 items-center rounded-lg transition-colors duration-200 ${
                        item.active
                          ? 'bg-terminal-green/10 text-terminal-green'
                          : 'text-foreground-muted hover:bg-background-tertiary hover:text-foreground'
                      }`}
                    >
                      {/* Icon container - fixed width to prevent shifting */}
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                        <div className="flex h-6 w-6 items-center justify-center">{item.icon}</div>
                      </div>

                      {/* Label - animated */}
                      <span
                        className={`absolute left-10 whitespace-nowrap text-sm transition-opacity duration-300 ${
                          isCollapsed ? 'pointer-events-none opacity-0' : 'opacity-100'
                        }`}
                      >
                        {item.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Bottom Action */}
            <div className="border-t border-border py-3">
              <div className="px-2">
                <Link
                  href="/dashboard/organizations"
                  className="group relative flex h-10 items-center rounded-lg text-foreground-muted transition-colors duration-200 hover:bg-background-tertiary hover:text-foreground"
                >
                  {/* Icon container - fixed width to prevent shifting */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center">
                    <div className="flex h-6 w-6 items-center justify-center">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 17l-5-5m0 0l5-5m-5 5h12"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Label - animated */}
                  <span
                    className={`absolute left-10 whitespace-nowrap text-sm transition-opacity duration-300 ${
                      isCollapsed ? 'pointer-events-none opacity-0' : 'opacity-100'
                    }`}
                  >
                    All Organizations
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Content - Takes remaining space */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}
