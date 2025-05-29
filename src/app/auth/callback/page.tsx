'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // Supabase will handle the callback automatically
    // Just redirect to dashboard after a brief moment
    const timer = setTimeout(() => {
      router.push('/dashboard')
    }, 1000)

    return () => clearTimeout(timer)
  }, [router])

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
