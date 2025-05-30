'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'

interface RouteGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  requireVerified?: boolean
  redirectTo?: string
}

export default function RouteGuard({
  children,
  requireAuth = false,
  requireVerified = false,
  redirectTo = '/login',
}: RouteGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    // Only check after initial render to avoid SSR issues
    if (requireAuth && !isAuthenticated) {
      router.replace(`${redirectTo}?from=${encodeURIComponent(pathname)}`)
    } else if (requireVerified && user && !user.email_confirmed_at) {
      router.replace('/verify-email')
    }
  }, [requireAuth, requireVerified, isAuthenticated, user, router, pathname, redirectTo])

  // If auth is required but user is not authenticated, don't render children
  if (requireAuth && !isAuthenticated) {
    return null
  }

  // If verification is required but user is not verified, don't render children
  if (requireVerified && user && !user.email_confirmed_at) {
    return null
  }

  return <>{children}</>
}
