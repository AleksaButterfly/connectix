'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useIntl, FormattedMessage } from '@/lib/i18n'
import { useToast } from '@/components/ui/ToastContext'

interface FileWithPreview {
  file: File
  id: string
  preview?: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

interface FileUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (files: File[]) => Promise<{ file: File; success: boolean; error?: string }[]>
  onComplete?: () => void
  currentPath: string
}

export function FileUploadModal({
  isOpen,
  onClose,
  onUpload,
  onComplete,
  currentPath,
}: FileUploadModalProps) {
  const intl = useIntl()
  const { toast } = useToast()
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setFiles([])
    }
  }, [isOpen])

  // File type icons mapping
  const getFileIcon = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    const iconMap: Record<string, string> = {
      // Documents
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      txt: '📃',
      md: '📋',

      // Code
      js: '📜',
      ts: '📜',
      jsx: '⚛️',
      tsx: '⚛️',
      json: '{}',
      xml: '</>',
      html: '🌐',
      css: '🎨',

      // Archives
      zip: '📦',
      rar: '📦',
      tar: '📦',
      gz: '📦',

      // Media
      mp3: '🎵',
      mp4: '🎬',
      avi: '🎬',
      mov: '🎬',

      // Default
      default: '📎',
    }

    return iconMap[ext || ''] || iconMap.default
  }

  const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/')
  }

  const handleFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles)

    const newFileObjects: FileWithPreview[] = fileArray.map((file) => {
      const fileObj: FileWithPreview = {
        file,
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        status: 'pending',
        progress: 0,
      }

      // Generate preview for images
      if (isImageFile(file)) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileObj.id ? { ...f, preview: e.target?.result as string } : f
            )
          )
        }
        reader.readAsDataURL(file)
      }

      return fileObj
    })

    setFiles((prev) => [...prev, ...newFileObjects])
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const droppedFiles = e.dataTransfer.files
      if (droppedFiles.length > 0) {
        handleFiles(droppedFiles)
      }
    },
    [handleFiles]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files)
      }
    },
    [handleFiles]
  )

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id)
      // Revoke preview URL if it exists
      if (file?.preview && file.preview.startsWith('blob:')) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter((f) => f.id !== id)
    })
  }, [])

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleUpload = async () => {
    if (files.length === 0 || isUploading) return

    setIsUploading(true)

    // Filter out files that already succeeded
    const filesToUpload = files.filter((f) => f.status !== 'success')

    // Update status to uploading for pending files
    setFiles((prev) =>
      prev.map((f) => (f.status === 'pending' ? { ...f, status: 'uploading', progress: 0 } : f))
    )

    try {
      // Create file array for upload
      const fileArray = filesToUpload.map((f) => f.file)

      // Simulate progress for each file (0-90%)
      const progressInterval = setInterval(() => {
        setFiles((prev) =>
          prev.map((f) => {
            if (f.status === 'uploading' && f.progress < 90) {
              return { ...f, progress: f.progress + 10 }
            }
            return f
          })
        )
      }, 200)

      // Upload files
      const results = await onUpload(fileArray)

      clearInterval(progressInterval)

      // Update file statuses to 100% based on results
      setFiles((prev) =>
        prev.map((f) => {
          const result = results.find((r) => r.file === f.file)
          if (result) {
            return {
              ...f,
              status: result.success ? 'success' : 'error',
              progress: result.success ? 100 : f.progress,
              error: result.error,
            }
          }
          return f
        })
      )

      // Count results
      const successCount = results.filter((r) => r.success).length
      const failureCount = results.filter((r) => !r.success).length

      // Show error toast immediately if there are failures
      if (failureCount > 0) {
        if (successCount === 0) {
          // All failed
          toast.error(intl.formatMessage({ id: 'fileUpload.error.allFailed' }))
        } else {
          // Some failed
          toast.error(
            intl.formatMessage({ id: 'fileUpload.error.partialFail' }, { failed: failureCount })
          )
        }
      }

      // Wait to show the 100% state
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (successCount > 0 && failureCount === 0) {
        // All succeeded - close modal, refresh files, then show toast
        onClose()

        // Refresh files first
        if (onComplete) {
          onComplete()
        }

        // Then show toast
        setTimeout(() => {
          toast.success(
            intl.formatMessage({ id: 'fileUpload.success.all' }, { count: successCount })
          )
        }, 300)
      } else if (successCount > 0 && failureCount > 0) {
        // Some succeeded, some failed - refresh the successful ones
        if (onComplete) {
          onComplete()
        }
      }
    } catch (error) {
      toast.error(intl.formatMessage({ id: 'fileUpload.error.unexpected' }))

      // Mark all uploading files as error
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'uploading' ? { ...f, status: 'error', error: 'Upload failed' } : f
        )
      )
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      onClose()
    }
  }

  const retryFailed = () => {
    setFiles((prev) =>
      prev.map((f) =>
        f.status === 'error' ? { ...f, status: 'pending', progress: 0, error: undefined } : f
      )
    )
    handleUpload()
  }

  if (!isOpen) return null

  const pendingCount = files.filter((f) => f.status === 'pending').length
  const uploadingCount = files.filter((f) => f.status === 'uploading').length
  const successfulCount = files.filter((f) => f.status === 'success').length
  const errorCount = files.filter((f) => f.status === 'error').length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-lg bg-background-secondary shadow-2xl">
        {/* Header */}
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              <FormattedMessage id="fileUpload.title" />
            </h2>
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="rounded-lg p-1 text-foreground-muted hover:bg-background hover:text-foreground disabled:opacity-50"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-sm text-foreground-muted">
            <FormattedMessage id="fileUpload.uploadTo" values={{ path: currentPath }} />
          </p>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {files.length === 0 ? (
            <div
              className={`rounded-lg border-2 border-dashed p-12 text-center transition-colors ${
                isDragging
                  ? 'border-terminal-green bg-terminal-green/10'
                  : 'border-border hover:border-terminal-green/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="mb-4 text-5xl">📁</div>
              <h3 className="mb-2 text-lg font-medium text-foreground">
                <FormattedMessage id="fileUpload.dropzone.title" />
              </h3>
              <p className="mb-4 text-sm text-foreground-muted">
                <FormattedMessage id="fileUpload.dropzone.subtitle" />
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-terminal-green px-4 py-2 text-sm font-medium text-background hover:bg-terminal-green/90"
              >
                <FormattedMessage id="fileUpload.selectFiles" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File grid */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {files.map((fileObj) => (
                  <div
                    key={fileObj.id}
                    className="group relative overflow-hidden rounded-lg border border-border bg-background"
                  >
                    {/* Preview or Icon */}
                    <div className="relative aspect-square bg-background-tertiary">
                      {fileObj.preview ? (
                        <img
                          src={fileObj.preview}
                          alt={fileObj.file.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center p-4">
                          <div className="mb-2 text-4xl">{getFileIcon(fileObj.file.name)}</div>
                          <p className="text-center text-xs text-foreground-muted">
                            {fileObj.file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                          </p>
                        </div>
                      )}

                      {/* Status overlay */}
                      {fileObj.status === 'uploading' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                          <div className="text-center">
                            <div className="mb-2 h-8 w-8 animate-spin rounded-full border-2 border-terminal-green border-t-transparent"></div>
                            <p className="text-xs text-white">{fileObj.progress}%</p>
                          </div>
                        </div>
                      )}

                      {fileObj.status === 'success' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-terminal-green/90">
                          <div className="text-center text-white">
                            <div className="mb-1 text-3xl">✓</div>
                            <p className="text-xs">
                              <FormattedMessage id="fileUpload.uploaded" />
                            </p>
                          </div>
                        </div>
                      )}

                      {fileObj.status === 'error' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-500/90">
                          <div className="text-center text-white">
                            <div className="mb-1 text-3xl">✗</div>
                            <p className="text-xs">
                              <FormattedMessage id="fileUpload.failed" />
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Remove button */}
                      {fileObj.status !== 'uploading' && (
                        <button
                          onClick={() => removeFile(fileObj.id)}
                          className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* File info */}
                    <div className="p-2">
                      <p
                        className="truncate text-xs font-medium text-foreground"
                        title={fileObj.file.name}
                      >
                        {fileObj.file.name}
                      </p>
                      <p className="text-xs text-foreground-muted">
                        {formatFileSize(fileObj.file.size)}
                      </p>
                      {fileObj.error && (
                        <p className="mt-1 truncate text-xs text-red-500" title={fileObj.error}>
                          {fileObj.error}
                        </p>
                      )}
                    </div>
                  </div>
                ))}

                {/* Add more files button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="group relative aspect-square rounded-lg border-2 border-dashed border-border bg-background transition-colors hover:border-terminal-green/50 hover:bg-terminal-green/5 disabled:opacity-50"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex h-full flex-col items-center justify-center">
                    <div className="mb-2 text-3xl text-foreground-muted group-hover:text-terminal-green">
                      +
                    </div>
                    <p className="text-xs text-foreground-muted">
                      <FormattedMessage id="fileUpload.addMore" />
                    </p>
                  </div>
                </button>
              </div>

              {/* Summary */}
              <div className="rounded-lg bg-background p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-foreground-muted">
                    {pendingCount > 0 && (
                      <span>
                        <FormattedMessage
                          id="fileUpload.pending"
                          values={{ count: pendingCount }}
                        />
                      </span>
                    )}
                    {uploadingCount > 0 && (
                      <span className="text-terminal-blue">
                        <FormattedMessage
                          id="fileUpload.uploading"
                          values={{ count: uploadingCount }}
                        />
                      </span>
                    )}
                    {successfulCount > 0 && (
                      <span className="text-terminal-green">
                        <FormattedMessage
                          id="fileUpload.completed"
                          values={{ count: successfulCount }}
                        />
                      </span>
                    )}
                    {errorCount > 0 && (
                      <span className="text-red-500">
                        <FormattedMessage id="fileUpload.errors" values={{ count: errorCount }} />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4">
          <div className="flex items-center justify-end gap-3">
            {errorCount > 0 && !isUploading && (
              <button
                onClick={retryFailed}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-background-secondary"
              >
                <FormattedMessage id="fileUpload.retryFailed" />
              </button>
            )}

            <button
              onClick={handleClose}
              disabled={isUploading}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-background-secondary disabled:opacity-50"
            >
              <FormattedMessage id="common.cancel" />
            </button>

            <button
              onClick={handleUpload}
              disabled={
                files.length === 0 || isUploading || files.every((f) => f.status === 'success')
              }
              className="rounded-lg bg-terminal-green px-4 py-2 text-sm font-medium text-background hover:bg-terminal-green/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? (
                <FormattedMessage id="fileUpload.uploadingButton" />
              ) : (
                <FormattedMessage
                  id="fileUpload.uploadButton"
                  values={{ count: files.filter((f) => f.status !== 'success').length }}
                />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
