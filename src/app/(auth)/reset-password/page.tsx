'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import FormInput from '@/components/ui/FormInput'
import { authService } from '@/lib/auth/auth.service'
import { useRouter } from 'next/navigation'
import { createClientNoAutoDetect } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth.store'
import AuthPageWrapper from '@/components/auth/AuthPageWrapper'

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isReset, setIsReset] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)
  const [checkingToken, setCheckingToken] = useState(true)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const router = useRouter()
  const { user } = useAuthStore()

  // Password requirements state
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  })

  useEffect(() => {
    // Check if user has a valid recovery session
    const checkRecoverySession = async () => {
      const supabase = createClientNoAutoDetect()

      try {
        // Get the current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Session error:', sessionError)
          setIsValidToken(false)
          setCheckingToken(false)
          return
        }

        // If we have a session, user is authenticated (likely from recovery link)
        if (session && session.user) {
          setIsValidToken(true)
        } else {
          // No session - invalid or expired link
          setIsValidToken(false)
        }
      } catch (error) {
        console.error('Error checking recovery session:', error)
        setIsValidToken(false)
      } finally {
        setCheckingToken(false)
      }
    }

    checkRecoverySession()
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)

    try {
      const { error } = await authService.updatePassword(data.password)

      if (error) {
        setError('root', { message: error.message })
        setIsLoading(false)
        return
      }

      // Success - show success message
      setIsReset(true)

      // Clear any recovery params from URL
      window.history.replaceState({}, document.title, '/reset-password')
    } catch (error) {
      setError('root', { message: 'An unexpected error occurred. Please try again.' })
      setIsLoading(false)
    }
  }

  const handleGoToDashboard = () => {
    router.push('/dashboard')
  }

  // Password strength indicator
  const checkPasswordStrength = (pwd: string) => {
    setPassword(pwd)
    setPasswordRequirements({
      length: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[^A-Za-z0-9]/.test(pwd),
    })
  }

  const allRequirementsMet = Object.values(passwordRequirements).every((req) => req)
  const passwordsMatch = password && confirmPassword && password === confirmPassword
  const canSubmit = allRequirementsMet && passwordsMatch

  return (
    <AuthPageWrapper allowAuthenticated={true}>
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
              <div className="ml-4 text-xs text-foreground-subtle">
                connectix@auth:~/new-password
              </div>
            </div>

            {/* Terminal Content */}
            <div className="p-8">
              {checkingToken ? (
                <div className="text-center">
                  <div className="mb-4 inline-block">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-terminal-green border-t-transparent"></div>
                  </div>
                  <p className="text-sm text-foreground-muted">Verifying reset link...</p>
                </div>
              ) : !isValidToken ? (
                <div className="text-center">
                  <div className="mb-4 text-4xl">⚠️</div>
                  <h2 className="mb-2 text-xl font-bold text-terminal-red">
                    Invalid or Expired Link
                  </h2>
                  <p className="mb-6 text-sm text-foreground-muted">
                    This password reset link is invalid or has expired. Please request a new one.
                  </p>
                  <Link
                    href="/forgot-password"
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    Request New Link →
                  </Link>
                </div>
              ) : !isReset ? (
                <>
                  <div className="mb-6">
                    <h1 className="text-2xl font-bold text-foreground">
                      <span className="text-terminal-green">$</span> set-new-password
                    </h1>
                    <p className="mt-2 text-sm text-foreground-muted">
                      Choose a strong password for your account
                    </p>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {errors.root && (
                      <div className="rounded-lg border border-terminal-red/50 bg-terminal-red/10 p-3">
                        <p className="text-sm text-terminal-red">{errors.root.message}</p>
                      </div>
                    )}

                    <div>
                      <FormInput
                        label="New Password"
                        type="password"
                        placeholder="••••••••"
                        error={errors.password?.message}
                        {...register('password', {
                          onChange: (e) => checkPasswordStrength(e.target.value),
                        })}
                      />

                      {/* Password Requirements */}
                      <div className="mt-3 space-y-2 rounded-lg border border-border bg-background-tertiary p-3">
                        <p className="mb-2 text-xs font-medium text-foreground">
                          Password must contain:
                        </p>
                        <div className="grid grid-cols-1 gap-1.5">
                          <PasswordRequirement
                            met={passwordRequirements.length}
                            text="At least 8 characters"
                          />
                          <PasswordRequirement
                            met={passwordRequirements.uppercase}
                            text="One uppercase letter (A-Z)"
                          />
                          <PasswordRequirement
                            met={passwordRequirements.lowercase}
                            text="One lowercase letter (a-z)"
                          />
                          <PasswordRequirement
                            met={passwordRequirements.number}
                            text="One number (0-9)"
                          />
                          <PasswordRequirement
                            met={passwordRequirements.special}
                            text="One special character (!@#$%)"
                          />
                        </div>
                      </div>

                      {/* Password Strength Bar */}
                      {password && (
                        <div className="mt-2">
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                  i < Object.values(passwordRequirements).filter(Boolean).length
                                    ? allRequirementsMet
                                      ? 'bg-terminal-green'
                                      : 'bg-terminal-yellow'
                                    : 'bg-border'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="mt-1 text-right text-xs text-foreground-subtle">
                            {Object.values(passwordRequirements).filter(Boolean).length === 0 &&
                              'Very Weak'}
                            {Object.values(passwordRequirements).filter(Boolean).length === 1 &&
                              'Weak'}
                            {Object.values(passwordRequirements).filter(Boolean).length === 2 &&
                              'Fair'}
                            {Object.values(passwordRequirements).filter(Boolean).length === 3 &&
                              'Good'}
                            {Object.values(passwordRequirements).filter(Boolean).length === 4 &&
                              'Strong'}
                            {Object.values(passwordRequirements).filter(Boolean).length === 5 &&
                              '🔐 Maximum Security'}
                          </p>
                        </div>
                      )}
                    </div>

                    <FormInput
                      label="Confirm New Password"
                      type="password"
                      placeholder="••••••••"
                      error={errors.confirmPassword?.message}
                      {...register('confirmPassword', {
                        onChange: (e) => setConfirmPassword(e.target.value),
                      })}
                    />

                    {/* Password match indicator */}
                    {confirmPassword && (
                      <div className="mt-1 text-xs">
                        {passwordsMatch ? (
                          <span className="text-terminal-green">✓ Passwords match</span>
                        ) : (
                          <span className="text-terminal-red">✗ Passwords don't match</span>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading || !canSubmit}
                      className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-pulse">Updating password</span>
                          <span className="animate-terminal-blink">_</span>
                        </span>
                      ) : (
                        'Reset Password →'
                      )}
                    </button>

                    {/* Add option to go back to dashboard if they're already logged in */}
                    {user && (
                      <div className="mt-4 text-center">
                        <button
                          type="button"
                          onClick={handleGoToDashboard}
                          className="text-sm text-foreground-muted hover:text-foreground"
                        >
                          Back to Dashboard
                        </button>
                      </div>
                    )}
                  </form>
                </>
              ) : (
                <div className="animate-slide-up text-center">
                  <div className="mb-4 text-4xl">✅</div>
                  <h2 className="mb-2 text-xl font-bold text-terminal-green">
                    Password reset successful!
                  </h2>
                  <p className="mb-6 text-sm text-foreground-muted">
                    Your password has been successfully updated. You can now return to the
                    dashboard.
                  </p>
                  <button
                    onClick={handleGoToDashboard}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    Go to Dashboard →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthPageWrapper>
  )
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className={`transition-all duration-200 ${met ? 'text-terminal-green' : 'text-foreground-subtle'}`}
      >
        {met ? '✓' : '○'}
      </div>
      <span
        className={`transition-colors duration-200 ${met ? 'text-foreground' : 'text-foreground-subtle'}`}
      >
        {text}
      </span>
    </div>
  )
}
