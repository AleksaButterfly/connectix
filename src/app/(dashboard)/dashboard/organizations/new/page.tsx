'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { organizationService } from '@/lib/organizations/organization.service'
import FormInput from '@/components/ui/FormInput'

// Form validation schema
const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, 'Organization name is required')
    .max(100, 'Organization name is too long')
    .trim(),
})

type CreateOrganizationFormData = z.infer<typeof createOrganizationSchema>

export default function NewOrganizationPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<CreateOrganizationFormData>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: '',
    },
  })

  const onSubmit = async (data: CreateOrganizationFormData) => {
    setIsLoading(true)

    try {
      const org = await organizationService.createOrganization(data.name)
      // Redirect to the new organization page using ID
      router.push(`/dashboard/organizations/${org.id}`)
    } catch (err: any) {
      console.error('Failed to create organization:', err)
      setError('root', {
        message: err.message || 'Failed to create organization',
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-6 py-8">
      <div className="mb-8">
        <Link
          href="/dashboard/organizations"
          className="mb-4 inline-flex items-center gap-2 text-sm text-foreground-muted transition-colors hover:text-foreground"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to organizations
        </Link>

        <h1 className="text-3xl font-bold text-foreground">New organization</h1>
      </div>

      <div className="rounded-lg border border-border bg-background-secondary p-8">
        <div className="mb-6">
          <h2 className="mb-2 text-xl font-semibold text-foreground">Create a new organization</h2>
          <p className="text-sm text-foreground-muted">
            This is your organization within Connectix.
            <br />
            For example, you can use the name of your company or department.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {errors.root && (
            <div className="mb-4 rounded-lg bg-red-500/10 p-4 text-sm text-red-500">
              {errors.root.message}
            </div>
          )}

          <div className="mb-6">
            <FormInput
              label="Name"
              placeholder="Organization name"
              error={errors.name?.message}
              disabled={isLoading}
              autoFocus
              {...register('name')}
            />
            <p className="mt-2 text-sm text-foreground-muted">
              You can rename your organization later
            </p>
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href="/dashboard/organizations"
              className="px-4 py-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
                  Creating...
                </>
              ) : (
                'Create organization'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
