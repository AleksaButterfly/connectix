'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import FormInput from '@/components/ui/FormInput'
import { useToast } from '@/components/ui/ToastContext'
import { useConfirmation } from '@/hooks/useConfirmation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth.store'

// Form validation schemas
const accountSettingsSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username is too long')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    ),
  email: z.string().email('Invalid email address'),
})

const passwordUpdateSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type AccountSettingsFormData = z.infer<typeof accountSettingsSchema>
type PasswordUpdateFormData = z.infer<typeof passwordUpdateSchema>

export default function AccountSettingsPage() {
  const router = useRouter()
  const { user, refreshUser } = useAuthStore()
  const { toast } = useToast()
  const { confirm, ConfirmationModal } = useConfirmation()

  const [activeTab, setActiveTab] = useState<'account' | 'audit'>('account')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [identities, setIdentities] = useState<any[]>([])
  const [originalValues, setOriginalValues] = useState<AccountSettingsFormData>({
    username: '',
    email: '',
  })

  // Password update state
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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
    setValue,
    watch,
    reset,
  } = useForm<AccountSettingsFormData>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      username: '',
      email: '',
    },
  })

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    setError: setPasswordError,
    reset: resetPassword,
    watch: watchPassword,
  } = useForm<PasswordUpdateFormData>({
    resolver: zodResolver(passwordUpdateSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const currentValues = watch()
  const hasChanges =
    currentValues.username !== originalValues.username ||
    currentValues.email !== originalValues.email

  const passwordValues = watchPassword()
  const hasPasswordChanges =
    passwordValues.currentPassword || passwordValues.newPassword || passwordValues.confirmPassword

  // Check if email can be edited (only for email/password auth)
  const canEditEmail = identities.length === 0 || identities.some((id) => id.provider === 'email')

  // Check if user has OAuth providers (not email)
  const hasOAuthProviders = identities.some((id) => id.provider !== 'email')

  // Check password strength
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

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      // Get current user
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      if (!currentUser) {
        router.push('/login')
        return
      }

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      if (profileError) throw profileError

      // Get user identities
      const {
        data: { identities: userIdentities },
      } = await supabase.auth.getUserIdentities()
      setIdentities(userIdentities || [])

      setProfile(profileData)

      const formData = {
        username: profileData.username || '',
        email: currentUser.email || '',
      }

      setOriginalValues(formData)
      reset(formData)
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      toast.error('Failed to load account settings')
    } finally {
      setIsLoading(false)
    }
  }

  const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    if (username === originalValues.username) return true

    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()

    return !data
  }

  const onSubmit = async (data: AccountSettingsFormData) => {
    try {
      setIsSaving(true)

      // Check username availability
      if (data.username !== originalValues.username) {
        const isAvailable = await checkUsernameAvailability(data.username)
        if (!isAvailable) {
          setError('username', { message: 'This username is already taken' })
          setIsSaving(false)
          return
        }
      }

      const supabase = createClient()

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ username: data.username })
        .eq('id', user?.id)

      if (profileError) throw profileError

      // Update email if changed and allowed
      if (canEditEmail && data.email !== originalValues.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: data.email,
        })
        if (emailError) throw emailError

        toast.info('Check your new email for a confirmation link')
      }

      setOriginalValues(data)
      reset(data)
      await refreshUser()
      toast.success('Account settings updated successfully')
    } catch (error: any) {
      console.error('Failed to update account:', error)
      toast.error(error.message || 'Failed to update account settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = () => {
    confirm({
      title: 'Delete Account',
      message:
        'Are you sure you want to delete your account? This will permanently delete all your data including organizations, projects, and access. This action cannot be undone.',
      confirmText: 'Delete Account',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        try {
          // TODO: Implement account deletion
          // This should call a server-side function to properly delete all user data
          toast.error('Account deletion is not yet implemented')
        } catch (error: any) {
          console.error('Failed to delete account:', error)
          toast.error(error.message || 'Failed to delete account')
        }
      },
    })
  }

  const handleCancel = () => {
    reset(originalValues)
  }

  const handlePasswordCancel = () => {
    resetPassword()
    setPassword('')
    setConfirmPassword('')
    setPasswordRequirements({
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    })
  }

  const onPasswordSubmit = async (data: PasswordUpdateFormData) => {
    try {
      setIsUpdatingPassword(true)
      const supabase = createClient()

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      })

      if (error) throw error

      // Reset form
      handlePasswordCancel()
      toast.success('Password updated successfully')
    } catch (error: any) {
      console.error('Failed to update password:', error)
      setPasswordError('root', {
        message: error.message || 'Failed to update password. Please check your current password.',
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  if (isLoading) {
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
          <p className="text-foreground-muted">Loading account settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto max-w-4xl px-4">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
          <p className="mt-2 text-foreground-muted">Manage your personal account settings</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 flex justify-center gap-6 border-b border-border">
          <Link
            href="/account/settings"
            className="border-b-2 border-terminal-green pb-3 text-sm font-medium text-foreground"
          >
            Account Settings
          </Link>
          <Link
            href="/account/audit"
            className="pb-3 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
          >
            Audit Logs
          </Link>
        </div>

        {/* Account Settings Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-6 rounded-lg border border-border bg-background-secondary">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-lg font-semibold text-foreground">Account Information</h2>
            </div>

            <div className="space-y-6 p-6">
              <FormInput
                label="Username"
                placeholder="johndoe"
                error={errors.username?.message}
                hint="This is your unique identifier across the platform"
                {...register('username')}
              />

              <div>
                <FormInput
                  label="Email Address"
                  type="email"
                  placeholder="john@example.com"
                  error={errors.email?.message}
                  disabled={!canEditEmail}
                  {...register('email')}
                />
                {!canEditEmail && hasOAuthProviders && (
                  <p className="mt-2 text-sm text-foreground-muted">
                    You're signed in with{' '}
                    {identities.find((id) => id.provider !== 'email')?.provider === 'github'
                      ? 'GitHub'
                      : 'Google'}
                    . To change your email, update it in your{' '}
                    {identities.find((id) => id.provider !== 'email')?.provider === 'github'
                      ? 'GitHub'
                      : 'Google'}{' '}
                    account settings.
                  </p>
                )}
              </div>

              {/* Connected Accounts - Only show for OAuth users */}
              {hasOAuthProviders && (
                <div className="border-t border-border pt-6">
                  <h3 className="mb-4 text-sm font-medium text-foreground">Connected Accounts</h3>
                  <div className="space-y-3">
                    {identities
                      .filter((identity) => identity.provider !== 'email')
                      .map((identity) => (
                        <div
                          key={identity.id}
                          className="flex items-center justify-between rounded-lg border border-border p-3"
                        >
                          <div className="flex items-center gap-3">
                            {identity.provider === 'github' ? (
                              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                              </svg>
                            ) : (
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
                            )}
                            <div>
                              <p className="text-sm font-medium capitalize text-foreground">
                                {identity.provider}
                              </p>
                              <p className="text-xs text-foreground-muted">Connected</p>
                            </div>
                          </div>
                          <span className="text-xs text-terminal-green">✓ Active</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Save/Cancel Buttons */}
            <div className="flex justify-end gap-3 border-t border-border bg-background-tertiary/50 px-6 py-4">
              <button
                type="button"
                onClick={handleCancel}
                disabled={!hasChanges}
                className="rounded-lg border border-border bg-background-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background-tertiary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-background-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !hasChanges}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-pulse">Saving</span>
                    <span className="animate-terminal-blink">_</span>
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Password Update Form - Only show for email/password auth */}
        {canEditEmail && (
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="mb-6">
            <div className="rounded-lg border border-border bg-background-secondary">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-lg font-semibold text-foreground">Update Password</h2>
              </div>

              <div className="space-y-6 p-6">
                {passwordErrors.root && (
                  <div className="rounded-lg bg-red-500/10 p-4 text-sm text-red-500">
                    {passwordErrors.root.message}
                  </div>
                )}

                <FormInput
                  label="Current Password"
                  type="password"
                  placeholder="••••••••"
                  error={passwordErrors.currentPassword?.message}
                  {...registerPassword('currentPassword')}
                />

                <div>
                  <FormInput
                    label="New Password"
                    type="password"
                    placeholder="••••••••"
                    error={passwordErrors.newPassword?.message}
                    {...registerPassword('newPassword', {
                      onChange: (e) => checkPasswordStrength(e.target.value),
                    })}
                  />

                  {/* Password Requirements */}
                  {password && (
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
                  )}

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
                        {Object.values(passwordRequirements).filter(Boolean).length === 1 && 'Weak'}
                        {Object.values(passwordRequirements).filter(Boolean).length === 2 && 'Fair'}
                        {Object.values(passwordRequirements).filter(Boolean).length === 3 && 'Good'}
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
                    label="Confirm New Password"
                    type="password"
                    placeholder="••••••••"
                    error={passwordErrors.confirmPassword?.message}
                    {...registerPassword('confirmPassword', {
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
              </div>

              {/* Save/Cancel Buttons */}
              <div className="flex justify-end gap-3 border-t border-border bg-background-tertiary/50 px-6 py-4">
                <button
                  type="button"
                  onClick={handlePasswordCancel}
                  disabled={!hasPasswordChanges}
                  className="rounded-lg border border-border bg-background-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background-tertiary disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-background-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword || !hasPasswordChanges || !allRequirementsMet}
                  className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isUpdatingPassword ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-pulse">Updating</span>
                      <span className="animate-terminal-blink">_</span>
                    </span>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Danger Zone */}
        <div className="rounded-lg border border-red-500/20 bg-background-secondary">
          <div className="px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">DANGER ZONE</h2>
          </div>

          <div className="border-t border-red-500/20 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <svg
                  className="h-5 w-5 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              <div className="flex-1">
                <p className="mb-1 font-medium text-foreground">Delete your account</p>
                <p className="mb-4 text-sm text-foreground-muted">
                  Once you delete your account, there is no going back. All your data will be
                  permanently removed.
                </p>

                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>

        <ConfirmationModal />
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
