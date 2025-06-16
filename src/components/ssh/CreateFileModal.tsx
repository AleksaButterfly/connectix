'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useIntl, FormattedMessage } from '@/lib/i18n'

interface CreateFileModalProps {
  onClose: () => void
  onCreate: (name: string, content?: string) => Promise<void>
}

export function CreateFileModal({ onClose, onCreate }: CreateFileModalProps) {
  const intl = useIntl()

  // Validation schema
  const createFileSchema = z.object({
    name: z
      .string()
      .min(1, intl.formatMessage({ id: 'files.validation.nameRequired' }))
      .max(255, intl.formatMessage({ id: 'files.validation.nameTooLong' }))
      .regex(/^[^/\\]+$/, intl.formatMessage({ id: 'files.validation.invalidCharacters' }))
      .refine(
        (name) => !(name === '.' || name === '..'),
        intl.formatMessage({ id: 'files.validation.invalidName' })
      ),
    content: z.string().optional(),
  })

  type CreateFileFormData = z.infer<typeof createFileSchema>

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<CreateFileFormData>({
    resolver: zodResolver(createFileSchema),
    defaultValues: {
      name: '',
      content: '',
    },
  })

  const onSubmit = async (data: CreateFileFormData) => {
    try {
      await onCreate(data.name.trim(), data.content)
      onClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      setError('root', {
        message: errorMessage || intl.formatMessage({ id: 'files.errors.createFailed' }),
      })
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-border bg-background p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          <FormattedMessage id="files.createFile.title" />
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name Input */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              <FormattedMessage id="files.createFile.nameLabel" />
            </label>
            <input
              type="text"
              {...register('name')}
              placeholder={intl.formatMessage({ id: 'files.createFile.namePlaceholder' })}
              className={`w-full rounded-md border px-3 py-2 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 ${
                errors.name
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-border bg-background focus:border-terminal-green focus:ring-terminal-green'
              }`}
              autoFocus
              disabled={isSubmitting}
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
            <p className="mt-1 text-xs text-foreground-muted">
              <FormattedMessage id="files.createFile.nameHint" />
            </p>
          </div>

          {/* Initial Content (Optional) */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              <FormattedMessage id="files.createFile.contentLabel" />
            </label>
            <textarea
              {...register('content')}
              placeholder={intl.formatMessage({ id: 'files.createFile.contentPlaceholder' })}
              rows={4}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-foreground-muted focus:border-terminal-green focus:outline-none focus:ring-1 focus:ring-terminal-green"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-foreground-muted">
              <FormattedMessage id="files.createFile.contentHint" />
            </p>
          </div>

          {/* Root Error */}
          {errors.root && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {errors.root.message}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-background-secondary focus:outline-none focus:ring-2 focus:ring-terminal-green focus:ring-offset-2 disabled:opacity-50"
            >
              <FormattedMessage id="common.cancel" />
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="hover:bg-terminal-green-hover flex-1 rounded-md bg-terminal-green px-4 py-2 text-sm font-medium text-background focus:outline-none focus:ring-2 focus:ring-terminal-green focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  <FormattedMessage id="files.createFile.creating" />
                </div>
              ) : (
                <FormattedMessage id="files.createFile.createButton" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
