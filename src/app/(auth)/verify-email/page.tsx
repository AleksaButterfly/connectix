'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { authService } from '@/lib/auth/auth.service'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function VerifyEmailPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  useEffect(() => {
    // Check if already verified
    const checkVerification = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user?.email_confirmed_at) {
        router.push('/dashboard')
      }
    }

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

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      })

      if (error) throw error

      setResendSuccess(true)
      setTimeLeft(60) // 60 second cooldown
      setTimeout(() => setResendSuccess(false), 5000)
    } catch (error) {
      console.error('Error resending email:', error)
    } finally {
      setIsResending(false)
    }
  }

  const handleSignOut = async () => {
    await authService.signOut()
    router.push('/')
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
                We've sent a verification email to:
              </p>
              <p className="mb-6 font-mono text-terminal-green">{user?.email}</p>

              <div className="mb-6 rounded-lg border border-border bg-background-tertiary p-4 text-left">
                <p className="mb-2 font-mono text-xs text-terminal-yellow">
                  <span className="text-foreground-muted">$</span> mail status --check
                </p>
                <div className="ml-4 space-y-1 font-mono text-xs text-foreground-muted">
                  <p>[→] Click the link in your email</p>
                  <p>[→] Page will auto-redirect when verified</p>
                  <p>[→] Check spam folder if not received</p>
                </div>
              </div>

              {resendSuccess && (
                <div className="mb-4 rounded-lg border border-terminal-green/50 bg-terminal-green/10 p-3">
                  <p className="text-sm text-terminal-green">
                    Verification email resent successfully!
                  </p>
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
                    'Resend verification email'
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
