'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient()

      // Get the error from URL params
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      // Check if this is a password reset flow
      const type = searchParams.get('type')

      if (error) {
        // Handle errors
        console.error('Auth callback error:', error, errorDescription)

        if (
          error === 'access_denied' &&
          errorDescription?.includes('Email link is invalid or has expired')
        ) {
          // Recovery link has expired or been used
          router.replace('/forgot-password?error=expired')
        } else {
          // Other errors - go to login
          router.replace('/login?error=auth_failed')
        }
        return
      }

      // Check the hash fragment for recovery tokens
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const tokenType = hashParams.get('type')

      if (tokenType === 'recovery' || type === 'recovery') {
        // This is a password reset flow
        if (!accessToken) {
          // No token in URL - link might be expired or already used
          router.replace('/forgot-password?error=expired')
          return
        }

        // Exchange the recovery token for a session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        )

        if (exchangeError || !data.session) {
          console.error('Failed to exchange recovery token:', exchangeError)

          // Try alternative method - set session directly
          const refreshToken = hashParams.get('refresh_token')
          if (refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })

            if (!sessionError) {
              // Wait a moment for session to establish
              await new Promise((resolve) => setTimeout(resolve, 500))
              router.replace('/reset-password')
              return
            }
          }

          // If all methods fail, redirect to forgot password with error
          router.replace('/forgot-password?error=invalid_token')
          return
        }

        // Session established successfully
        router.replace('/reset-password')
      } else {
        // Regular auth callback - redirect to dashboard
        router.replace('/dashboard')
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-terminal-green border-t-transparent"></div>
        </div>
        <p className="text-foreground">Authenticating...</p>
      </div>
    </div>
  )
}
