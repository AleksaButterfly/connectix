'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { projectService } from '@/lib/projects/project.service'
import FormInput from '@/components/ui/FormInput'
import { useIntl, FormattedMessage } from '@/lib/i18n'

export default function NewProjectPage() {
  const intl = useIntl()
  const router = useRouter()
  const params = useParams()
  const organizationId = params.id as string
  const [isLoading, setIsLoading] = useState(false)

  // Form validation schema
  const createProjectSchema = z.object({
    name: z
      .string()
      .min(1, intl.formatMessage({ id: 'validation.project.nameRequired' }))
      .max(100, intl.formatMessage({ id: 'validation.project.nameTooLong' }))
      .trim(),
    description: z
      .string()
      .max(500, intl.formatMessage({ id: 'validation.project.descriptionTooLong' }))
      .optional()
      .nullable(),
  })

  type CreateProjectFormData = z.infer<typeof createProjectSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const onSubmit = async (data: CreateProjectFormData) => {
    setIsLoading(true)

    try {
      const project = await projectService.createProject(organizationId, {
        name: data.name,
        description: data.description || null,
      })
      // Redirect to the new project page
      router.push(`/dashboard/organizations/${organizationId}/projects/${project.id}`)
    } catch (err: any) {
      console.error('Failed to create project:', err)
      setError('root', {
        message: err.message || intl.formatMessage({ id: 'projects.new.error.createFailed' }),
      })
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-2xl px-6 py-8">
      <div className="mb-8">
        <Link
          href={`/dashboard/organizations/${organizationId}`}
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
          <FormattedMessage id="projects.new.backToProjects" />
        </Link>

        <h1 className="text-3xl font-bold text-foreground">
          <FormattedMessage id="projects.new.title" />
        </h1>
      </div>

      <div className="rounded-lg border border-border bg-background-secondary p-8">
        <div className="mb-6">
          <h2 className="mb-2 text-xl font-semibold text-foreground">
            <FormattedMessage id="projects.new.formTitle" />
          </h2>
          <p className="text-sm text-foreground-muted">
            <FormattedMessage id="projects.new.formDescription" />
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
              label={intl.formatMessage({ id: 'projects.new.nameLabel' })}
              placeholder={intl.formatMessage({ id: 'projects.new.namePlaceholder' })}
              error={errors.name?.message}
              disabled={isLoading}
              autoFocus
              {...register('name')}
            />
            <p className="mt-2 text-sm text-foreground-muted">
              <FormattedMessage id="projects.new.nameHint" />
            </p>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-foreground">
              {intl.formatMessage({ id: 'projects.new.descriptionLabel' })}
            </label>
            <textarea
              className={`w-full rounded-lg border bg-background px-4 py-2.5 text-foreground placeholder-foreground-muted transition-colors focus:border-terminal-green focus:outline-none focus:ring-1 focus:ring-terminal-green ${
                errors.description ? 'border-red-500' : 'border-border'
              } ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
              placeholder={intl.formatMessage({ id: 'projects.new.descriptionPlaceholder' })}
              rows={4}
              disabled={isLoading}
              {...register('description')}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <Link
              href={`/dashboard/organizations/${organizationId}`}
              className="px-4 py-2 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
            >
              <FormattedMessage id="common.cancel" />
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
                  <FormattedMessage id="projects.new.creating" />
                </>
              ) : (
                <FormattedMessage id="projects.new.createButton" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
