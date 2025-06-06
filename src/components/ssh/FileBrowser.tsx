'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileList } from './FileList'
import { FileBreadcrumb } from './FileBreadcrumb'
import { FileUpload } from './FileUpload'
import { FileEditor } from './FileEditor'
import { CreateFileModal } from './CreateFileModal'
import { CreateFolderModal } from './CreateFolderModal'
import { RenameModal } from './RenameModal'
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
  const [currentPath, setCurrentPath] = useState('/')
  const [files, setFiles] = useState<FileInfo[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [editingFile, setEditingFile] = useState<FileInfo | null>(null)
  const [showCreateFile, setShowCreateFile] = useState(false)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [renameFile, setRenameFile] = useState<FileInfo | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const { confirm, ConfirmationModal } = useConfirmation()
  const { toast } = useToast()
  const intl = useIntl()

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
        throw new Error(intl.formatMessage({ id: 'files.errors.loadFailed' }))
      }

      const data = await response.json()

      setFiles(data.files || [])
      setSelectedFiles(new Set())
    } catch (error: any) {
      toast.error(error.message || intl.formatMessage({ id: 'files.errors.loadFailed' }))
    } finally {
      setIsLoading(false)
    }
  }, [sessionToken, currentPath, connectionId, toast, intl])

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
      title: intl.formatMessage({ id: 'files.delete.title' }),
      message: intl.formatMessage({ id: 'files.delete.message' }, { count: filePaths.length }),
      confirmText: intl.formatMessage({ id: 'files.delete.confirmButton' }),
      variant: 'danger',
      onConfirm: async () => {
        try {
          await Promise.all(
            filePaths.map((path) =>
              fetch(`/api/connections/${connectionId}/files${path}`, {
                method: 'DELETE',
                headers: {
                  'x-session-token': sessionToken,
                },
              })
            )
          )

          toast.success(intl.formatMessage({ id: 'files.delete.success' }))
          loadFiles()
        } catch (error: any) {
          toast.error(error.message || intl.formatMessage({ id: 'files.errors.deleteFailed' }))
        }
      },
    })
  }

  const handleRenameFile = async (oldPath: string, newName: string) => {
    if (!sessionToken) {
      throw new Error(intl.formatMessage({ id: 'files.errors.noSession' }))
    }

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
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || intl.formatMessage({ id: 'files.errors.renameFailed' }))
    }

    toast.success(intl.formatMessage({ id: 'files.rename.success' }))
    loadFiles()
  }

  const handleCreateFile = async (name: string, content?: string) => {
    if (!sessionToken) {
      throw new Error(intl.formatMessage({ id: 'files.errors.noSession' }))
    }

    const filePath = currentPath.endsWith('/') ? currentPath + name : currentPath + '/' + name

    const response = await fetch(`/api/connections/${connectionId}/files${filePath}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-session-token': sessionToken,
      },
      body: JSON.stringify({ content: content || '' }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || intl.formatMessage({ id: 'files.errors.createFailed' }))
    }

    toast.success(intl.formatMessage({ id: 'files.createFile.success' }))
    loadFiles()
  }

  const handleCreateFolder = async (name: string) => {
    if (!sessionToken) {
      throw new Error(intl.formatMessage({ id: 'files.errors.noSession' }))
    }

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
      const error = await response.json().catch(() => ({}))
      throw new Error(
        error.message || intl.formatMessage({ id: 'files.errors.createFolderFailed' })
      )
    }

    toast.success(intl.formatMessage({ id: 'files.createFolder.success' }))
    loadFiles()
  }

  const handleFileUpload = async (files: FileList) => {
    if (!sessionToken) return

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('path', currentPath)

        const response = await fetch(`/api/connections/${connectionId}/files/upload`, {
          method: 'POST',
          headers: {
            'x-session-token': sessionToken,
          },
          body: formData,
        })

        if (!response.ok) {
          throw new Error(intl.formatMessage({ id: 'files.errors.uploadFailed' }))
        }

        return response
      })

      await Promise.all(uploadPromises)
      toast.success(intl.formatMessage({ id: 'files.upload.success' }))
      loadFiles()
    } catch (error: any) {
      toast.error(error.message || intl.formatMessage({ id: 'files.errors.uploadFailed' }))
    }
  }

  // Show loading state if no session token yet
  if (!sessionToken) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-terminal-green border-t-transparent"></div>
          <p className="text-foreground-muted">
            <FormattedMessage id="files.browser.establishingConnection" />
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
            <button
              onClick={() => setShowCreateFile(true)}
              className="hover:bg-terminal-green-hover rounded-lg bg-terminal-green px-3 py-1.5 text-sm font-medium text-background"
            >
              <FormattedMessage id="files.browser.newFile" />
            </button>
            <button
              onClick={() => setShowCreateFolder(true)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background-secondary"
            >
              <FormattedMessage id="files.browser.newFolder" />
            </button>
            <FileUpload onUpload={handleFileUpload} />

            <div className="ml-4 flex rounded-lg border border-border">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-sm ${
                  viewMode === 'list'
                    ? 'bg-terminal-green text-background'
                    : 'text-foreground hover:bg-background-secondary'
                }`}
              >
                <FormattedMessage id="files.browser.listView" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-sm ${
                  viewMode === 'grid'
                    ? 'bg-terminal-green text-background'
                    : 'text-foreground hover:bg-background-secondary'
                }`}
              >
                <FormattedMessage id="files.browser.gridView" />
              </button>
            </div>

            <button
              onClick={onDisconnect}
              className="rounded-lg border border-red-500/20 bg-background px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-500/10"
            >
              <FormattedMessage id="files.browser.disconnect" />
            </button>
          </div>
        </div>

        {selectedFiles.size > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-terminal-green/10 px-3 py-2">
            <span className="text-sm text-terminal-green">
              <FormattedMessage
                id="files.browser.filesSelected"
                values={{ count: selectedFiles.size }}
              />
            </span>
            <button
              onClick={() => handleDeleteFiles(Array.from(selectedFiles))}
              className="ml-auto rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
            >
              <FormattedMessage id="files.browser.delete" />
            </button>
            <button
              onClick={() => setSelectedFiles(new Set())}
              className="rounded bg-background-tertiary px-2 py-1 text-xs text-foreground hover:bg-background"
            >
              <FormattedMessage id="files.browser.clear" />
            </button>
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

      <ConfirmationModal />
    </div>
  )
}
