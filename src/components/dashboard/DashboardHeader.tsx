'use client'

import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import UserMenu from '../layout/UserMenu'
import { Breadcrumb } from './header/Breadcrumb'
import { useBreadcrumbs } from './header/useBreadcrumbs'

export default function DashboardHeader() {
  const { user } = useAuthStore()
  const pathname = usePathname()
  const { breadcrumbs } = useBreadcrumbs({ pathname })

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-3">
        {/* Logo and Breadcrumbs */}
        <div className="flex items-center">
          <Breadcrumb items={breadcrumbs} />
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
