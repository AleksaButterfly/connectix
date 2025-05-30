'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth.store'

interface AuthGuardProps {
  children: React.ReactNode
  redirectTo?: string
}

// This guard is for auth pages (login, register, etc)
// It redirects authenticated users away
export default function AuthGuard({ children, redirectTo = '/dashboard' }: AuthGuardProps) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    // If user is authenticated and verified, redirect to dashboard
    if (isAuthenticated && user?.email_confirmed_at) {
      router.replace(redirectTo)
    }
  }, [isAuthenticated, user, router, redirectTo])

  // If authenticated and verified, don't show auth pages
  if (isAuthenticated && user?.email_confirmed_at) {
    return null
  }

  return <>{children}</>
}
