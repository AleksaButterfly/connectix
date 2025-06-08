'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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

interface ErrorState {
  type: 'none' | 'permission' | 'not_found' | 'network' | 'unknown'
  message: string
  path?: string
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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [error, setError] = useState<ErrorState>({ type: 'none', message: '' })

  // Use refs to prevent duplicate toast messages
  const lastToastMessage = useRef<string>('')
  const loadingRef = useRef(false)

  const { confirm, ConfirmationModal } = useConfirmation()
  const { toast } = useToast()

  // Helper function to show toast without duplicates
  const showToast = useCallback(
    (message: string, type: 'success' | 'error' = 'error') => {
      if (lastToastMessage.current !== message) {
        lastToastMessage.current = message
        toast[type](message)
        // Reset after 2 seconds
        setTimeout(() => {
          lastToastMessage.current = ''
        }, 2000)
      }
    },
    [toast]
  )

  // Parse error response and determine error type
  const parseError = async (response: Response): Promise<ErrorState> => {
    let message = intl.formatMessage({ id: 'fileBrowser.error.generic' })
    let type: ErrorState['type'] = 'unknown'

    try {
      const data = await response.json()
      message = data.error || data.message || message

      // Determine error type based on status code and message
      if (response.status === 403 || message.toLowerCase().includes('permission')) {
        type = 'permission'
        message = message || intl.formatMessage({ id: 'fileBrowser.error.permissionDenied' })
      } else if (response.status === 404 || message.toLowerCase().includes('not found')) {
        type = 'not_found'
        message = message || intl.formatMessage({ id: 'fileBrowser.error.notFound' })
      } else if (
        response.status === 401 ||
        message.toLowerCase().includes('session') ||
        message.toLowerCase().includes('expired')
      ) {
        type = 'network'
        message = intl.formatMessage({ id: 'fileBrowser.error.sessionExpired' })
      } else if (
        message.toLowerCase().includes('network') ||
        message.toLowerCase().includes('connection')
      ) {
        type = 'network'
        message = message || intl.formatMessage({ id: 'fileBrowser.error.network' })
      }
    } catch {
      // If response is not JSON, use status text
      message = response.statusText || intl.formatMessage({ id: 'fileBrowser.error.loadFiles' })
    }

    return { type, message, path: currentPath }
  }

