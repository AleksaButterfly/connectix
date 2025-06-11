'use client'

import { useCallback, useState } from 'react'
import { FormattedMessage } from '@/lib/i18n'
import { Button, Icon } from '@/components/ui'
import { cn } from '@/lib/utils/cn'

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void
  disabled?: boolean
  maxFiles?: number
  currentFileCount?: number
}

export const DropZone = ({ 
  onFilesAdded, 
  disabled = false, 
  maxFiles = 10,
  currentFileCount = 0 
}: DropZoneProps) => {
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      onFilesAdded(files)
    }
  }, [onFilesAdded, disabled])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return

    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFilesAdded(files)
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }, [onFilesAdded, disabled])

  const canAddMoreFiles = currentFileCount < maxFiles

  return (
    <div
      className={cn(
        'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors',
        dragActive && !disabled && canAddMoreFiles
          ? 'border-terminal-green bg-terminal-green/5'
          : 'border-border',
        disabled || !canAddMoreFiles
          ? 'cursor-not-allowed opacity-50'
          : 'cursor-pointer hover:border-terminal-green hover:bg-terminal-green/5'
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => {
        if (!disabled && canAddMoreFiles) {
          document.getElementById('file-upload-input')?.click()
        }
      }}
    >
      <input
        id="file-upload-input"
        type="file"
        multiple
        onChange={handleFileInput}
        disabled={disabled || !canAddMoreFiles}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        accept="*/*"
      />

      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-background-secondary p-3">
            <Icon name="upload" size="lg" className="text-foreground-muted" />
          </div>
        </div>

        <div>
          <p className="text-lg font-medium text-foreground">
            {canAddMoreFiles ? (
              <FormattedMessage id="files.upload.dropFiles" />
            ) : (
              <FormattedMessage 
                id="files.upload.maxFilesReached" 
                values={{ max: maxFiles }} 
              />
            )}
          </p>
          {canAddMoreFiles && (
            <>
              <p className="mt-1 text-sm text-foreground-muted">
                <FormattedMessage id="files.upload.or" />
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                disabled={disabled}
              >
                <FormattedMessage id="files.upload.browseFiles" />
              </Button>
            </>
          )}
        </div>

        {canAddMoreFiles && (
          <div className="text-xs text-foreground-muted">
            <p>
              <FormattedMessage id="files.upload.maxFileSize" values={{ size: '100MB' }} />
            </p>
            <p>
              <FormattedMessage 
                id="files.upload.filesRemaining" 
                values={{ 
                  current: currentFileCount, 
                  max: maxFiles 
                }} 
              />
            </p>
          </div>
        )}
      </div>
    </div>
  )
}