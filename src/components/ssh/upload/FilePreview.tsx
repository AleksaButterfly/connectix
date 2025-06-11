'use client'

import { FormattedMessage } from '@/lib/i18n'
import { Button, Icon } from '@/components/ui'
import { formatFileSize } from './constants'
import { FileWithPreview } from './types'

interface FilePreviewProps {
  file: FileWithPreview
  onRemove: (id: string) => void
}

export const FilePreview = ({ file, onRemove }: FilePreviewProps) => {
  const getStatusIcon = () => {
    switch (file.status) {
      case 'success':
        return <Icon name="check" className="text-green-500" size="sm" />
      case 'error':
        return <Icon name="error" className="text-red-500" size="sm" />
      case 'uploading':
        return (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-terminal-green border-t-transparent" />
        )
      default:
        return <Icon name="file" className="text-foreground-muted" size="sm" />
    }
  }

  const getStatusColor = () => {
    switch (file.status) {
      case 'success':
        return 'border-green-500 bg-green-50'
      case 'error':
        return 'border-red-500 bg-red-50'
      case 'uploading':
        return 'border-terminal-green bg-terminal-green/5'
      default:
        return 'border-border bg-background'
    }
  }

  return (
    <div className={`rounded-lg border p-4 transition-colors ${getStatusColor()}`}>
      <div className="flex items-start gap-3">
        {/* File Icon/Preview */}
        <div className="flex-shrink-0">
          {file.preview ? (
            <img
              src={file.preview}
              alt={file.file.name}
              className="h-12 w-12 rounded object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded bg-background-secondary">
              <Icon name="file" size="md" className="text-foreground-muted" />
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {file.file.name}
              </p>
              <p className="text-xs text-foreground-muted">
                {formatFileSize(file.file.size)}
              </p>
            </div>

            <div className="ml-2 flex items-center gap-2">
              {getStatusIcon()}
              {file.status === 'pending' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(file.id)}
                  className="h-6 w-6 p-0"
                >
                  <Icon name="close" size="sm" />
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {file.status === 'uploading' && (
            <div className="mt-2">
              <div className="h-2 w-full rounded-full bg-background-secondary">
                <div
                  className="h-2 rounded-full bg-terminal-green transition-all duration-300"
                  style={{ width: `${file.progress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-foreground-muted">
                {file.progress}% <FormattedMessage id="files.upload.uploading" />
              </p>
            </div>
          )}

          {/* Error Message */}
          {file.status === 'error' && file.error && (
            <p className="mt-1 text-xs text-red-500">{file.error}</p>
          )}

          {/* Success Message */}
          {file.status === 'success' && (
            <p className="mt-1 text-xs text-green-600">
              <FormattedMessage id="files.upload.complete" />
            </p>
          )}
        </div>
      </div>
    </div>
  )
}