  // Load files with better error handling
  const loadFiles = useCallback(async () => {
    if (!sessionToken || loadingRef.current) return

    loadingRef.current = true
    setIsLoading(true)
    setError({ type: 'none', message: '' })

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
        const errorState = await parseError(response)
        setError(errorState)

        // Handle different error types
        if (errorState.type === 'permission' || errorState.message.includes('session')) {
          // Stay on current page for permission or session errors
          showToast(errorState.message)
        } else {
          showToast(errorState.message)
          // For other errors, go back to parent directory if not at root
          if (currentPath !== '/' && errorState.type !== 'not_found') {
            const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/'
            setCurrentPath(parentPath)
          }
        }
        return
      }

      const data = await response.json()
      setFiles(data.files || [])
      setSelectedFiles(new Set())
      setError({ type: 'none', message: '' })
    } catch (error: any) {
      setError({
        type: 'network',
        message: intl.formatMessage(
          { id: 'fileBrowser.error.networkDetail' },
          { error: error.message || 'Unable to connect to server' }
        ),
        path: currentPath,
      })
      showToast(intl.formatMessage({ id: 'fileBrowser.error.networkLoadFiles' }))
    } finally {
      setIsLoading(false)
      loadingRef.current = false
    }
  }, [sessionToken, currentPath, connectionId, showToast, intl])

  // Debounced effect to prevent multiple loads
  useEffect(() => {
    // Don't try to load if we have a persistent error or session issue
    if (
      error.type === 'permission' ||
      error.type === 'not_found' ||
      (error.type === 'network' && error.message.toLowerCase().includes('session'))
    ) {
      return
    }

    if (sessionToken) {
      const timer = setTimeout(() => {
        loadFiles()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [sessionToken, currentPath, loadFiles, error.type, error.message])

  const handleNavigate = (path: string) => {
    // Clear any existing errors when navigating to a new path
    setError({ type: 'none', message: '' })
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

  const handleFileOpen = (file: FileInfo) => {
    if (file.type === 'directory') {
      // Clear any existing errors when opening a new directory
      setError({ type: 'none', message: '' })
      setCurrentPath(file.path)
    } else {
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
        try {
          const results = await Promise.allSettled(
            filePaths.map((path) =>
              fetch(`/api/connections/${connectionId}/files${path}`, {
                method: 'DELETE',
                headers: {
                  'x-session-token': sessionToken,
                },
              })
            )
          )

          const failed = results.filter((r) => r.status === 'rejected')
          if (failed.length > 0) {
            showToast(
              intl.formatMessage(
                { id: 'fileBrowser.delete.errorPartial' },
                { count: failed.length }
              )
            )
          } else {
            showToast(intl.formatMessage({ id: 'fileBrowser.delete.success' }), 'success')
          }

          loadFiles()
        } catch (error: any) {
          showToast(error.message || intl.formatMessage({ id: 'fileBrowser.delete.error' }))
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
        const error = await parseError(response)
        throw new Error(error.message)
      }

      showToast(intl.formatMessage({ id: 'fileBrowser.rename.success' }), 'success')
      loadFiles()
    } catch (error: any) {
      showToast(error.message || intl.formatMessage({ id: 'fileBrowser.rename.error' }))
    }
  }

  const handleCreateFile = async (name: string, content: string = '') => {
    if (!sessionToken) return

    try {
      const filePath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`

      const response = await fetch(`/api/connections/${connectionId}/files${filePath}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': sessionToken,
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const error = await parseError(response)
        throw new Error(error.message)
      }

      showToast(intl.formatMessage({ id: 'fileBrowser.createFile.success' }), 'success')
      loadFiles()
    } catch (error: any) {
      showToast(error.message || intl.formatMessage({ id: 'fileBrowser.createFile.error' }))
    }
  }

  const handleCreateFolder = async (name: string) => {
    if (!sessionToken) return

    try {
      const folderPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`

      const response = await fetch(`/api/connections/${connectionId}/files/mkdir`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': sessionToken,
        },
        body: JSON.stringify({ path: folderPath }),
      })

      if (!response.ok) {
        const error = await parseError(response)
        throw new Error(error.message)
      }

      showToast(intl.formatMessage({ id: 'fileBrowser.createFolder.success' }), 'success')
      loadFiles()
    } catch (error: any) {
      showToast(error.message || intl.formatMessage({ id: 'fileBrowser.createFolder.error' }))
    }
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
          const error = await parseError(response)
          throw new Error(`${file.name}: ${error.message}`)
        }

        return response
      })

      await Promise.all(uploadPromises)
      showToast(intl.formatMessage({ id: 'fileBrowser.upload.success' }), 'success')
      loadFiles()
    } catch (error: any) {
      showToast(error.message || intl.formatMessage({ id: 'fileBrowser.upload.error' }))
    }
  }

  // Show loading state if no session token yet
  if (!sessionToken) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-terminal-green border-t-transparent"></div>
          <p className="text-foreground-muted">
            <FormattedMessage id="fileBrowser.establishing" />
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
              disabled={error.type === 'permission'}
              className="hover:bg-terminal-green-hover rounded-lg bg-terminal-green px-3 py-1.5 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FormattedMessage id="fileBrowser.newFile" />
            </button>
            <button
              onClick={() => setShowCreateFolder(true)}
              disabled={error.type === 'permission'}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background-secondary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FormattedMessage id="fileBrowser.newFolder" />
            </button>
            <FileUpload onUpload={handleFileUpload} disabled={error.type === 'permission'} />

            <div className="ml-4 flex rounded-lg border border-border">
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  viewMode === 'list'
                    ? 'bg-terminal-green text-background'
                    : 'text-foreground hover:bg-background-secondary'
                }`}
              >
                <FormattedMessage id="fileBrowser.viewMode.list" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  viewMode === 'grid'
                    ? 'bg-terminal-green text-background'
                    : 'text-foreground hover:bg-background-secondary'
                }`}
              >
                <FormattedMessage id="fileBrowser.viewMode.grid" />
              </button>
            </div>
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
            <button
              onClick={() => handleDeleteFiles(Array.from(selectedFiles))}
              className="ml-auto rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
            >
              <FormattedMessage id="common.delete" />
            </button>
            <button
              onClick={() => setSelectedFiles(new Set())}
              className="rounded bg-background-tertiary px-2 py-1 text-xs text-foreground hover:bg-background"
            >
              <FormattedMessage id="common.clear" />
            </button>
          </div>
        )}
      </div>

      {/* File List or Error State */}
      <div className="flex-1 overflow-auto">
        {error.type === 'permission' ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-4 text-6xl">🔒</div>
              <h3 className="mb-2 text-lg font-medium text-foreground">
                <FormattedMessage id="fileBrowser.permission.title" />
              </h3>
              <p className="mb-4 text-foreground-muted">
                <FormattedMessage
                  id={
                    currentPath === '/'
                      ? 'fileBrowser.permission.rootDirectory'
                      : 'fileBrowser.permission.folder'
                  }
                />
              </p>
              <button
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-background-secondary"
                onClick={() => {
                  // Placeholder for request access functionality
                  showToast(
                    intl.formatMessage({ id: 'fileBrowser.permission.requestAccessComingSoon' }),
                    'success'
                  )
                }}
              >
                <FormattedMessage id="fileBrowser.permission.requestAccess" />
              </button>
            </div>
          </div>
        ) : error.type === 'network' && error.message.toLowerCase().includes('session') ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mb-4 text-6xl">🔑</div>
              <h3 className="mb-2 text-lg font-medium text-foreground">
                <FormattedMessage id="fileBrowser.session.expired.title" />
              </h3>
              <p className="mb-4 text-foreground-muted">
                <FormattedMessage id="fileBrowser.session.expired.description" />
              </p>
              <button
                className="rounded-lg bg-terminal-green px-4 py-2 text-sm font-medium text-background hover:bg-terminal-green/90"
                onClick={onDisconnect}
              >
                <FormattedMessage id="fileBrowser.session.reconnect" />
              </button>
            </div>
          </div>
        ) : isLoading ? (
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
            onFileOpen={handleFileOpen}
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
