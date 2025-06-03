'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import FormInput from '@/components/ui/FormInput'
import Checkbox from '@/components/ui/Checkbox'
import { authService } from '@/lib/auth/auth.service'
import { useIntl, FormattedMessage } from '@/lib/i18n'

export default function LoginPage() {
  const intl = useIntl()
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || '/dashboard'

  const loginSchema = z.object({
    email: z.string().email(intl.formatMessage({ id: 'validation.email.invalid' })),
    password: z.string().min(1, intl.formatMessage({ id: 'validation.password.required' })),
  })

  type LoginFormData = z.infer<typeof loginSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)

    try {
      const { error } = await authService.signIn(data.email, data.password)

      if (error) {
        setError('root', { message: error.message })
        setIsLoading(false)
        return
      }

      // Success - refresh the router to update server-side session
      router.refresh()

      // Small delay to ensure cookies are set
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Then redirect to intended destination
      router.push(from)
    } catch (error) {
      setError('root', {
        message: intl.formatMessage({ id: 'auth.login.error.unexpected' }),
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
            <div className="ml-4 text-xs text-foreground-subtle">connectix@auth:~/login</div>
          </div>

          {/* Terminal Content */}
          <div className="p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground">
                <span className="text-terminal-green">$</span> ssh connectix@login
              </h1>
              <p className="mt-2 text-sm text-foreground-muted">
                <FormattedMessage id="auth.login.subtitle" />
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {errors.root && (
                <div className="rounded-lg border border-terminal-red/50 bg-terminal-red/10 p-3">
                  <p className="text-sm text-terminal-red">{errors.root.message}</p>
                </div>
              )}

              <FormInput
                label={intl.formatMessage({ id: 'auth.login.emailLabel' })}
                type="email"
                placeholder="dev@example.com"
                error={errors.email?.message}
                {...register('email')}
              />

              <FormInput
                label={intl.formatMessage({ id: 'auth.login.passwordLabel' })}
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label htmlFor="remember" className="text-sm text-foreground-muted">
                    <FormattedMessage id="auth.login.rememberMe" />
                  </label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm text-terminal-green hover:underline"
                >
                  <FormattedMessage id="auth.login.forgotPassword" />
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-pulse">
                      <FormattedMessage id="auth.login.authenticating" />
                    </span>
                    <span className="animate-terminal-blink">_</span>
                  </span>
                ) : (
                  <>
                    <FormattedMessage id="auth.login.signIn" /> →
                  </>
                )}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background-secondary px-2 text-foreground-subtle">
                    <FormattedMessage id="common.or" />
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => authService.signInWithProvider('github')}
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background-tertiary px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-background-secondary"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  <FormattedMessage id="auth.login.continueWithGitHub" />
                </button>
                <button
                  onClick={() => authService.signInWithProvider('google')}
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background-tertiary px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-background-secondary"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <FormattedMessage id="auth.login.continueWithGoogle" />
                </button>
              </div>
            </div>

            <div className="mt-6 text-center text-sm text-foreground-muted">
              <FormattedMessage id="auth.login.noAccount" />{' '}
              <Link href="/register" className="text-terminal-green hover:underline">
                <FormattedMessage id="auth.login.signUp" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
