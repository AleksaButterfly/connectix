'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/lib/auth/auth.service'
import { useRouter } from 'next/navigation'

export default function Header() {
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
              <Link
                href="/"
                className="group flex items-center gap-2 text-lg font-bold transition-colors hover:text-terminal-green"
              >
                <span className="text-terminal-green">$</span>
                <span>Connectix</span>
                <span className="animate-terminal-blink text-terminal-green opacity-0 group-hover:opacity-100">
                  _
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden items-center gap-8 md:flex">
                <Link
                  href="/about"
                  className="text-sm text-foreground-muted transition-colors hover:text-foreground"
                >
                  About Connectix
                </Link>
                {isAuthenticated ? (
                  <Link href="/dashboard" className="btn-primary text-sm">
                    Go to Dashboard →
                  </Link>
                ) : (
                  <Link href="/login" className="btn-primary text-sm">
                    Sign in to Dashboard →
                  </Link>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="flex h-10 w-10 items-center justify-center rounded-md text-foreground-muted transition-colors hover:bg-background-tertiary hover:text-foreground md:hidden"
                aria-label="Toggle menu"
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
                    <Link
                      href="/dashboard"
                      className="block py-2 text-sm text-foreground-muted transition-colors hover:text-foreground"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut()
                        setIsMobileMenuOpen(false)
                      }}
                      className="btn-secondary mt-2 block w-full text-center text-sm"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/about"
                      className="block py-2 text-sm text-foreground-muted transition-colors hover:text-foreground"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      About Connectix
                    </Link>
                    <Link
                      href="/login"
                      className="btn-primary mt-2 block w-full text-center text-sm"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign in to Console →
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
