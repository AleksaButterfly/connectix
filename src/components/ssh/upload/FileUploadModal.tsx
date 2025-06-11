'use client'

import { useEffect } from 'react'
import { FormattedMessage } from '@/lib/i18n'
import { Modal, Button, Icon } from '@/components/ui'
import { DropZone } from './DropZone'
import { FilePreview } from './FilePreview'
import { useFileUpload } from './useFileUpload'
import { FileUploadModalProps } from './types'

export const FileUploadModal = ({
  isOpen,
  onClose,
  onUpload,
  onComplete,
  currentPath,
}: FileUploadModalProps) => {
  const {
    files,
    isUploading,
    canUpload,
    hasCompleted,
    hasErrors,
    addFiles,
    removeFile,
    startUpload,
    clearCompleted,
    reset,
  } = useFileUpload({ onUpload, onComplete })

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset()
    }
  }, [isOpen, reset])

  const handleClose = () => {
    if (!isUploading) {
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={<FormattedMessage id="files.upload.title" />}
      description={
        <FormattedMessage 
          id="files.upload.description" 
          values={{ path: currentPath }} 
        />
      }
      size="lg"
      closeOnOverlayClick={!isUploading}
      closeOnEscape={!isUploading}
    >
      <div className="space-y-6">
        {/* Drop Zone */}
        <DropZone
          onFilesAdded={addFiles}
          disabled={isUploading}
          currentFileCount={files.length}
          maxFiles={10}
        />

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground">
                <FormattedMessage 
                  id="files.upload.selectedFiles" 
                  values={{ count: files.length }} 
                />
              </h3>
              {hasCompleted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCompleted}
                  disabled={isUploading}
                >
                  <FormattedMessage id="files.upload.clearCompleted" />
                </Button>
              )}
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto">
              {files.map((file) => (
                <FilePreview
                  key={file.id}
                  file={file}
                  onRemove={removeFile}
                />
              ))}
            </div>
          </div>
        )}

        {/* Upload Summary */}
        {files.length > 0 && (
          <div className="rounded-lg bg-background-secondary p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="space-y-1">
                <p className="text-foreground">
                  <FormattedMessage 
                    id="files.upload.summary" 
                    values={{ 
                      total: files.length,
                      size: files.reduce((sum, f) => sum + f.file.size, 0)
                    }} 
                  />
                </p>
                {hasErrors && (
                  <p className="text-red-500">
                    <FormattedMessage 
                      id="files.upload.errorsFound" 
                      values={{ 
                        count: files.filter(f => f.status === 'error').length 
                      }} 
                    />
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isUploading && (
                  <div className="flex items-center gap-2 text-terminal-green">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    <span className="text-sm">
                      <FormattedMessage id="files.upload.uploading" />
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isUploading}
          >
            {isUploading ? (
              <FormattedMessage id="common.uploading" />
            ) : (
              <FormattedMessage id="common.cancel" />
            )}
          </Button>

          <div className="flex gap-2">
            {files.length > 0 && !isUploading && (
              <Button
                variant="outline"
                onClick={reset}
              >
                <FormattedMessage id="common.clear" />
              </Button>
            )}
            <Button
              onClick={startUpload}
              disabled={!canUpload}
              loading={isUploading}
              leftIcon={<Icon name="upload" size="sm" />}
            >
              <FormattedMessage id="files.upload.startUpload" />
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default FileUploadModal