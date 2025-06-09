'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileList } from './FileList'
import { FileBreadcrumb } from './FileBreadcrumb'
import { FileUpload } from './FileUpload'
import { FileEditor } from './FileEditor'
import { CreateFileModal } from './CreateFileModal'
import { CreateFolderModal } from './CreateFolderModal'
import { RenameModal } from './RenameModal'
import { FilePermissionsModal } from './FilePermissionsModal'
import { FileSearch } from './FileSearch'
import { useConfirmation } from '@/hooks/useConfirmation'
import { useToast } from '@/components/ui/ToastContext'
import { useIntl, FormattedMessage } from '@/lib/i18n'
import type { FileInfo } from '@/types/ssh'

interface FileBrowserProps {
  connectionId: string
  sessionToken: string
  onDisconnect: () => void
}

export function FileBrowser({ connectionId, sessionToken, onDisconnect }: FileBrowserProps) {
  const intl = useIntl()
  const [currentPath, setCurrentPath] = useState('/')
  const [files, setFiles] = useState<FileInfo[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [editingFile, setEditingFile] = useState<FileInfo | null>(null)
  const [showCreateFile, setShowCreateFile] = useState(false)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [renameFile, setRenameFile] = useState<FileInfo | null>(null)
  const [permissionsFile, setPermissionsFile] = useState<FileInfo | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [isBulkOperating, setIsBulkOperating] = useState(false)

  const { confirm, ConfirmationModal } = useConfirmation()
  const { toast } = useToast()

  // Helper functions for download button
  const canDownloadSelection = () => {
    if (selectedFiles.size !== 1) return false

    const selectedPath = Array.from(selectedFiles)[0]
    const selectedFile = files.find((f) => f.path === selectedPath)

    // Only allow download for files, not directories
    return selectedFile?.type === 'file'
  }

  const getDownloadButtonTooltip = () => {
    if (selectedFiles.size === 0)
      return intl.formatMessage({ id: 'fileBrowser.download.selectFile' })
    if (selectedFiles.size > 1)
      return intl.formatMessage({ id: 'fileBrowser.download.oneFileOnly' })

    const selectedPath = Array.from(selectedFiles)[0]
    const selectedFile = files.find((f) => f.path === selectedPath)

    if (selectedFile?.type === 'directory')
      return intl.formatMessage({ id: 'fileBrowser.download.cannotDownloadFolders' })

    return intl.formatMessage({ id: 'fileBrowser.download.downloadFile' })
  }

  // Load files when path changes
  const loadFiles = useCallback(async () => {
    if (!sessionToken) return

    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/connections/${connectionId}/files?path=${encodeURIComponent(currentPath)}`,
        {
          headers: {
            'x-session-token': sessionToken,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to load files')
      }

      const data = await response.json()

      setFiles(data.files || [])
      setSelectedFiles(new Set())
    } catch (error: any) {
      toast.error(intl.formatMessage({ id: 'fileBrowser.error.loadFailed' }))
    } finally {
      setIsLoading(false)
    }
  }, [sessionToken, currentPath, connectionId])

  useEffect(() => {
    if (sessionToken) {
      loadFiles()
    }
  }, [sessionToken, loadFiles])

  const handleNavigate = (path: string) => {
    setCurrentPath(path)
  }

  const handleFileSelect = (filePath: string, isSelected: boolean) => {
    const newSelected = new Set(selectedFiles)
    if (isSelected) {
      newSelected.add(filePath)
    } else {
      newSelected.delete(filePath)
    }
    setSelectedFiles(newSelected)
  }

  const handleFileDoubleClick = (file: FileInfo) => {
    if (file.type === 'directory') {
      setCurrentPath(file.path)
    } else {
      // Open file for editing
      setEditingFile(file)
    }
  }

  const handleDeleteFiles = async (filePaths: string[]) => {
    if (!sessionToken) return

    confirm({
      title: intl.formatMessage({ id: 'fileBrowser.delete.title' }),
      message: intl.formatMessage(
        { id: 'fileBrowser.delete.message' },
        { count: filePaths.length }
      ),
      confirmText: intl.formatMessage({ id: 'fileBrowser.delete.confirmButton' }),
      variant: 'danger',
      onConfirm: async () => {
        setIsBulkOperating(true)
        try {
          let successCount = 0
          let errorCount = 0

          await Promise.all(
            filePaths.map(async (path) => {
              try {
                const response = await fetch(`/api/connections/${connectionId}/files${path}`, {
                  method: 'DELETE',
                  headers: {
                    'x-session-token': sessionToken,
                  },
                })
                if (response.ok) {
                  successCount++
                } else {
                  errorCount++
                }
              } catch {
                errorCount++
              }
            })
          )

          if (errorCount === 0) {
            toast.success(
              intl.formatMessage({ id: 'fileBrowser.delete.success' }, { count: successCount })
            )
          } else if (successCount > 0) {
            toast.error(
              intl.formatMessage(
                { id: 'fileBrowser.delete.partialSuccess' },
                { success: successCount, failed: errorCount }
              )
            )
          } else {
            toast.error(intl.formatMessage({ id: 'fileBrowser.delete.failed' }))
          }

          loadFiles()
        } catch (error: any) {
          toast.error(intl.formatMessage({ id: 'fileBrowser.delete.failed' }))
        } finally {
          setIsBulkOperating(false)
        }
      },
    })
  }

  const handleBulkDownload = async () => {
    if (!sessionToken || selectedFiles.size === 0) return

    setIsBulkOperating(true)
    try {
      const filesToDownload = Array.from(selectedFiles)

      // Single file download only
      const path = filesToDownload[0]
      const url = `/api/connections/${connectionId}/files/download?path=${encodeURIComponent(path)}`

      const response = await fetch(url, {
        headers: {
          'x-session-token': sessionToken,
        },
      })

      if (!response.ok) throw new Error('Download failed')

      const blob = await response.blob()
      const filename = path.split('/').pop() || 'download'

      // Create download link
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      a.click()
      URL.revokeObjectURL(a.href)

      setSelectedFiles(new Set()) // Clear selection after download
      toast.success(intl.formatMessage({ id: 'fileBrowser.download.success' }))
    } catch (error: any) {
      toast.error(intl.formatMessage({ id: 'fileBrowser.download.failed' }))
    } finally {
      setIsBulkOperating(false)
    }
  }

  const handleBulkPermissions = () => {
    if (selectedFiles.size !== 1) {
      toast.error(intl.formatMessage({ id: 'fileBrowser.permissions.selectOne' }))
      return
    }

    const selectedPath = Array.from(selectedFiles)[0]
    const file = files.find((f) => f.path === selectedPath)
    if (file) {
      setPermissionsFile(file)
    }
  }

  const handleRenameFile = async (oldPath: string, newName: string) => {
    if (!sessionToken) return

    try {
      const newPath = oldPath.substring(0, oldPath.lastIndexOf('/') + 1) + newName

      const response = await fetch(`/api/connections/${connectionId}/files/rename`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': sessionToken,
        },
        body: JSON.stringify({ oldPath, newPath }),
      })

      if (!response.ok) {
        throw new Error('Failed to rename file')
      }

      toast.success(intl.formatMessage({ id: 'fileBrowser.rename.success' }))
      loadFiles()
    } catch (error: any) {
      toast.error(intl.formatMessage({ id: 'fileBrowser.rename.failed' }))
    }
  }

  const handleCreateFile = async (name: string, content: string = '') => {
    if (!sessionToken) return

    try {
      const filePath = currentPath.endsWith('/') ? currentPath + name : currentPath + '/' + name

      const response = await fetch(`/api/connections/${connectionId}/files${filePath}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': sessionToken,
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        throw new Error('Failed to create file')
      }

      toast.success(intl.formatMessage({ id: 'fileBrowser.createFile.success' }))
      loadFiles()
    } catch (error: any) {
      toast.error(intl.formatMessage({ id: 'fileBrowser.createFile.failed' }))
    }
  }

  const handleCreateFolder = async (name: string) => {
    if (!sessionToken) return

    try {
      const folderPath = currentPath.endsWith('/') ? currentPath + name : currentPath + '/' + name

      const response = await fetch(`/api/connections/${connectionId}/files/mkdir`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': sessionToken,
        },
        body: JSON.stringify({ path: folderPath }),
      })

      if (!response.ok) {
        throw new Error('Failed to create folder')
      }

      toast.success(intl.formatMessage({ id: 'fileBrowser.createFolder.success' }))
      loadFiles()
    } catch (error: any) {
      toast.error(intl.formatMessage({ id: 'fileBrowser.createFolder.failed' }))
    }
  }

  const handleFileUpload = async (files: FileList) => {
    if (!sessionToken) return

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('path', currentPath)

        return fetch(`/api/connections/${connectionId}/files/upload`, {
          method: 'POST',
          headers: {
            'x-session-token': sessionToken,
          },
          body: formData,
        })
      })

      await Promise.all(uploadPromises)
      toast.success(intl.formatMessage({ id: 'fileBrowser.upload.success' }))
      // Reload files after upload since new files were added
      loadFiles()
    } catch (error: any) {
      toast.error(intl.formatMessage({ id: 'fileBrowser.upload.failed' }))
    }
  }

  const handleSearchSelect = (file: { path: string; name: string; type: string }) => {
    if (file.type === 'directory') {
      setCurrentPath(file.path)
    } else {
      // Navigate to the file's directory and select it
      const dirPath = file.path.substring(0, file.path.lastIndexOf('/')) || '/'
      setCurrentPath(dirPath)
      // After navigation, select the file
      setTimeout(() => {
        setSelectedFiles(new Set([file.path]))
      }, 100)
    }
  }

  // Show loading state if no session token yet
  if (!sessionToken) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-terminal-green border-t-transparent"></div>
          <p className="text-foreground-muted">
            <FormattedMessage id="fileBrowser.establishingConnection" />
          </p>
        </div>
      </div>
    )
  }

  if (editingFile) {
    return (
      <FileEditor
        connectionId={connectionId}
        file={editingFile}
        sessionToken={sessionToken}
        onClose={() => setEditingFile(null)}
        onSave={() => {
          setEditingFile(null)
          loadFiles()
        }}
      />
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="border-b border-border bg-background-secondary px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileBreadcrumb path={currentPath} onNavigate={handleNavigate} />
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <FileSearch
              connectionId={connectionId}
              sessionToken={sessionToken}
              currentPath={currentPath}
              onFileSelect={handleSearchSelect}
            />

            <div className="bg-border h-6 w-px" />

            <button
              onClick={() => setShowCreateFile(true)}
              className="hover:bg-terminal-green-hover rounded-lg bg-terminal-green px-3 py-1.5 text-sm font-medium text-background"
            >
              <FormattedMessage id="fileBrowser.newFile" />
            </button>
            <button
              onClick={() => setShowCreateFolder(true)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background-secondary"
            >
              <FormattedMessage id="fileBrowser.newFolder" />
            </button>
            <FileUpload onUpload={handleFileUpload} />

            <div className="ml-4 flex rounded-lg border border-border">
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  viewMode === 'list'
                    ? 'bg-terminal-green text-background'
                    : 'text-foreground hover:bg-background-secondary'
                }`}
              >
                <FormattedMessage id="fileBrowser.viewList" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  viewMode === 'grid'
                    ? 'bg-terminal-green text-background'
                    : 'text-foreground hover:bg-background-secondary'
                }`}
              >
                <FormattedMessage id="fileBrowser.viewGrid" />
              </button>
            </div>

            <button
              onClick={onDisconnect}
              className="rounded-lg border border-red-500/20 bg-background px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-500/10"
            >
              <FormattedMessage id="fileBrowser.disconnect" />
            </button>
          </div>
        </div>

        {selectedFiles.size > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-terminal-green/10 px-3 py-2">
            <span className="text-sm text-terminal-green">
              <FormattedMessage
                id="fileBrowser.filesSelected"
                values={{ count: selectedFiles.size }}
              />
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleBulkDownload}
                disabled={isBulkOperating || selectedFiles.size !== 1 || !canDownloadSelection()}
                className="rounded bg-terminal-blue px-2 py-1 text-xs text-white hover:bg-terminal-blue/80 disabled:cursor-not-allowed disabled:opacity-50"
                title={getDownloadButtonTooltip()}
              >
                <FormattedMessage id="fileBrowser.download" />
              </button>
              <button
                onClick={handleBulkPermissions}
                disabled={isBulkOperating || selectedFiles.size !== 1}
                className="rounded bg-terminal-purple px-2 py-1 text-xs text-white hover:bg-terminal-purple/80 disabled:opacity-50"
              >
                <FormattedMessage id="fileBrowser.permissions" />
              </button>
              <button
                onClick={() => handleDeleteFiles(Array.from(selectedFiles))}
                disabled={isBulkOperating}
                className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600 disabled:opacity-50"
              >
                <FormattedMessage id="fileBrowser.delete" />
              </button>
              <button
                onClick={() => setSelectedFiles(new Set())}
                className="rounded bg-background-tertiary px-2 py-1 text-xs text-foreground hover:bg-background"
              >
                <FormattedMessage id="fileBrowser.clear" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-terminal-green border-t-transparent"></div>
          </div>
        ) : (
          <FileList
            files={files}
            isLoading={isLoading}
            viewMode={viewMode}
            selectedFiles={selectedFiles}
            onFileSelect={handleFileSelect}
            onFileDoubleClick={handleFileDoubleClick}
            onRename={(file) => setRenameFile(file)}
            onDelete={(files) => handleDeleteFiles(files.map((f) => f.path))}
            onPermissions={(file) => setPermissionsFile(file)}
          />
        )}
      </div>

      {/* Modals */}
      {showCreateFile && (
        <CreateFileModal onClose={() => setShowCreateFile(false)} onCreate={handleCreateFile} />
      )}

      {showCreateFolder && (
        <CreateFolderModal
          onClose={() => setShowCreateFolder(false)}
          onCreate={handleCreateFolder}
        />
      )}

      {renameFile && (
        <RenameModal
          file={renameFile}
          onClose={() => setRenameFile(null)}
          onRename={handleRenameFile}
        />
      )}

      {permissionsFile && (
        <FilePermissionsModal
          file={permissionsFile}
          connectionId={connectionId}
          sessionToken={sessionToken}
          onClose={() => setPermissionsFile(null)}
          onSuccess={loadFiles}
        />
      )}

      <ConfirmationModal />
    </div>
  )
}
