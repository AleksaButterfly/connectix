'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/lib/auth/auth.service'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

export default function VerifyEmailPage() {
  return (
    <ProtectedRoute>
      <VerifyEmailContent />
    </ProtectedRoute>
  )
}

function VerifyEmailContent() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState('')
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    // Check if already verified on mount and periodically
    const checkVerification = async () => {
      const supabase = createClient()
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (currentUser?.email_confirmed_at) {
        router.push('/')
      }
    }

    // Check immediately
    checkVerification()

    // Check every 5 seconds
    const interval = setInterval(checkVerification, 5000)

    return () => clearInterval(interval)
  }, [router])

  useEffect(() => {
    // Countdown timer for resend
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [timeLeft])

  const handleResendEmail = async () => {
    if (!user?.email || timeLeft > 0) return

    setIsResending(true)
    setResendError('')
    setResendSuccess(false)

    try {
      const { error } = await authService.resendVerificationEmail(user.email)

      if (error) throw error

      setResendSuccess(true)
      setTimeLeft(60) // 60 second cooldown

      // Clear success message after 5 seconds
      setTimeout(() => setResendSuccess(false), 5000)
    } catch (error: any) {
      console.error('Error resending email:', error)
      setResendError(error.message || 'Failed to resend email. Please try again.')

      // Clear error message after 5 seconds
      setTimeout(() => setResendError(''), 5000)
    } finally {
      setIsResending(false)
    }
  }

  const handleSignOut = async () => {
    await authService.signOut()
    router.push('/')
  }

  // If user is already verified, don't show the page content
  if (user?.email_confirmed_at) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-16">
        <div className="text-center">
          <div className="mb-4 inline-block">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-terminal-green border-t-transparent"></div>
          </div>
          <p className="text-sm text-foreground-muted">Redirecting...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="terminal-window animate-fade-in">
          {/* Terminal Header */}
          <div className="terminal-header">
            <div className="flex gap-1.5">
              <div className="terminal-dot bg-terminal-red" />
              <div className="terminal-dot bg-terminal-yellow" />
              <div className="terminal-dot bg-terminal-green" />
            </div>
            <div className="ml-4 text-xs text-foreground-subtle">connectix@auth:~/verify</div>
          </div>

          {/* Terminal Content */}
          <div className="p-8">
            <div className="text-center">
              <div className="mb-4 text-4xl">📧</div>
              <h1 className="mb-2 text-2xl font-bold text-foreground">Verify your email</h1>
              <p className="mb-6 text-sm text-foreground-muted">
                Please verify your email to continue:
              </p>
              <p className="mb-6 font-mono text-terminal-green">{user?.email}</p>

              <div className="mb-6 rounded-lg border border-border bg-background-tertiary p-4 text-left">
                <p className="mb-2 font-mono text-xs text-terminal-yellow">
                  <span className="text-foreground-muted">$</span> mail status --check
                </p>
                <div className="ml-4 space-y-1 font-mono text-xs text-foreground-muted">
                  <p>[!] Email verification required</p>
                  <p>[→] Click button below to send verification email</p>
                  <p>[→] Check your inbox and click the link</p>
                  <p>[→] Page will auto-redirect when verified</p>
                </div>
              </div>

              {resendSuccess && (
                <div className="mb-4 rounded-lg border border-terminal-green/50 bg-terminal-green/10 p-3">
                  <p className="text-sm text-terminal-green">
                    Verification email sent successfully!
                  </p>
                </div>
              )}

              {resendError && (
                <div className="mb-4 rounded-lg border border-terminal-red/50 bg-terminal-red/10 p-3">
                  <p className="text-sm text-terminal-red">{resendError}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={handleResendEmail}
                  disabled={isResending || timeLeft > 0}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {isResending ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-pulse">Sending</span>
                      <span className="animate-terminal-blink">_</span>
                    </span>
                  ) : timeLeft > 0 ? (
                    `Resend in ${timeLeft}s`
                  ) : (
                    'Send verification email'
                  )}
                </button>

                <button onClick={handleSignOut} className="btn-secondary w-full">
                  Sign out and try different email
                </button>
              </div>

              <p className="mt-6 text-xs text-foreground-subtle">
                Having trouble? Contact support@connectix.dev
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
