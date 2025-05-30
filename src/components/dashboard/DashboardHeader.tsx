'use client'

import Link from 'next/link'
import { useAuthStore } from '@/stores/auth.store'
import UserMenu from './UserMenu'

export default function DashboardHeader() {
  const { user } = useAuthStore()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-terminal-green">
            <span className="text-sm font-bold text-background">C</span>
          </div>
          <span className="text-lg font-semibold text-foreground">Connectix</span>
        </Link>

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
