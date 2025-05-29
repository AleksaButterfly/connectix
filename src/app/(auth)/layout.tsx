'use client'

import { useAuthStore } from '@/stores/auth.store'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

const AUTH_PAGES = ['/login', '/register', '/forgot-password', '/reset-password']

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only redirect if we're sure user is authenticated and verified
    // Don't redirect if on reset-password page (user needs to stay there to reset)
    if (
      isAuthenticated &&
      user?.email_confirmed_at &&
      AUTH_PAGES.includes(pathname) &&
      pathname !== '/reset-password'
    ) {
      console.log('🚀 Redirecting to dashboard from:', pathname)
      router.replace('/dashboard')
    }
  }, [isAuthenticated, user, pathname, router])

  // Always render auth pages immediately - no loading states
  return <>{children}</>
}
