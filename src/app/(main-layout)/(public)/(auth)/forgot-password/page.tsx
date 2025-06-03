'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchParams } from 'next/navigation'
import FormInput from '@/components/ui/FormInput'
import { authService } from '@/lib/auth/auth.service'
import { useIntl, FormattedMessage } from '@/lib/i18n'

export default function ForgotPasswordPage() {
  const intl = useIntl()
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const searchParams = useSearchParams()

  const forgotPasswordSchema = z.object({
    email: z.string().email(intl.formatMessage({ id: 'validation.email.valid' })),
  })

  type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  // Check for errors from auth callback
  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'expired') {
      setError('root', {
        message: intl.formatMessage({ id: 'auth.forgotPassword.error.expired' }),
      })
    } else if (error === 'invalid_token') {
      setError('root', {
        message: intl.formatMessage({ id: 'auth.forgotPassword.error.invalidToken' }),
      })
    }
  }, [searchParams, setError, intl])

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    setError('root', { message: '' }) // Clear any previous errors

    try {
      const { error } = await authService.resetPassword(data.email)

      if (error) {
        setError('root', { message: error.message })
        setIsLoading(false)
        return
      }

      setIsEmailSent(true)
    } catch (error) {
      setError('root', {
        message: intl.formatMessage({ id: 'auth.forgotPassword.error.unexpected' }),
      })
      setIsLoading(false)
    }
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
            <div className="ml-4 text-xs text-foreground-subtle">connectix@auth:~/reset</div>
          </div>

          {/* Terminal Content */}
          <div className="p-8">
            {!isEmailSent ? (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-foreground">
                    <span className="text-terminal-green">$</span> reset-password
                  </h1>
                  <p className="mt-2 text-sm text-foreground-muted">
                    <FormattedMessage id="auth.forgotPassword.subtitle" />
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {errors.root && errors.root.message && (
                    <div className="rounded-lg border border-terminal-red/50 bg-terminal-red/10 p-3">
                      <p className="text-sm text-terminal-red">{errors.root.message}</p>
                    </div>
                  )}

                  <FormInput
                    label={intl.formatMessage({ id: 'auth.forgotPassword.emailLabel' })}
                    type="email"
                    placeholder="dev@example.com"
                    error={errors.email?.message}
                    hint={intl.formatMessage({ id: 'auth.forgotPassword.emailHint' })}
                    {...register('email')}
                  />

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-pulse">
                          <FormattedMessage id="auth.forgotPassword.sendingEmail" />
                        </span>
                        <span className="animate-terminal-blink">_</span>
                      </span>
                    ) : (
                      <>
                        <FormattedMessage id="auth.forgotPassword.sendResetLink" /> →
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <Link href="/login" className="text-sm text-terminal-green hover:underline">
                      ← <FormattedMessage id="auth.forgotPassword.backToLogin" />
                    </Link>
                  </div>
                </form>
              </>
            ) : (
              <div className="animate-slide-up text-center">
                <div className="mb-4 text-4xl">📧</div>
                <h2 className="mb-2 text-xl font-bold text-terminal-green">
                  <FormattedMessage id="auth.forgotPassword.success.title" />
                </h2>
                <p className="mb-4 text-sm text-foreground-muted">
                  <FormattedMessage id="auth.forgotPassword.success.subtitle" />
                </p>
                <div className="space-y-2 rounded-lg border border-border bg-background-tertiary p-4 text-left">
                  <p className="font-mono text-xs text-foreground">
                    <span className="text-terminal-green">$</span> mail status
                  </p>
                  <p className="ml-4 font-mono text-xs text-foreground-muted">
                    [✓] <FormattedMessage id="auth.forgotPassword.success.emailSent" />
                  </p>
                  <p className="ml-4 font-mono text-xs text-foreground-muted">
                    [i] <FormattedMessage id="auth.forgotPassword.success.checkSpam" />
                  </p>
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setIsEmailSent(false)
                      setIsLoading(false)
                    }}
                    className="btn-secondary mb-3 inline-flex items-center gap-2"
                  >
                    ← <FormattedMessage id="auth.forgotPassword.requestAnother" />
                  </button>
                  <div>
                    <Link href="/login" className="text-sm text-terminal-green hover:underline">
                      ← <FormattedMessage id="auth.forgotPassword.backToLogin" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
