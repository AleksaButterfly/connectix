'use client'

import { useState } from 'react'
import { useIntl, FormattedMessage } from '@/lib/i18n'

interface CreateFileModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (name: string, type: 'file' | 'folder') => Promise<void>
  currentPath: string
}

export function CreateFileModal({ isOpen, onClose, onConfirm, currentPath }: CreateFileModalProps) {
  const intl = useIntl()
  const [name, setName] = useState('')
  const [type, setType] = useState<'file' | 'folder'>('file')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    // Basic validation
    if (name.includes('/') || name.includes('\\')) {
      setError('Name cannot contain / or \\ characters')
      return
    }

    if (name.startsWith('.') && name.length < 2) {
      setError('Invalid name')
      return
    }

    try {
      setIsCreating(true)
      setError(null)
      await onConfirm(name.trim(), type)
      handleClose()
    } catch (err: any) {
      setError(err.message || `Failed to create ${type}`)
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setName('')
    setType('file')
    setError(null)
    setIsCreating(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-border bg-background p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          <FormattedMessage id="files.create.title" />
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              <FormattedMessage id="files.create.type" />
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="file"
                  checked={type === 'file'}
                  onChange={(e) => setType(e.target.value as 'file' | 'folder')}
                  className="text-terminal-green focus:ring-terminal-green"
                />
                <span className="text-sm text-foreground">
                  📄 <FormattedMessage id="files.create.file" />
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="folder"
                  checked={type === 'folder'}
                  onChange={(e) => setType(e.target.value as 'file' | 'folder')}
                  className="text-terminal-green focus:ring-terminal-green"
                />
                <span className="text-sm text-foreground">
                  📁 <FormattedMessage id="files.create.folder" />
                </span>
              </label>
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              <FormattedMessage id="files.create.name" />
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'file' ? 'filename.txt' : 'folder-name'}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-foreground placeholder:text-foreground-muted focus:border-terminal-green focus:outline-none focus:ring-1 focus:ring-terminal-green"
              autoFocus
              disabled={isCreating}
            />
          </div>

          {/* Current Path */}
          <div className="text-xs text-foreground-muted">
            <FormattedMessage id="files.create.location" />: {currentPath || '/'}
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
                <FormattedMessage
                  id="files.create.confirm"
                  values={{ type: type === 'file' ? 'File' : 'Folder' }}
                />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
