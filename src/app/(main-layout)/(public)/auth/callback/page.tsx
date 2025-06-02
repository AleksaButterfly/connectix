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
        <svg
          className="mx-auto mb-4 h-8 w-8 animate-spin text-terminal-green"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="text-foreground-muted">Processing...</p>
      </div>
    </div>
  )
}
