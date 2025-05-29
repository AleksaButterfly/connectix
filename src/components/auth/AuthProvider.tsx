'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth.store'

const PUBLIC_ROUTES = ['/', '/about']
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password']
const VERIFY_ROUTE = '/verify-email'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { setUser, setLoading, user } = useAuthStore()

  useEffect(() => {
    const supabase = createClient()

    // Check initial session
    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error checking auth:', error)
        setUser(null)
      }
    }

    checkUser()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)

      // Handle redirects
      if (session) {
        // Check if email is verified
        if (!session.user.email_confirmed_at && pathname !== VERIFY_ROUTE) {
          router.push(VERIFY_ROUTE)
        } else if (session.user.email_confirmed_at) {
          // Redirect away from auth pages if authenticated and verified
          if (AUTH_ROUTES.includes(pathname)) {
            router.push('/dashboard')
          }
        }
      } else {
        // Not authenticated - redirect away from protected routes
        if (!PUBLIC_ROUTES.includes(pathname) && !AUTH_ROUTES.includes(pathname)) {
          router.push('/login')
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, router, pathname])

  return <>{children}</>
}
