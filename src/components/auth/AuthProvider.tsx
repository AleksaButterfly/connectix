'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth.store'
import AuthLoading from './AuthLoading'

const PUBLIC_ROUTES = ['/', '/about', '/not-found']
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password']
const VERIFY_ROUTE = '/verify-email'
const RECOVERY_ROUTE = '/reset-password'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { setUser, setLoading, isLoading } = useAuthStore()
  const [isInitialized, setIsInitialized] = useState(false)
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // Check initial session
    const checkUser = async () => {
      try {
        // Check if this is a 404 page
        const is404 = (window as any).__isNotFoundPage === true

        // Don't show loading for auth pages, public routes, or 404 pages
        const shouldShowLoading =
          !AUTH_ROUTES.includes(pathname) && !PUBLIC_ROUTES.includes(pathname) && !is404

        if (shouldShowLoading) {
          // Only show loading for protected routes
          setLoading(true)
          setShowLoading(true)
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()

        setUser(session?.user ?? null)

        // Check URL for recovery token
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const urlParams = new URLSearchParams(window.location.search)
        const isRecoveryFlow =
          hashParams.get('type') === 'recovery' || urlParams.get('type') === 'recovery'

        // Determine where user should go based on auth state and current path
        let shouldRedirect = false
        let destination = pathname

        if (session) {
          // User is authenticated
          if (isRecoveryFlow && pathname !== RECOVERY_ROUTE) {
            destination = RECOVERY_ROUTE
            shouldRedirect = true
          } else if (
            !session.user.email_confirmed_at &&
            pathname !== VERIFY_ROUTE &&
            pathname !== RECOVERY_ROUTE &&
            !isRecoveryFlow
          ) {
            destination = VERIFY_ROUTE
            shouldRedirect = true
          } else if (
            session.user.email_confirmed_at &&
            AUTH_ROUTES.includes(pathname) &&
            pathname !== RECOVERY_ROUTE &&
            !isRecoveryFlow &&
            pathname !== '/reset-password' // Extra check to prevent redirect
          ) {
            destination = '/dashboard'
            shouldRedirect = true
          }
        } else {
          // User is not authenticated
          const is404 = (window as any).__isNotFoundPage === true
          if (!PUBLIC_ROUTES.includes(pathname) && !AUTH_ROUTES.includes(pathname) && !is404) {
            destination = '/login'
            shouldRedirect = true
          }
        }

        if (shouldRedirect && destination !== pathname) {
          // Use replace for cleaner navigation
          router.replace(destination)
        }
      } catch (error) {
        console.error('Error checking auth:', error)
        setUser(null)
      } finally {
        setLoading(false)
        setShowLoading(false)
        setIsInitialized(true)
      }
    }

    checkUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)

      // Only handle redirects after initial load and for specific events
      if (isInitialized && event !== 'INITIAL_SESSION') {
        if (event === 'SIGNED_IN') {
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const urlParams = new URLSearchParams(window.location.search)
          const isRecoveryFlow =
            hashParams.get('type') === 'recovery' || urlParams.get('type') === 'recovery'

          if (isRecoveryFlow && pathname !== RECOVERY_ROUTE) {
            router.push(RECOVERY_ROUTE)
          } else if (!session?.user.email_confirmed_at && pathname !== VERIFY_ROUTE) {
            router.push(VERIFY_ROUTE)
          } else if (AUTH_ROUTES.includes(pathname) && pathname !== RECOVERY_ROUTE) {
            router.push('/dashboard')
          }
        } else if (event === 'SIGNED_OUT') {
          // Only redirect to login if user is on a protected page
          // DO NOT redirect if user is already on an auth page or public page
          if (!PUBLIC_ROUTES.includes(pathname) && !AUTH_ROUTES.includes(pathname)) {
            router.push('/login')
          }
          // If user signs out while on homepage or login, stay there
        } else if (event === 'PASSWORD_RECOVERY') {
          router.push(RECOVERY_ROUTE)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setLoading, router, pathname, isInitialized])

  // Only show loading for protected routes during initial load
  if (!isInitialized && showLoading) {
    return <AuthLoading />
  }

  return <>{children}</>
}
