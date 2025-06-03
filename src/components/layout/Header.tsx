'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/lib/auth/auth.service'
import { useRouter } from 'next/navigation'
import UserMenu from '@/components/layout/UserMenu'
import { useIntl, FormattedMessage } from '@/lib/i18n'

export default function Header() {
  const intl = useIntl()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()

  const handleSignOut = async () => {
    await authService.signOut()
    router.push('/')
  }

  return (
    <header className="w-full md:sticky md:top-0 md:z-50">
      <div className="px-6 pt-6">
        <nav className="mx-auto max-w-4xl rounded-lg border border-border bg-background-secondary md:bg-background-secondary/95 md:backdrop-blur-sm">
          <div className="px-6">
            <div className="flex h-16 items-center justify-between">
              {/* Logo/Brand */}
              <Link href="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-terminal-green">
                  <span className="text-sm font-bold text-background">C</span>
                </div>
                <span className="text-lg font-semibold text-foreground">Connectix</span>
                <span className="animate-terminal-blink text-terminal-green opacity-0 group-hover:opacity-100">
                  _
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden items-center gap-4 md:flex">
                {isAuthenticated ? (
                  <>
                    <Link href="/dashboard" className="btn-primary text-sm">
                      <FormattedMessage id="header.dashboard" />
                    </Link>
                    <UserMenu user={user} />
                  </>
                ) : (
                  <>
                    <Link href="/login" className="btn-secondary text-sm">
                      <FormattedMessage id="header.signIn" />
                    </Link>
                    <Link href="/dashboard" className="btn-primary text-sm">
                      <FormattedMessage id="header.startProject" /> →
                    </Link>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-background-tertiary hover:text-foreground md:hidden"
                aria-label={intl.formatMessage({ id: 'header.toggleMenu' })}
              >
                {isMobileMenuOpen ? (
                  // X icon
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                ) : (
                  // Hamburger icon
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 12h18M3 6h18M3 18h18" />
                  </svg>
                )}
              </button>
            </div>

            {/* Mobile Menu */}
            <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
              <div className="border-t border-border py-4">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center justify-between pb-4">
                      <span className="text-sm font-medium text-foreground">{user?.email}</span>
                      <UserMenu user={user} />
                    </div>
                    <Link
                      href="/dashboard/organizations"
                      className="block py-2 text-sm text-foreground-muted transition-colors hover:text-foreground"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <FormattedMessage id="header.dashboard" />
                    </Link>
                    <Link
                      href="/account/settings"
                      className="block py-2 text-sm text-foreground-muted transition-colors hover:text-foreground"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <FormattedMessage id="header.accountSettings" />
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut()
                        setIsMobileMenuOpen(false)
                      }}
                      className="btn-secondary mt-2 block w-full text-center text-sm"
                    >
                      <FormattedMessage id="header.signOut" />
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/about"
                      className="block py-2 text-sm text-foreground-muted transition-colors hover:text-foreground"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <FormattedMessage id="header.aboutConnectix" />
                    </Link>
                    <Link
                      href="/login"
                      className="btn-primary mt-2 block w-full text-center text-sm"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <FormattedMessage id="header.signInToConsole" /> →
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  )
}
