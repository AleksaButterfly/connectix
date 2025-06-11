import { useState, useCallback } from 'react'
import { useToast } from '@/components/ui'
import { useIntl } from '@/lib/i18n'
import type { FileInfo, FileOperationResponse } from '@/types/ssh'
import { ApiResponseError } from '@/types/ssh'
import { apiCall } from '@/types/ssh'

interface UseFileOperationsOptions {
  connectionId: string
  sessionToken: string
  onRefresh: () => void | Promise<void>
}

export function useFileOperations({
  connectionId,
  sessionToken,
  onRefresh,
}: UseFileOperationsOptions) {
  const { toast } = useToast()
  const intl = useIntl()
  const [isDownloading, setIsDownloading] = useState(false)

  const handleApiError = useCallback(
    (error: unknown, defaultMessage: string) => {
      if (error instanceof ApiResponseError) {
        toast.error(error.message)
      } else if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error(defaultMessage)
      }
    },
    [toast]
  )

  const deleteFiles = useCallback(
    async (filePaths: string[]) => {
      try {
        await Promise.all(
          filePaths.map((path) =>
            apiCall(`/api/connections/${connectionId}/files${path}`, {
              method: 'DELETE',
              headers: { 'x-session-token': sessionToken },
            })
          )
        )

        toast.success(
          intl.formatMessage({ id: 'files.delete.success' }, { count: filePaths.length })
        )
        await onRefresh()
      } catch (error) {
        handleApiError(error, intl.formatMessage({ id: 'files.delete.error' }))
      }
    },
    [connectionId, sessionToken, onRefresh, handleApiError]
  )

  const renameFile = useCallback(
    async (oldPath: string, newName: string) => {
      try {
        const newPath = oldPath.substring(0, oldPath.lastIndexOf('/') + 1) + newName

        await apiCall<FileOperationResponse>(`/api/connections/${connectionId}/files/rename`, {
          method: 'POST',
          headers: { 'x-session-token': sessionToken },
          body: JSON.stringify({ oldPath, newPath }),
        })

        toast.success(intl.formatMessage({ id: 'files.rename.success' }))
        await onRefresh()
      } catch (error) {
        handleApiError(error, intl.formatMessage({ id: 'files.rename.error' }))
      }
    },
    [connectionId, sessionToken, onRefresh, handleApiError]
  )

  const createFile = useCallback(
    async (path: string, content: string = '') => {
      try {
        await apiCall(`/api/connections/${connectionId}/files${path}`, {
          method: 'PUT',
          headers: { 'x-session-token': sessionToken },
          body: JSON.stringify({ content }),
        })

        toast.success(intl.formatMessage({ id: 'files.create.success' }))
        await onRefresh()
      } catch (error) {
        handleApiError(error, intl.formatMessage({ id: 'files.create.error' }))
      }
    },
    [connectionId, sessionToken, onRefresh, handleApiError]
  )

  const createFolder = useCallback(
    async (path: string) => {
      try {
        await apiCall(`/api/connections/${connectionId}/files/mkdir`, {
          method: 'POST',
          headers: { 'x-session-token': sessionToken },
          body: JSON.stringify({ path }),
        })

        toast.success(intl.formatMessage({ id: 'files.createFolder.success' }))
        await onRefresh()
      } catch (error) {
        handleApiError(error, intl.formatMessage({ id: 'files.createFolder.error' }))
      }
    },
    [connectionId, sessionToken, onRefresh, handleApiError]
  )

  const changePermissions = useCallback(
    async (path: string, mode: string) => {
      try {
        await apiCall(`/api/connections/${connectionId}/files/chmod`, {
          method: 'POST',
          headers: { 'x-session-token': sessionToken },
          body: JSON.stringify({ path, mode }),
        })

        toast.success(intl.formatMessage({ id: 'files.permissions.success' }))
        await onRefresh()
      } catch (error) {
        handleApiError(error, intl.formatMessage({ id: 'files.permissions.error' }))
      }
    },
    [connectionId, sessionToken, onRefresh, handleApiError]
  )

  const downloadFiles = useCallback(
    async (files: FileInfo[], selectedPaths: Set<string>) => {
      if (selectedPaths.size === 0 || isDownloading) return

      const selectedFiles = Array.from(selectedPaths)
        .map((path) => files.find((f) => f.path === path))
        .filter((f): f is FileInfo => f !== undefined && f.type === 'file')

      if (selectedFiles.length === 0) {
        toast.error(intl.formatMessage({ id: 'files.download.noFiles' }))
        return
      }

      setIsDownloading(true)
      try {
        if (selectedFiles.length === 1) {
          // Single file download
          const response = await fetch(
            `/api/connections/${connectionId}/files/download?path=${encodeURIComponent(selectedFiles[0].path)}`,
            { headers: { 'x-session-token': sessionToken } }
          )

          if (!response.ok) throw new Error('Download failed')

          const blob = await response.blob()
          downloadBlob(blob, selectedFiles[0].name)
          toast.success(intl.formatMessage({ id: 'files.download.success' }))
        } else {
          // Multiple files as zip
          const response = await fetch(`/api/connections/${connectionId}/files/download`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-session-token': sessionToken,
            },
            body: JSON.stringify({
              paths: selectedFiles.map((f) => f.path),
              format: 'zip',
            }),
          })

          if (!response.ok) throw new Error('Download failed')

          const blob = await response.blob()
          downloadBlob(blob, `files-${Date.now()}.zip`)
          toast.success(
            intl.formatMessage(
              { id: 'files.download.multipleSuccess' },
              { count: selectedFiles.length }
            )
          )
        }
      } catch (error) {
        handleApiError(error, intl.formatMessage({ id: 'files.download.error' }))
      } finally {
        setIsDownloading(false)
      }
    },
    [connectionId, sessionToken, isDownloading, handleApiError]
  )

  return {
    deleteFiles,
    renameFile,
    createFile,
    createFolder,
    changePermissions,
    downloadFiles,
    isDownloading,
  }
}

// Utils
function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
  document.body.removeChild(a)
}
