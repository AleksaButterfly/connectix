'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { organizationService } from '@/lib/organizations/organization.service'
import FormInput from '@/components/ui/FormInput'
import { useConfirmation } from '@/hooks/useConfirmation'
import { useToast } from '@/components/ui/ToastContext'
import type { Organization } from '@/types/organization'

// Form validation schema
const organizationSettingsSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100, 'Name is too long'),
  slug: z
    .string()
    .min(1, 'Organization slug is required')
    .max(100, 'Slug is too long')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
})

type OrganizationSettingsFormData = z.infer<typeof organizationSettingsSchema>

export default function OrganizationSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = params.id as string

  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [originalValues, setOriginalValues] = useState<OrganizationSettingsFormData>({
    name: '',
    slug: '',
  })
  const [isCopied, setIsCopied] = useState(false)

  const { confirm, ConfirmationModal } = useConfirmation()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setError,
    setValue,
    watch,
    reset,
  } = useForm<OrganizationSettingsFormData>({
    resolver: zodResolver(organizationSettingsSchema),
    defaultValues: {
      name: '',
      slug: '',
    },
  })

  // Watch the name field to auto-generate slug
  const watchName = watch('name')
  const currentValues = watch()

  // Check if form has been modified
  const hasChanges =
    currentValues.name !== originalValues.name || currentValues.slug !== originalValues.slug

  useEffect(() => {
    // Auto-generate slug when name changes
    if (watchName && watchName !== originalValues.name) {
      const generatedSlug = watchName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
      setValue('slug', generatedSlug)
    }
  }, [watchName, setValue, originalValues.name])

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setIsLoading(true)
        const org = await organizationService.getOrganization(orgId)
        if (!org) {
          router.push('/dashboard/organizations')
          return
        }

        // Check if user is owner
        const isOwner = await organizationService.isOrganizationOwner(orgId)
        if (!isOwner) {
          router.push(`/dashboard/organizations/${orgId}`)
          return
        }

        setOrganization(org)

        // Set form default values
        const formData = {
          name: org.name,
          slug: org.slug,
        }
        setOriginalValues(formData)
        reset(formData)
      } catch (error) {
        console.error('Failed to fetch organization:', error)
        router.push('/dashboard/organizations')
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrganization()
  }, [orgId, router, reset])

  const onSubmit = async (data: OrganizationSettingsFormData) => {
    try {
      setIsSaving(true)
      const updated = await organizationService.updateOrganization(orgId, {
        name: data.name.trim(),
        slug: data.slug.trim(),
      })

      // Update local state
      setOrganization(updated)
      const newFormData = {
        name: updated.name,
        slug: updated.slug,
      }
      setOriginalValues(newFormData)
      reset(newFormData)

      // Show success toast
      toast.success('Successfully saved settings')
    } catch (error: any) {
      console.error('Failed to update organization:', error)
      toast.error(error.message || 'Failed to update organization')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = () => {
    confirm({
      title: 'Delete Organization',
      message: `Are you sure you want to delete "${organization?.name}"? This will permanently delete all projects and data associated with this organization. This action cannot be undone.`,
      confirmText: 'Delete Organization',
      cancelText: 'Cancel',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await organizationService.deleteOrganization(orgId)
          router.push('/dashboard/organizations')
        } catch (error: any) {
          console.error('Failed to delete organization:', error)
        }
      },
    })
  }

  const handleCancel = () => {
    reset(originalValues)
  }

  const handleCopySlug = () => {
    const slug = watch('slug')
    navigator.clipboard.writeText(slug)
    setIsCopied(true)
    toast.success('Slug copied to clipboard')
    setTimeout(() => setIsCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
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
          <p className="text-foreground-muted">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Organization Settings</h1>
      </div>

      {/* General Settings Box */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-6 rounded-lg border border-border bg-background-secondary">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">General settings</h2>
          </div>

          <div className="space-y-6 p-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <FormInput
                  label="Organization name"
                  placeholder="My Organization"
                  error={errors.name?.message}
                  {...register('name')}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-foreground-muted">
                  Organization slug
                </label>
                <div className="flex items-center gap-2">
                  <FormInput
                    placeholder="my-organization"
                    error={errors.slug?.message}
                    className="flex-1"
                    {...register('slug')}
                  />
                  <button
                    type="button"
                    onClick={handleCopySlug}
                    className={`flex h-[42px] w-[42px] items-center justify-center rounded-lg border transition-all duration-200 ${
                      isCopied
                        ? 'border-terminal-green bg-terminal-green/10 text-terminal-green'
                        : 'border-border bg-background-tertiary text-foreground-muted hover:bg-background-secondary hover:text-foreground'
                    }`}
                    title={isCopied ? 'Copied!' : 'Copy slug'}
                  >
                    {isCopied ? (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
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
                'Save'
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Danger Zone Box */}
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
              <p className="mb-1 font-medium text-foreground">
                Deleting this organization will also remove its projects
              </p>
              <p className="mb-4 text-sm text-foreground-muted">
                Make sure you have made a backup of your projects if you want to keep your data
              </p>

              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                Delete organization
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal />
    </div>
  )
}
