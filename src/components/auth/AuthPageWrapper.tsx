'use client'

import { useAuthStore } from '@/stores/auth.store'
import { useEffect, useState } from 'react'
import AuthLoading from './AuthLoading'

interface AuthPageWrapperProps {
  children: React.ReactNode
  allowAuthenticated?: boolean // For pages like reset-password that allow authenticated users
}

export default function AuthPageWrapper({
  children,
  allowAuthenticated = false,
}: AuthPageWrapperProps) {
  const { isAuthenticated, user, isLoading } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // If still checking auth state, show nothing to prevent flash
  if (!mounted || isLoading) {
    return null
  }

  // If authenticated and this page doesn't allow authenticated users, show loading
  // The auth layout will handle the redirect
  if (isAuthenticated && user?.email_confirmed_at && !allowAuthenticated) {
    return <AuthLoading />
  }

  return <>{children}</>
}
