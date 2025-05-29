'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'
import AuthLoading from './AuthLoading'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireVerified?: boolean
}

export default function ProtectedRoute({ children, requireVerified = true }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // Only redirect after we know the auth state
    if (!isLoading && !isRedirecting) {
      if (!isAuthenticated) {
        setIsRedirecting(true)
        router.replace('/login')
      } else if (requireVerified && user && !user.email_confirmed_at) {
        setIsRedirecting(true)
        router.replace('/verify-email')
      }
    }
  }, [isAuthenticated, isLoading, user, router, requireVerified, isRedirecting])

  // Show loading only for protected routes during initial auth check or while redirecting
  if (isLoading || isRedirecting) {
    return <AuthLoading />
  }

  // If not authenticated or needs verification, don't render children
  if (!isAuthenticated || (requireVerified && user && !user.email_confirmed_at)) {
    return <AuthLoading /> // Show loading instead of null to prevent flash
  }

  return <>{children}</>
}
