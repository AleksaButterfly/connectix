'use client'

import { useState } from 'react'
import { useIntl, FormattedMessage } from '@/lib/i18n'

interface CreateFolderModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (name: string) => Promise<void>
  currentPath: string
}

export function CreateFolderModal({
  isOpen,
  onClose,
  onConfirm,
  currentPath,
}: CreateFolderModalProps) {
  const intl = useIntl()
  const [name, setName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Folder name is required')
      return
    }

    // Basic validation
    if (name.includes('/') || name.includes('\\')) {
      setError('Folder name cannot contain / or \\ characters')
      return
    }

    if (name.startsWith('.') && name.length < 2) {
      setError('Invalid folder name')
      return
    }

    try {
      setIsCreating(true)
      setError(null)
      await onConfirm(name.trim())
      handleClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create folder')
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setName('')
    setError(null)
    setIsCreating(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-border bg-background p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          📁 <FormattedMessage id="files.createFolder.title" />
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Input */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              <FormattedMessage id="files.createFolder.name" />
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="new-folder"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-foreground-muted focus:border-terminal-green focus:outline-none focus:ring-1 focus:ring-terminal-green"
              autoFocus
              disabled={isCreating}
            />
          </div>

          {/* Current Path */}
          <div className="text-xs text-foreground-muted">
            <FormattedMessage id="files.createFolder.location" />: {currentPath || '/'}
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isCreating}
              className="flex-1 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-background-secondary focus:outline-none focus:ring-2 focus:ring-terminal-green focus:ring-offset-2 disabled:opacity-50"
            >
              <FormattedMessage id="common.cancel" />
            </button>
            <button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="hover:bg-terminal-green-hover flex-1 rounded-md bg-terminal-green px-4 py-2 text-sm font-medium text-background focus:outline-none focus:ring-2 focus:ring-terminal-green focus:ring-offset-2 disabled:opacity-50"
            >
              {isCreating ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent"></div>
                  <FormattedMessage id="common.creating" />
                </div>
              ) : (
                <FormattedMessage id="files.createFolder.confirm" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
