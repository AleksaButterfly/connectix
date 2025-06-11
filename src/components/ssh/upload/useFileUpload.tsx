'use client'

import { useState, useCallback } from 'react'
import { useIntl } from '@/lib/i18n'
import { useToast } from '@/components/ui'
import { FileWithPreview, UploadResult } from './types'
import { MAX_FILE_SIZE, MAX_TOTAL_SIZE, isFileAllowed, isImageFile } from './constants'

interface UseFileUploadOptions {
  onUpload: (files: File[]) => Promise<UploadResult[]>
  onComplete?: () => void
  maxFiles?: number
}

export const useFileUpload = ({ 
  onUpload, 
  onComplete,
  maxFiles = 10 
}: UseFileUploadOptions) => {
  const intl = useIntl()
  const { toast } = useToast()
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const createPreview = useCallback((file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (!isImageFile(file)) {
        resolve(undefined)
        return
      }

      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = () => resolve(undefined)
      reader.readAsDataURL(file)
    })
  }, [])

  const validateFiles = useCallback((newFiles: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = []
    const errors: string[] = []

    // Check if adding these files would exceed the max
    if (files.length + newFiles.length > maxFiles) {
      errors.push(
        intl.formatMessage(
          { id: 'files.upload.validation.tooManyFiles' },
          { max: maxFiles }
        )
      )
      return { valid, errors }
    }

    let totalSize = files.reduce((sum, f) => sum + f.file.size, 0)

    for (const file of newFiles) {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(
          intl.formatMessage(
            { id: 'files.upload.validation.fileTooLarge' },
            { name: file.name, size: '100MB' }
          )
        )
        continue
      }

      // Check total size
      if (totalSize + file.size > MAX_TOTAL_SIZE) {
        errors.push(
          intl.formatMessage(
            { id: 'files.upload.validation.totalSizeTooLarge' },
            { size: '500MB' }
          )
        )
        break
      }

      // Check file extension
      if (!isFileAllowed(file.name)) {
        errors.push(
          intl.formatMessage(
            { id: 'files.upload.validation.fileTypeNotAllowed' },
            { name: file.name }
          )
        )
        continue
      }

      // Check for duplicates
      const isDuplicate = files.some(f => 
        f.file.name === file.name && f.file.size === file.size
      )
      if (isDuplicate) {
        errors.push(
          intl.formatMessage(
            { id: 'files.upload.validation.duplicateFile' },
            { name: file.name }
          )
        )
        continue
      }

      valid.push(file)
      totalSize += file.size
    }

    return { valid, errors }
  }, [files, maxFiles, intl])

  const addFiles = useCallback(async (newFiles: File[]) => {
    const { valid, errors } = validateFiles(newFiles)

    // Show validation errors
    errors.forEach(error => toast.error(error))

    if (valid.length === 0) return

    // Create file objects with previews
    const fileObjects: FileWithPreview[] = await Promise.all(
      valid.map(async (file) => {
        const preview = await createPreview(file)
        return {
          file,
          id: `${file.name}-${file.size}-${Date.now()}`,
          preview,
          status: 'pending' as const,
          progress: 0,
        }
      })
    )

    setFiles(prev => [...prev, ...fileObjects])
  }, [validateFiles, createPreview, toast])

  const removeFile = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }, [])

  const startUpload = useCallback(async () => {
    const pendingFiles = files.filter(f => f.status === 'pending')
    if (pendingFiles.length === 0) return

    setIsUploading(true)

    try {
      // Set all files to uploading
      setFiles(prev => prev.map(f => 
        f.status === 'pending' 
          ? { ...f, status: 'uploading' as const, progress: 0 }
          : f
      ))

      // Upload files
      const results = await onUpload(pendingFiles.map(f => f.file))

      // Update file statuses based on results
      setFiles(prev => prev.map(f => {
        const result = results.find(r => r.file === f.file)
        if (!result) return f

        return {
          ...f,
          status: result.success ? 'success' as const : 'error' as const,
          progress: 100,
          error: result.error,
        }
      }))

      const successCount = results.filter(r => r.success).length
      const errorCount = results.filter(r => !r.success).length

      if (successCount > 0) {
        toast.success(
          intl.formatMessage(
            { id: 'files.upload.successCount' },
            { count: successCount }
          )
        )
      }

      if (errorCount > 0) {
        toast.error(
          intl.formatMessage(
            { id: 'files.upload.errorCount' },
            { count: errorCount }
          )
        )
      }

      if (errorCount === 0 && onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error('Upload failed:', error)
      toast.error(intl.formatMessage({ id: 'files.upload.generalError' }))
      
      // Mark all uploading files as failed
      setFiles(prev => prev.map(f => 
        f.status === 'uploading' 
          ? { ...f, status: 'error' as const, error: 'Upload failed' }
          : f
      ))
    } finally {
      setIsUploading(false)
    }
  }, [files, onUpload, onComplete, intl, toast])

  const clearCompleted = useCallback(() => {
    setFiles(prev => prev.filter(f => f.status !== 'success'))
  }, [])

  const reset = useCallback(() => {
    setFiles([])
    setIsUploading(false)
  }, [])

  const canUpload = files.some(f => f.status === 'pending') && !isUploading
  const hasCompleted = files.some(f => f.status === 'success')
  const hasErrors = files.some(f => f.status === 'error')

  return {
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
  }
}