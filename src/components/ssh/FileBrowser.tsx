'use client'

import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { FileList } from './FileList'
import { FileEditor } from './FileEditor'
import { FileBrowserToolbar } from './FileBrowserToolbar'
import { useConfirmation } from '@/hooks/useConfirmation'
import { useToast } from '@/components/ui/ToastContext'
import { useIntl, FormattedMessage } from '@/lib/i18n'
import { useFileOperations } from '@/hooks/useFileOperations'
import { useFileSelection } from '@/hooks/useFileSelection'
import { useFileNavigation } from '@/hooks/useFileNavigation'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { apiCall } from '@/types/ssh'
import type { FileInfo, FileListResponse } from '@/types/ssh'

// Lazy load modals for better performance
const CreateFileModal = lazy(() =>
  import('./CreateFileModal').then((m) => ({ default: m.CreateFileModal }))
)
const CreateFolderModal = lazy(() =>
  import('./CreateFolderModal').then((m) => ({ default: m.CreateFolderModal }))
)
const RenameModal = lazy(() => import('./RenameModal').then((m) => ({ default: m.RenameModal })))
const FilePermissionsModal = lazy(() =>
  import('./FilePermissionsModal').then((m) => ({ default: m.FilePermissionsModal }))
)

interface FileBrowserProps {
  connectionId: string
  sessionToken: string
  onDisconnect: () => void
}

