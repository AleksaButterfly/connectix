'use client'

import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useIntl, FormattedMessage } from '@/lib/i18n'
import type { FileInfo } from '@/types/ssh'

interface RenameModalProps {
  file: FileInfo
  onClose: () => void
  onRename: (oldPath: string, newName: string) => Promise<void>
}

export function RenameModal({ file, onClose, onRename }: RenameModalProps) {
  const intl = useIntl()
  const inputRef = useRef<HTMLInputElement>(null)

  // Validation schema
  const renameSchema = z.object({
    newName: z
      .string()
      .min(1, intl.formatMessage({ id: 'files.validation.nameRequired' }))
      .max(255, intl.formatMessage({ id: 'files.validation.nameTooLong' }))
      .regex(/^[^/\\]+$/, intl.formatMessage({ id: 'files.validation.invalidCharacters' }))
      .refine(
        (name) => !(name === '.' || name === '..'),
        intl.formatMessage({ id: 'files.validation.invalidName' })
      )
      .refine(
        (name) => name !== file.name,
        intl.formatMessage({ id: 'files.validation.sameNameError' })
      ),
  })

  type RenameFormData = z.infer<typeof renameSchema>

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RenameFormData>({
    resolver: zodResolver(renameSchema),
    defaultValues: {
      newName: file.name,
    },
  })

  const onSubmit = async (data: RenameFormData) => {
    try {
      await onRename(file.path, data.newName.trim())
      onClose()
    } catch (error: any) {
      setError('root', {
        message: error.message || intl.formatMessage({ id: 'files.errors.renameFailed' }),
      })
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  // Auto-select filename without extension for files
  useEffect(() => {
    if (inputRef.current) {
      if (file.type === 'file' && file.name.includes('.')) {
        const lastDotIndex = file.name.lastIndexOf('.')
        inputRef.current.setSelectionRange(0, lastDotIndex)
      } else {
        inputRef.current.select()
      }
    }
  }, [file])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-border bg-background p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          <FormattedMessage
            id={file.type === 'directory' ? 'files.rename.folderTitle' : 'files.rename.fileTitle'}
          />
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Current Name Display */}
          <div>
            <label className="mb-1 block text-sm text-foreground-muted">
              <FormattedMessage id="files.rename.currentName" />
            </label>
            <p className="text-sm font-medium text-foreground">{file.name}</p>
          </div>

          {/* New Name Input */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              <FormattedMessage id="files.rename.newNameLabel" />
            </label>
            <input
              type="text"
              {...register('newName')}
              ref={(e) => {
                register('newName').ref(e)
                // @ts-ignore
                inputRef.current = e
              }}
              placeholder={intl.formatMessage({ id: 'files.rename.newNamePlaceholder' })}
              className={`w-full rounded-lg border px-3 py-2 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-1 ${
                errors.newName
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'border-border bg-background focus:border-terminal-green focus:ring-terminal-green'
              }`}
              autoFocus
              disabled={isSubmitting}
            />
            {errors.newName && (
              <p className="mt-1 text-sm text-red-500">{errors.newName.message}</p>
            )}
          </div>

          {/* Root Error */}
          {errors.root && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {errors.root.message}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-background-secondary focus:outline-none focus:ring-2 focus:ring-terminal-green focus:ring-offset-2 disabled:opacity-50"
            >
              <FormattedMessage id="common.cancel" />
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="hover:bg-terminal-green-hover rounded-lg bg-terminal-green px-4 py-2 text-sm font-medium text-background focus:outline-none focus:ring-2 focus:ring-terminal-green focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  <FormattedMessage id="files.rename.renaming" />
                </div>
              ) : (
                <FormattedMessage id="files.rename.renameButton" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
