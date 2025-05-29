'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import FormInput from '@/components/ui/FormInput'
import { authService } from '@/lib/auth/auth.service'
import { useRouter } from 'next/navigation'

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
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
  const router = useRouter()

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

      // Success
      setIsReset(true)
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (error) {
      setError('root', { message: 'An unexpected error occurred. Please try again.' })
      setIsLoading(false)
    }
  }

  // Password strength indicator
  const [passwordStrength, setPasswordStrength] = useState(0)
  const checkPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++
    if (password.match(/[0-9]/)) strength++
    if (password.match(/[^a-zA-Z0-9]/)) strength++
    setPasswordStrength(strength)
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
            <div className="ml-4 text-xs text-foreground-subtle">connectix@auth:~/new-password</div>
          </div>

          {/* Terminal Content */}
          <div className="p-8">
            {!isReset ? (
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
                    {/* Password strength indicator */}
                    <div className="mt-2 flex gap-1">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            i < passwordStrength
                              ? passwordStrength <= 2
                                ? 'bg-terminal-yellow'
                                : 'bg-terminal-green'
                              : 'bg-border'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-foreground-subtle">
                      {passwordStrength === 0 && 'Add 8+ characters'}
                      {passwordStrength === 1 && 'Weak - add uppercase & numbers'}
                      {passwordStrength === 2 && 'Fair - add special characters'}
                      {passwordStrength === 3 && 'Good password'}
                      {passwordStrength === 4 && 'Strong password!'}
                    </p>
                  </div>

                  <FormInput
                    label="Confirm New Password"
                    type="password"
                    placeholder="••••••••"
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                  />

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full disabled:opacity-50"
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
                </form>
              </>
            ) : (
              <div className="animate-slide-up text-center">
                <div className="mb-4 text-4xl">✅</div>
                <h2 className="mb-2 text-xl font-bold text-terminal-green">
                  Password reset successful!
                </h2>
                <p className="mb-6 text-sm text-foreground-muted">
                  Your password has been updated. You can now sign in with your new password.
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
