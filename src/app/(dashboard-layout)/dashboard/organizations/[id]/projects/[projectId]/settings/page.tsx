'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { projectService } from '@/lib/projects/project.service'
import FormInput from '@/components/ui/FormInput'
import { useConfirmation } from '@/hooks/useConfirmation'
import { useToast } from '@/components/ui/ToastContext'
import type { Project } from '@/types/project'
import { useIntl, FormattedMessage } from '@/lib/i18n'

export default function ProjectSettingsPage() {
  const intl = useIntl()
  const params = useParams()
  const router = useRouter()
  const orgId = params.id as string
  const projectId = params.projectId as string

  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [originalValues, setOriginalValues] = useState<{ name: string; description: string }>({
    name: '',
    description: '',
  })

  const { confirm, ConfirmationModal } = useConfirmation()
  const { toast } = useToast()

  // Form validation schema
  const projectSettingsSchema = z.object({
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

  type ProjectSettingsFormData = z.infer<typeof projectSettingsSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<ProjectSettingsFormData>({
    resolver: zodResolver(projectSettingsSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const currentValues = watch()

  // Check if form has been modified
  const hasChanges =
    currentValues.name !== originalValues.name ||
    (currentValues.description || '') !== originalValues.description

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true)
        const proj = await projectService.getProject(projectId)
        if (!proj) {
          router.push(`/dashboard/organizations/${orgId}`)
          return
        }

        // Check if user has permission to edit project settings
        // This would depend on your permission system
        // For now, we'll assume the service handles authorization

        setProject(proj)

        // Set form default values
        const formData = {
          name: proj.name,
          description: proj.description || '',
        }
        setOriginalValues(formData)
        reset(formData)
      } catch (error) {
        console.error('Failed to fetch project:', error)
        router.push(`/dashboard/organizations/${orgId}`)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProject()
  }, [projectId, orgId, router, reset])

  const onSubmit = async (data: ProjectSettingsFormData) => {
    try {
      setIsSaving(true)
      const updated = await projectService.updateProject(projectId, {
        name: data.name.trim(),
        description: data.description?.trim() || null,
      })

      // Update local state
      setProject(updated)
      const newFormData = {
        name: updated.name,
        description: updated.description || '',
      }
      setOriginalValues(newFormData)
      reset(newFormData)

      // Show success toast
      toast.success(intl.formatMessage({ id: 'project.settings.saveSuccess' }))
    } catch (error: any) {
      console.error('Failed to update project:', error)
      toast.error(error.message || intl.formatMessage({ id: 'project.settings.saveError' }))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = () => {
    confirm({
      title: intl.formatMessage({ id: 'project.settings.delete.title' }),
      message: intl.formatMessage(
        { id: 'project.settings.delete.message' },
        { projectName: project?.name }
      ),
      confirmText: intl.formatMessage({ id: 'project.settings.delete.confirmButton' }),
      cancelText: intl.formatMessage({ id: 'common.cancel' }),
      variant: 'danger',
      onConfirm: async () => {
        try {
          await projectService.deleteProject(projectId)
          router.push(`/dashboard/organizations/${orgId}`)
        } catch (error: any) {
          console.error('Failed to delete project:', error)
          toast.error(error.message || intl.formatMessage({ id: 'project.settings.delete.error' }))
        }
      },
    })
  }

  const handleCancel = () => {
    reset(originalValues)
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
          <p className="text-foreground-muted">
            <FormattedMessage id="project.settings.loading" />
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-6 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          <FormattedMessage id="project.settings.title" />
        </h1>
      </div>

      {/* General Settings Box */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-6 rounded-lg border border-border bg-background-secondary">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">
              <FormattedMessage id="project.settings.general.title" />
            </h2>
          </div>

          <div className="space-y-6 p-6">
            <div>
              <FormInput
                label={intl.formatMessage({ id: 'project.settings.nameLabel' })}
                placeholder={intl.formatMessage({ id: 'project.settings.namePlaceholder' })}
                error={errors.name?.message}
                {...register('name')}
              />
              <p className="mt-2 text-sm text-foreground-muted">
                <FormattedMessage id="project.settings.nameHint" />
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                {intl.formatMessage({ id: 'project.settings.descriptionLabel' })}
              </label>
              <textarea
                className={`w-full rounded-lg border bg-background px-4 py-2.5 text-foreground placeholder-foreground-muted transition-colors focus:border-terminal-green focus:outline-none focus:ring-1 focus:ring-terminal-green ${
                  errors.description ? 'border-red-500' : 'border-border'
                }`}
                placeholder={intl.formatMessage({ id: 'project.settings.descriptionPlaceholder' })}
                rows={4}
                {...register('description')}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>
              )}
              <p className="mt-2 text-sm text-foreground-muted">
                <FormattedMessage id="project.settings.descriptionHint" />
              </p>
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
              <FormattedMessage id="common.cancel" />
            </button>
            <button
              type="submit"
              disabled={isSaving || !hasChanges}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-pulse">
                    <FormattedMessage id="project.settings.saving" />
                  </span>
                  <span className="animate-terminal-blink">_</span>
                </span>
              ) : (
                <FormattedMessage id="common.save" />
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Danger Zone Box */}
      <div className="rounded-lg border border-red-500/20 bg-background-secondary">
        <div className="px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            <FormattedMessage id="project.settings.danger.title" />
          </h2>
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
                <FormattedMessage id="project.settings.danger.warning" />
              </p>
              <p className="mb-4 text-sm text-foreground-muted">
                <FormattedMessage id="project.settings.danger.description" />
              </p>

              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600"
              >
                <FormattedMessage id="project.settings.danger.deleteButton" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal />
    </div>
  )
}
