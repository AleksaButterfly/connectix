'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth/auth.service'
import type { User } from '@supabase/supabase-js'

interface UserMenuProps {
  user: User | null
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await authService.signOut()
    router.push('/')
  }

  const getInitials = (email: string) => {
    const name = email.split('@')[0]
    const parts = name.split(/[._-]/)
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  if (!user) return null

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background-secondary text-sm font-medium text-foreground transition-colors hover:bg-background-tertiary focus:outline-none focus:ring-2 focus:ring-terminal-green focus:ring-offset-2 focus:ring-offset-background"
      >
        {user.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt={user.email || 'User'}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          getInitials(user.email || 'U')
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="animate-in fade-in slide-in-from-top-2 absolute right-0 mt-2 w-64 origin-top-right duration-200">
          <div className="overflow-hidden rounded-lg border border-border bg-background shadow-lg">
            {/* User Info - UPDATED SECTION */}
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-medium text-foreground">
                {user.user_metadata?.username || user.email?.split('@')[0]}
              </p>
              {/* Option 1: Truncate with ellipsis */}
              <p className="mt-1 truncate text-xs text-foreground-muted" title={user.email}>
                {user.email}
              </p>

              {/* Option 2: Break into two lines
              <p className="mt-1 break-all text-xs text-foreground-muted">
                {user.email}
              </p>
              */}

              {/* Option 3: Smart truncation - show start and end
              <p className="mt-1 text-xs text-foreground-muted" title={user.email}>
                {user.email && user.email.length > 30 
                  ? `${user.email.slice(0, 15)}...${user.email.slice(-12)}`
                  : user.email}
              </p>
              */}
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/account')
                }}
                className="flex w-full items-center px-4 py-2 text-sm text-foreground transition-colors hover:bg-background-secondary"
              >
                <svg
                  className="mr-3 h-4 w-4 text-foreground-muted"
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
                Account Settings
              </button>

              <div className="my-1 border-t border-border" />

              <button
                onClick={() => {
                  setIsOpen(false)
                  handleSignOut()
                }}
                className="flex w-full items-center px-4 py-2 text-sm text-foreground transition-colors hover:bg-background-secondary"
              >
                <svg
                  className="mr-3 h-4 w-4 text-foreground-muted"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Alternative: Separate component with custom tooltip for better UX
function EmailWithTooltip({ email }: { email: string }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const shouldTruncate = email.length > 25

  return (
    <div className="relative">
      <p
        className="mt-1 truncate text-xs text-foreground-muted"
        onMouseEnter={() => shouldTruncate && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {email}
      </p>
      {showTooltip && (
        <div className="absolute left-0 top-full z-50 mt-1 rounded bg-background-tertiary px-2 py-1 text-xs text-foreground shadow-lg">
          {email}
        </div>
      )}
    </div>
  )
}
