'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleCallback = async () => {
      // Get the error from URL params
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      // Check if this is a password reset flow
      const type = searchParams.get('type')

      if (error) {
        // Handle errors
        console.error('Auth callback error:', error, errorDescription)

        if (errorDescription?.includes('Email link is invalid or has expired')) {
          router.replace('/forgot-password?error=expired')
        } else {
          router.replace('/login?error=auth_failed')
        }
        return
      }

      // Check the hash fragment for tokens
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const tokenType = hashParams.get('type')

      if (tokenType === 'recovery' || type === 'recovery') {
        // This is a password reset flow
        // Supabase will auto-login the user - we accept this
        router.replace('/reset-password')
      } else {
        // Regular auth callback (email verification, OAuth, etc)
        // For these, we DO want to establish a session
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
        <p className="text-foreground">Processing...</p>
      </div>
    </div>
  )
}
