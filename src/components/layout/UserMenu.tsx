'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth/auth.service'
import { useIntl, FormattedMessage } from '@/lib/i18n'
import type { User } from '@supabase/supabase-js'

interface UserMenuProps {
  user: User | null
}

export default function UserMenu({ user }: UserMenuProps) {
  const intl = useIntl()
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
    return name[0].toUpperCase()
  }

  // Get avatar color based on username/email
  const getAvatarColor = (identifier: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
    ]
    const index = identifier.charCodeAt(0) % colors.length
    return colors[index]
  }

  if (!user) return null

  const username =
    user.user_metadata?.username ||
    user.email?.split('@')[0] ||
    intl.formatMessage({ id: 'common.user' })
  const avatarColor = getAvatarColor(username)

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium text-white transition-all hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-terminal-green focus:ring-offset-2 focus:ring-offset-background ${
          user.user_metadata?.avatar_url ? '' : avatarColor
        }`}
        aria-label={intl.formatMessage({ id: 'userMenu.toggleMenu' })}
      >
        {user.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt={user.email || intl.formatMessage({ id: 'userMenu.user' })}
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
            {/* User Info */}
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-medium text-foreground">{username}</p>
              <p className="mt-1 truncate text-xs text-foreground-muted" title={user.email}>
                {user.email}
              </p>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false)
                  router.push('/account/settings')
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
                <FormattedMessage id="userMenu.accountSettings" />
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
                <FormattedMessage id="userMenu.signOut" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
