'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import FormInput from '@/components/ui/FormInput'
import { createClient } from '@/lib/supabase/client'
import { authService } from '@/lib/auth/auth.service'
import { useAuthStore } from '@/stores/auth.store'
import { useIntl, FormattedMessage } from '@/lib/i18n'

export default function ResetPasswordPage() {
  const intl = useIntl()
  const [isLoading, setIsLoading] = useState(false)
  const [isReset, setIsReset] = useState(false)
  const [isValidToken, setIsValidToken] = useState(false)
  const [checkingToken, setCheckingToken] = useState(true)
  const [isOAuthUser, setIsOAuthUser] = useState(false)
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

  const resetPasswordSchema = z
    .object({
      password: z
        .string()
        .min(8, intl.formatMessage({ id: 'validation.password.minLength' }))
        .regex(/[A-Z]/, intl.formatMessage({ id: 'validation.password.uppercase' }))
        .regex(/[a-z]/, intl.formatMessage({ id: 'validation.password.lowercase' }))
        .regex(/[0-9]/, intl.formatMessage({ id: 'validation.password.number' }))
        .regex(/[^A-Za-z0-9]/, intl.formatMessage({ id: 'validation.password.special' })),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: intl.formatMessage({ id: 'validation.password.mismatch' }),
      path: ['confirmPassword'],
    })

  type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

  useEffect(() => {
    // Check if user is logged in and how they authenticated
    const checkSession = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        // Check if user signed up with OAuth
        const hasPassword = session.user.app_metadata.provider === 'email'

        if (!hasPassword) {
          // User signed up with OAuth (GitHub, Google, etc)
          setIsOAuthUser(true)
        } else {
          setIsValidToken(true)
        }
      } else {
        setIsValidToken(false)
      }
      setCheckingToken(false)
    }

    checkSession()
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
        console.error('Password update error:', error)
        setError('root', {
          message:
            (error as { message?: string }).message ||
            intl.formatMessage({ id: 'auth.resetPassword.error.updateFailed' }),
        })
        setIsLoading(false)
        return
      }

      // Success - show success message
      setIsReset(true)

      // Clear any URL params
      window.history.replaceState({}, document.title, '/reset-password')
    } catch (error) {
      console.error('Unexpected error:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      setError('root', {
        message:
          errorMessage || intl.formatMessage({ id: 'auth.resetPassword.error.unexpected' }),
      })
      setIsLoading(false)
    }
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

  const getPasswordStrengthText = () => {
    const score = Object.values(passwordRequirements).filter(Boolean).length
    switch (score) {
      case 0:
        return intl.formatMessage({ id: 'auth.resetPassword.password.strength.veryWeak' })
      case 1:
        return intl.formatMessage({ id: 'auth.resetPassword.password.strength.weak' })
      case 2:
        return intl.formatMessage({ id: 'auth.resetPassword.password.strength.fair' })
      case 3:
        return intl.formatMessage({ id: 'auth.resetPassword.password.strength.good' })
      case 4:
        return intl.formatMessage({ id: 'auth.resetPassword.password.strength.strong' })
      case 5:
        return `🔐 ${intl.formatMessage({ id: 'auth.resetPassword.password.strength.maximum' })}`
      default:
        return ''
    }
  }

  const allRequirementsMet = Object.values(passwordRequirements).every((req) => req)
  const passwordsMatch = password && confirmPassword && password === confirmPassword
  const canSubmit = allRequirementsMet && passwordsMatch

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
            <div className="ml-4 text-xs text-foreground-subtle">connectix@auth:~/new-password</div>
          </div>

          {/* Terminal Content */}
          <div className="p-8">
            {checkingToken ? (
              <div className="text-center">
                <div className="mb-4 inline-block">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-terminal-green border-t-transparent"></div>
                </div>
                <p className="text-sm text-foreground-muted">
                  <FormattedMessage id="auth.resetPassword.verifying" />
                </p>
              </div>
            ) : isOAuthUser ? (
              <div className="text-center">
                <div className="mb-4 text-4xl">🔐</div>
                <h2 className="mb-2 text-xl font-bold text-terminal-yellow">
                  <FormattedMessage id="auth.resetPassword.oauth.title" />
                </h2>
                <p className="mb-6 text-sm text-foreground-muted">
                  <FormattedMessage
                    id="auth.resetPassword.oauth.message"
                    values={{
                      provider:
                        user?.app_metadata.provider ||
                        intl.formatMessage({ id: 'auth.resetPassword.oauth.thirdParty' }),
                    }}
                  />
                </p>
                <p className="mb-6 text-xs text-foreground-subtle">
                  <FormattedMessage id="auth.resetPassword.oauth.contact" />
                </p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <FormattedMessage id="auth.resetPassword.backToDashboard" /> →
                </button>
              </div>
            ) : !isValidToken ? (
              <div className="text-center">
                <div className="mb-4 text-4xl">⚠️</div>
                <h2 className="mb-2 text-xl font-bold text-terminal-red">
                  <FormattedMessage id="auth.resetPassword.invalid.title" />
                </h2>
                <p className="mb-6 text-sm text-foreground-muted">
                  <FormattedMessage id="auth.resetPassword.invalid.message" />
                </p>
                <Link
                  href="/forgot-password"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <FormattedMessage id="auth.resetPassword.requestNewLink" /> →
                </Link>
              </div>
            ) : !isReset ? (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-foreground">
                    <span className="text-terminal-green">$</span> set-new-password
                  </h1>
                  <p className="mt-2 text-sm text-foreground-muted">
                    <FormattedMessage id="auth.resetPassword.subtitle" />
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
                      label={intl.formatMessage({ id: 'auth.resetPassword.newPasswordLabel' })}
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
                        <FormattedMessage id="auth.resetPassword.password.requirements" />
                      </p>
                      <div className="grid grid-cols-1 gap-1.5">
                        <PasswordRequirement
                          met={passwordRequirements.length}
                          text={intl.formatMessage({
                            id: 'auth.resetPassword.password.req.length',
                          })}
                        />
                        <PasswordRequirement
                          met={passwordRequirements.uppercase}
                          text={intl.formatMessage({
                            id: 'auth.resetPassword.password.req.uppercase',
                          })}
                        />
                        <PasswordRequirement
                          met={passwordRequirements.lowercase}
                          text={intl.formatMessage({
                            id: 'auth.resetPassword.password.req.lowercase',
                          })}
                        />
                        <PasswordRequirement
                          met={passwordRequirements.number}
                          text={intl.formatMessage({
                            id: 'auth.resetPassword.password.req.number',
                          })}
                        />
                        <PasswordRequirement
                          met={passwordRequirements.special}
                          text={intl.formatMessage({
                            id: 'auth.resetPassword.password.req.special',
                          })}
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
                          {getPasswordStrengthText()}
                        </p>
                      </div>
                    )}
                  </div>

                  <FormInput
                    label={intl.formatMessage({ id: 'auth.resetPassword.confirmPasswordLabel' })}
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
                        <span className="text-terminal-green">
                          ✓ <FormattedMessage id="auth.resetPassword.password.match" />
                        </span>
                      ) : (
                        <span className="text-terminal-red">
                          ✗ <FormattedMessage id="auth.resetPassword.password.noMatch" />
                        </span>
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
                        <span className="animate-pulse">
                          <FormattedMessage id="auth.resetPassword.updatingPassword" />
                        </span>
                        <span className="animate-terminal-blink">_</span>
                      </span>
                    ) : (
                      <>
                        <FormattedMessage id="auth.resetPassword.resetButton" /> →
                      </>
                    )}
                  </button>

                  {/* Add option to go back to dashboard if they're already logged in */}
                  {user && (
                    <div className="mt-4 text-center">
                      <button
                        type="button"
                        onClick={() => router.push('/dashboard')}
                        className="text-sm text-foreground-muted hover:text-foreground"
                      >
                        <FormattedMessage id="auth.resetPassword.backToDashboard" />
                      </button>
                    </div>
                  )}
                </form>
              </>
            ) : (
              <div className="animate-slide-up text-center">
                <div className="mb-4 text-4xl">✅</div>
                <h2 className="mb-2 text-xl font-bold text-terminal-green">
                  <FormattedMessage id="auth.resetPassword.success.title" />
                </h2>
                <p className="mb-6 text-sm text-foreground-muted">
                  <FormattedMessage id="auth.resetPassword.success.message" />
                </p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <FormattedMessage id="auth.resetPassword.goToDashboard" /> →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
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
