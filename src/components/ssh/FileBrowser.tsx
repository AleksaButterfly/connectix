'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  const [currentPath, setCurrentPath] = useState('/')
  const [files, setFiles] = useState<FileInfo[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [editingFile, setEditingFile] = useState<FileInfo | null>(null)
  const [showCreateFile, setShowCreateFile] = useState(false)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [showCreateDropdown, setShowCreateDropdown] = useState(false)
  const [renameFile, setRenameFile] = useState<FileInfo | null>(null)
  const [permissionsFile, setPermissionsFile] = useState<FileInfo | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const { confirm, ConfirmationModal } = useConfirmation()
  const { toast } = useToast()
  const intl = useIntl()
  const dropdownRef = useRef<HTMLDivElement>(null)

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
        throw new Error(intl.formatMessage({ id: 'fileBrowser.error.loadFailed' }))
      }

      const data = await response.json()

      setFiles(data.files || [])
      setSelectedFiles(new Set())
    } catch (error: any) {
      toast.error(error.message || intl.formatMessage({ id: 'fileBrowser.error.loadFailed' }))
    } finally {
      setIsLoading(false)
    }
  }, [sessionToken, currentPath, connectionId])

  useEffect(() => {
    if (sessionToken) {
      loadFiles()
    }
  }, [sessionToken, loadFiles])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCreateDropdown(false)
      }
    }

    if (showCreateDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showCreateDropdown])

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
      title: intl.formatMessage({ id: 'connections.delete.title' }),
      message: intl.formatMessage(
        { id: 'connections.delete.confirmText' },
        { count: filePaths.length }
      ),
      confirmText: intl.formatMessage({ id: 'common.delete' }),
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

          toast.success(intl.formatMessage({ id: 'connections.delete.successMessage' }))
          loadFiles()
        } catch (error: any) {
          toast.error(
            error.message || intl.formatMessage({ id: 'connections.delete.errorMessage' })
          )
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
        throw new Error(intl.formatMessage({ id: 'fileBrowser.rename.failed' }))
      }

      toast.success(intl.formatMessage({ id: 'connections.rename.successMessage' }))
      loadFiles()
    } catch (error: any) {
      toast.error(error.message || intl.formatMessage({ id: 'connections.rename.errorMessage' }))
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

      toast.success(intl.formatMessage({ id: 'connections.createFile.successMessage' }))
      loadFiles()
    } catch (error: any) {
      toast.error(
        error.message || intl.formatMessage({ id: 'connections.createFile.errorMessage' })
      )
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

      toast.success(intl.formatMessage({ id: 'connections.createFolder.successMessage' }))
      loadFiles()
    } catch (error: any) {
      toast.error(
        error.message || intl.formatMessage({ id: 'connections.createFolder.errorMessage' })
      )
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
      toast.success(intl.formatMessage({ id: 'connections.upload.successMessage' }))
      loadFiles()
    } catch (error: any) {
      toast.error(error.message || intl.formatMessage({ id: 'connections.upload.errorMessage' }))
    }
  }

  const handleDownloadFiles = async () => {
    if (!sessionToken || selectedFiles.size === 0) return

    const selectedItems = Array.from(selectedFiles)
      .map((path) => files.find((f) => f.path === path))
      .filter(Boolean) as FileInfo[]

    // Filter out directories
    const filesToDownload = selectedItems.filter((item) => item.type === 'file')

    if (filesToDownload.length === 0) {
      toast.error(intl.formatMessage({ id: 'files.tooltips.download.folderSelected' }))
      return
    }

    // Single file download
    if (filesToDownload.length === 1) {
      try {
        const response = await fetch(
          `/api/connections/${connectionId}/files/download?path=${encodeURIComponent(filesToDownload[0].path)}`,
          {
            headers: {
              'x-session-token': sessionToken,
            },
          }
        )

        if (!response.ok) throw new Error(intl.formatMessage({ id: 'fileBrowser.download.failed' }))

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filesToDownload[0].name
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast.success(intl.formatMessage({ id: 'fileBrowser.download.success' }))
      } catch (error: any) {
        toast.error(error.message || intl.formatMessage({ id: 'fileBrowser.download.failed' }))
      }
    }
    // Multiple files download as zip
    else {
      try {
        const paths = filesToDownload.map((item) => item.path)
        const response = await fetch(`/api/connections/${connectionId}/files/download`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session-token': sessionToken,
          },
          body: JSON.stringify({ paths, format: 'zip' }),
        })

        if (!response.ok)
          throw new Error(intl.formatMessage({ id: 'fileBrowser.download.multiple.failed' }))

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `files-${Date.now()}.zip`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast.success(intl.formatMessage({ id: 'fileBrowser.download.multiple.success' }))
      } catch (error: any) {
        toast.error(
          error.message || intl.formatMessage({ id: 'fileBrowser.download.multiple.failed' })
        )
      }
    }
  }

  const handlePermissionsChange = async (file: FileInfo, permissions: string) => {
    if (!sessionToken) return

    try {
      const mode = parseInt(permissions, 8)
      const response = await fetch(`/api/connections/${connectionId}/files/chmod`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': sessionToken,
        },
        body: JSON.stringify({ path: file.path, mode }),
      })

      if (!response.ok) {
        throw new Error(intl.formatMessage({ id: 'connections.permissions.errorMessage' }))
      }

      toast.success(intl.formatMessage({ id: 'connections.permissions.successMessage' }))
      loadFiles()
    } catch (error: any) {
      toast.error(
        error.message || intl.formatMessage({ id: 'connections.permissions.errorMessage' })
      )
    }
  }

  // Check if download is possible
  const canDownload = () => {
    if (selectedFiles.size === 0) return false
    const selectedItems = Array.from(selectedFiles)
      .map((path) => files.find((f) => f.path === path))
      .filter(Boolean) as FileInfo[]

    // Can only download files, not directories
    return selectedItems.every((item) => item.type === 'file')
  }

  // Get tooltip for disabled states
  const getDownloadTooltip = () => {
    if (selectedFiles.size === 0)
      return intl.formatMessage({ id: 'files.tooltips.download.noSelection' })
    const selectedItems = Array.from(selectedFiles)
      .map((path) => files.find((f) => f.path === path))
      .filter(Boolean) as FileInfo[]

    const hasDirectory = selectedItems.some((item) => item.type === 'directory')
    if (hasDirectory) {
      return intl.formatMessage({ id: 'files.tooltips.download.folderSelected' })
    }
    return ''
  }

  const getPermissionsTooltip = () => {
    if (selectedFiles.size === 0)
      return intl.formatMessage({ id: 'files.tooltips.permissions.noSelection' })
    if (selectedFiles.size > 1)
      return intl.formatMessage({ id: 'files.tooltips.permissions.multipleSelection' })
    return ''
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
            <FormattedMessage id="files.connection.establishing" />
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
      <div className="border-b border-border bg-background-secondary">
        {/* Top toolbar */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <FileBreadcrumb path={currentPath} onNavigate={handleNavigate} />
          </div>

          <div className="flex items-center gap-3">
            {/* Search - visually separated */}
            {/* Search */}
            <FileSearch
              connectionId={connectionId}
              sessionToken={sessionToken}
              currentPath={currentPath}
              onFileSelect={handleSearchSelect}
            />

            {/* View mode toggle */}
            <div className="flex rounded-lg border border-border">
              <button
                onClick={() => setViewMode('list')}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  viewMode === 'list'
                    ? 'bg-terminal-green text-background'
                    : 'text-foreground hover:bg-background-tertiary'
                }`}
                title={intl.formatMessage({ id: 'files.viewMode.list' })}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-terminal-green text-background'
                    : 'text-foreground hover:bg-background-tertiary'
                }`}
                title={intl.formatMessage({ id: 'files.viewMode.grid' })}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                  />
                </svg>
              </button>
            </div>

            {/* Primary actions group */}
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background-tertiary px-2 py-1">
              {/* Create dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                  className="flex items-center gap-1 rounded px-3 py-1.5 text-sm font-medium text-terminal-green hover:bg-terminal-green/10"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <FormattedMessage id="files.create.title" />
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {showCreateDropdown && (
                  <div className="absolute left-0 top-full mt-1 w-40 overflow-hidden rounded-lg border border-border bg-background-secondary shadow-lg">
                    <button
                      onClick={() => {
                        setShowCreateFile(true)
                        setShowCreateDropdown(false)
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-background-tertiary"
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <FormattedMessage id="files.create.file" />
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateFolder(true)
                        setShowCreateDropdown(false)
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-background-tertiary"
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
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                        />
                      </svg>
                      <FormattedMessage id="files.create.folder" />
                    </button>
                  </div>
                )}
              </div>

              {/* Upload button */}
              <FileUpload onUpload={handleFileUpload} />
            </div>

            {/* Disconnect button - visually separated */}
            <button
              onClick={onDisconnect}
              className="ml-2 rounded-lg border border-red-500/20 bg-background px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-500/10"
            >
              <FormattedMessage id="common.disconnect" />
            </button>
          </div>
        </div>

        {/* Selection actions bar - appears when files are selected */}
        {selectedFiles.size > 0 && (
          <div className="border-t border-border bg-terminal-green/5 px-4 py-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-terminal-green">
                {selectedFiles.size === 1
                  ? intl.formatMessage(
                      { id: 'files.selection.single' },
                      { count: selectedFiles.size }
                    )
                  : intl.formatMessage(
                      { id: 'files.selection.multiple' },
                      { count: selectedFiles.size }
                    )}
              </span>

              <div className="flex items-center gap-2">
                {/* Download button */}
                <div className="group relative inline-block">
                  <button
                    onClick={handleDownloadFiles}
                    disabled={!canDownload()}
                    className={`flex items-center gap-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                      canDownload()
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-blue-600/20 text-blue-600/50'
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                      />
                    </svg>
                    <FormattedMessage id="common.download" />
                    {selectedFiles.size > 1 && canDownload() && ' as ZIP'}
                  </button>
                  {!canDownload() && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 transform group-hover:block">
                      <div className="whitespace-nowrap rounded bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg">
                        {getDownloadTooltip()}
                        <div className="absolute left-1/2 top-full -mt-1 -translate-x-1/2 transform">
                          <div className="border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Permissions button */}
                <div className="group relative inline-block">
                  <button
                    onClick={() => {
                      const selected = Array.from(selectedFiles)[0]
                      const file = files.find((f) => f.path === selected)
                      if (file) setPermissionsFile(file)
                    }}
                    disabled={selectedFiles.size !== 1}
                    className={`flex items-center gap-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                      selectedFiles.size === 1
                        ? 'bg-terminal-yellow text-background hover:bg-terminal-yellow/80'
                        : 'bg-terminal-yellow/20 text-terminal-yellow/50'
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <FormattedMessage id="common.permissions" />
                  </button>
                  {selectedFiles.size !== 1 && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 transform group-hover:block">
                      <div className="whitespace-nowrap rounded bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg">
                        {getPermissionsTooltip()}
                        <div className="absolute left-1/2 top-full -mt-1 -translate-x-1/2 transform">
                          <div className="border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDeleteFiles(Array.from(selectedFiles))}
                  className="flex items-center gap-1 rounded bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <FormattedMessage id="common.delete" />
                </button>

                {/* Clear selection */}
                <button
                  onClick={() => setSelectedFiles(new Set())}
                  className="rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-background-tertiary"
                >
                  <FormattedMessage id="common.clear" />
                </button>
              </div>
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
          onClose={() => setPermissionsFile(null)}
          onSave={(permissions) => {
            handlePermissionsChange(permissionsFile, permissions)
            setPermissionsFile(null)
          }}
        />
      )}

      <ConfirmationModal />
    </div>
  )
}
