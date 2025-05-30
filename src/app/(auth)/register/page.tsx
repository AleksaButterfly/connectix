'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import FormInput from '@/components/ui/FormInput'
import Checkbox from '@/components/ui/Checkbox'
import { authService } from '@/lib/auth/auth.service'
import AuthGuard from '@/components/auth/AuthGuard'

const signUpSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
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

type SignUpFormData = z.infer<typeof signUpSchema>

export default function RegisterPage() {
  return (
    <AuthGuard>
      <RegisterContent />
    </AuthGuard>
  )
}

function RegisterContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Password requirements state
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  })

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

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true)

    try {
      const { error } = await authService.signUp(data.email, data.password, data.username)

      if (error) {
        // Handle specific error types
        if (error.message.includes('already registered')) {
          setError('email', { message: 'This email is already registered' })
        } else if (error.message.includes('username')) {
          setError('username', { message: 'This username is already taken' })
        } else {
          setError('root', { message: error.message })
        }
        setIsLoading(false)
        return
      }

      // Success - show confirmation
      setShowSuccess(true)
    } catch (error) {
      setError('root', { message: 'An unexpected error occurred. Please try again.' })
      setIsLoading(false)
    }
  }

  // Rest of the component remains the same...
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
            <div className="ml-4 text-xs text-foreground-subtle">connectix@auth:~/signup</div>
          </div>

          {/* Terminal Content */}
          <div className="p-8">
            {!showSuccess ? (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-foreground">
                    <span className="text-terminal-green">$</span> create-account
                  </h1>
                  <p className="mt-2 text-sm text-foreground-muted">
                    Join thousands of developers managing servers smarter
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {errors.root && (
                    <div className="rounded-lg border border-terminal-red/50 bg-terminal-red/10 p-3">
                      <p className="text-sm text-terminal-red">{errors.root.message}</p>
                    </div>
                  )}

                  <FormInput
                    label="Email Address"
                    type="email"
                    placeholder="dev@example.com"
                    error={errors.email?.message}
                    {...register('email')}
                  />

                  <FormInput
                    label="Username"
                    placeholder="johndoe"
                    error={errors.username?.message}
                    hint="This will be your unique identifier"
                    {...register('username')}
                  />

                  <div>
                    <FormInput
                      label="Password"
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

                  <div>
                    <FormInput
                      label="Confirm Password"
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
                  </div>

                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                    />
                    <label htmlFor="terms" className="cursor-pointer text-xs text-foreground-muted">
                      I agree to the{' '}
                      <Link href="/terms" className="text-terminal-green hover:underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-terminal-green hover:underline">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !acceptTerms || !allRequirementsMet}
                    className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-pulse">Creating account</span>
                        <span className="animate-terminal-blink">_</span>
                      </span>
                    ) : (
                      'Create Account →'
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
                        OR
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
                      Continue with GitHub
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
                      Continue with Google
                    </button>
                  </div>
                </div>

                <div className="mt-6 text-center text-sm text-foreground-muted">
                  Already have an account?{' '}
                  <Link href="/login" className="text-terminal-green hover:underline">
                    Sign in
                  </Link>
                </div>
              </>
            ) : (
              <div className="animate-slide-up text-center">
                <div className="mb-4 text-4xl">🎉</div>
                <h2 className="mb-2 text-xl font-bold text-terminal-green">
                  Account created successfully!
                </h2>
                <p className="mb-6 text-sm text-foreground-muted">
                  Check your email to verify your account
                </p>
                <Link href="/login" className="btn-primary inline-flex items-center gap-2">
                  Continue to Login →
                </Link>
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