export function FileBrowser({ connectionId, sessionToken, onDisconnect }: FileBrowserProps) {
  // State
  const [files, setFiles] = useState<FileInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingFile, setEditingFile] = useState<FileInfo | null>(null)
  const [showCreateFile, setShowCreateFile] = useState(false)
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [renameFile, setRenameFile] = useState<FileInfo | null>(null)
  const [permissionsFile, setPermissionsFile] = useState<FileInfo | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  // Hooks
  const { toast } = useToast()
  const intl = useIntl()
  const { confirm, ConfirmationModal } = useConfirmation()

  // Custom hooks
  const { currentPath, navigate, goBack, goForward, goUp, canGoBack, canGoForward } =
    useFileNavigation('/')
  const {
    selectedFiles,
    selectedItems,
    selectionStats,
    handleFileSelect,
    clearSelection,
    selectAll,
  } = useFileSelection(files)

  // Load files callback
  const loadFiles = useCallback(async () => {
    if (!sessionToken) return

    setIsLoading(true)
    try {
      const response = await apiCall<FileListResponse>(
        `/api/connections/${connectionId}/files?path=${encodeURIComponent(currentPath)}`,
        {
          headers: { 'x-session-token': sessionToken },
        }
      )

      setFiles(response.files || [])
      clearSelection()
    } catch (error) {
      toast.error(intl.formatMessage({ id: 'fileBrowser.error.loadFailed' }))
      console.error('Failed to load files:', error)
    } finally {
      setIsLoading(false)
    }
  }, [sessionToken, currentPath, connectionId, clearSelection])

  // File operations
  const fileOps = useFileOperations({
    connectionId,
    sessionToken,
    onRefresh: loadFiles,
  })

  // Load files when path or session changes
  useEffect(() => {
    if (sessionToken) {
      loadFiles()
    }
  }, [sessionToken, currentPath, loadFiles])

  // File action handlers
  const handleFileDoubleClick = useCallback(
    (file: FileInfo) => {
      if (file.type === 'directory') {
        navigate(file.path)
      } else {
        setEditingFile(file)
      }
    },
    [navigate]
  )

  const handleDeleteFiles = useCallback(async () => {
    if (selectedFiles.size === 0) return

    confirm({
      title: intl.formatMessage({ id: 'files.delete.title' }),
      message: intl.formatMessage(
        { id: 'files.delete.confirmText' },
        { count: selectedFiles.size }
      ),
      confirmText: intl.formatMessage({ id: 'common.delete' }),
      variant: 'danger',
      onConfirm: async () => {
        await fileOps.deleteFiles(Array.from(selectedFiles))
      },
    })
  }, [selectedFiles, confirm, intl, fileOps])

  const handleCreateFile = useCallback(
    async (name: string, content: string = '') => {
      const filePath = currentPath.endsWith('/') ? currentPath + name : currentPath + '/' + name
      await fileOps.createFile(filePath, content)
    },
    [currentPath, fileOps]
  )

  const handleCreateFolder = useCallback(
    async (name: string) => {
      const folderPath = currentPath.endsWith('/') ? currentPath + name : currentPath + '/' + name
      await fileOps.createFolder(folderPath)
    },
    [currentPath, fileOps]
  )

  const handleFileUpload = useCallback(
    async (uploadedFiles: FileList) => {
      try {
        const uploadPromises = Array.from(uploadedFiles).map(async (file) => {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('path', currentPath)

          const response = await fetch(`/api/connections/${connectionId}/files/upload`, {
            method: 'POST',
            headers: { 'x-session-token': sessionToken },
            body: formData,
          })

          if (!response.ok) {
            throw new Error(`Failed to upload ${file.name}`)
          }
        })

        await Promise.all(uploadPromises)
        toast.success(intl.formatMessage({ id: 'files.upload.success' }))
        loadFiles()
      } catch (error) {
        toast.error(intl.formatMessage({ id: 'files.upload.error' }))
      }
    },
    [currentPath, connectionId, sessionToken, loadFiles]
  )

  const handleSearchSelect = useCallback(
    (file: { path: string; name: string; type: string }) => {
      if (file.type === 'directory') {
        navigate(file.path)
      } else {
        // Navigate to file's directory and select it
        const dirPath = file.path.substring(0, file.path.lastIndexOf('/')) || '/'
        navigate(dirPath)
        setTimeout(() => {
          handleFileSelect(file.path, true)
        }, 100)
      }
    },
    [navigate, handleFileSelect]
  )

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'Delete', handler: handleDeleteFiles, enabled: selectedFiles.size > 0 },
    { key: 'a', ctrl: true, handler: selectAll },
    { key: 'Escape', handler: clearSelection, enabled: selectedFiles.size > 0 },
    { key: 'n', ctrl: true, shift: true, handler: () => setShowCreateFolder(true) },
    { key: 'n', ctrl: true, handler: () => setShowCreateFile(true) },
    { key: 'r', ctrl: true, handler: loadFiles },
  ])

  // Render file editor if editing
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

  // Loading state
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

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <FileBrowserToolbar
        currentPath={currentPath}
        viewMode={viewMode}
        selectedCount={selectedFiles.size}
        selectionStats={selectionStats}
        isDownloading={fileOps.isDownloading}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onNavigate={navigate}
        onGoBack={goBack}
        onGoForward={goForward}
        onGoUp={goUp}
        onViewModeChange={setViewMode}
        onCreateFile={() => setShowCreateFile(true)}
        onCreateFolder={() => setShowCreateFolder(true)}
        onUpload={handleFileUpload}
        onDownload={() => fileOps.downloadFiles(files, selectedFiles)}
        onDelete={handleDeleteFiles}
        onPermissions={() => {
          if (selectedFiles.size === 1) {
            const file = selectedItems[0]
            if (file) setPermissionsFile(file)
          }
        }}
        onClearSelection={clearSelection}
        onRefresh={loadFiles}
        onDisconnect={onDisconnect}
        onSearch={handleSearchSelect}
        connectionId={connectionId}
        sessionToken={sessionToken}
      />

      {/* File List */}
      <div className="flex-1 overflow-auto">
        <FileList
          files={files}
          isLoading={isLoading}
          viewMode={viewMode}
          selectedFiles={selectedFiles}
          onFileSelect={handleFileSelect}
          onFileDoubleClick={handleFileDoubleClick}
          onRename={(file) => setRenameFile(file)}
          onDelete={(filesToDelete) => fileOps.deleteFiles(filesToDelete.map((f) => f.path))}
          onPermissions={(file) => setPermissionsFile(file)}
        />
      </div>

      {/* Modals */}
      <Suspense fallback={null}>
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
            onRename={(oldPath, newName) => {
              fileOps.renameFile(oldPath, newName)
              setRenameFile(null)
            }}
          />
        )}

        {permissionsFile && (
          <FilePermissionsModal
            file={permissionsFile}
            connectionId={connectionId}
            sessionToken={sessionToken}
            onClose={() => setPermissionsFile(null)}
            onSuccess={() => setPermissionsFile(null)}
          />
        )}
      </Suspense>

      <ConfirmationModal />
    </div>
  )
}
