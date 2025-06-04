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
      toast.error(error.message || 'Failed to load files')
    } finally {
      setIsLoading(false)
    }
  }, [sessionToken, currentPath, connectionId, toast])

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
      title: 'Delete Files',
      message: `Are you sure you want to delete ${filePaths.length} file(s)?`,
      confirmText: 'Delete',
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

          toast.success('Files deleted successfully')
          loadFiles()
        } catch (error: any) {
          toast.error(error.message || 'Failed to delete files')
        }
      },
    })
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

      toast.success('File renamed successfully')
      loadFiles()
    } catch (error: any) {
      toast.error(error.message || 'Failed to rename file')
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

      toast.success('File created successfully')
      loadFiles()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create file')
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

      toast.success('Folder created successfully')
      loadFiles()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create folder')
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
      toast.success('Files uploaded successfully')
      loadFiles()
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload files')
    }
  }

  // Show loading state if no session token yet
  if (!sessionToken) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-terminal-green border-t-transparent"></div>
          <p className="text-foreground-muted">Establishing SSH connection...</p>
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
              New File
            </button>
            <button
              onClick={() => setShowCreateFolder(true)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background-secondary"
            >
              New Folder
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
                List
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 text-sm ${
                  viewMode === 'grid'
                    ? 'bg-terminal-green text-background'
                    : 'text-foreground hover:bg-background-secondary'
                }`}
              >
                Grid
              </button>
            </div>

            <button
              onClick={onDisconnect}
              className="rounded-lg border border-red-500/20 bg-background px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-500/10"
            >
              Disconnect
            </button>
          </div>
        </div>

        {selectedFiles.size > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-terminal-green/10 px-3 py-2">
            <span className="text-sm text-terminal-green">
              {selectedFiles.size} file(s) selected
            </span>
            <button
              onClick={() => handleDeleteFiles(Array.from(selectedFiles))}
              className="ml-auto rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
            >
              Delete
            </button>
            <button
              onClick={() => setSelectedFiles(new Set())}
              className="rounded bg-background-tertiary px-2 py-1 text-xs text-foreground hover:bg-background"
            >
              Clear
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
