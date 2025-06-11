'use client'

import { createContext, useContext, ReactNode, useState, useCallback } from 'react'
import { useFileOperations } from '@/hooks/useFileOperations'
import { useFileSelection } from '@/hooks/useFileSelection'
import { useFileNavigation } from '@/hooks/useFileNavigation'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useErrorHandler } from '@/lib/utils/error'
import { useToast } from '@/components/ui/ToastContext'
import { useIntl } from '@/lib/i18n'
import { apiCall } from '@/types/ssh'
import type { FileInfo, FileListResponse } from '@/types/ssh'

interface FileBrowserState {
  files: FileInfo[]
  isLoading: boolean
  editingFile: FileInfo | null
  showCreateFile: boolean
  showCreateFolder: boolean
  renameFile: FileInfo | null
  permissionsFile: FileInfo | null
  viewMode: 'list' | 'grid'
}

interface FileBrowserActions {
  setFiles: (files: FileInfo[]) => void
  setIsLoading: (loading: boolean) => void
  setEditingFile: (file: FileInfo | null) => void
  setShowCreateFile: (show: boolean) => void
  setShowCreateFolder: (show: boolean) => void
  setRenameFile: (file: FileInfo | null) => void
  setPermissionsFile: (file: FileInfo | null) => void
  setViewMode: (mode: 'list' | 'grid') => void
  loadFiles: () => Promise<void>
  handleFileDoubleClick: (file: FileInfo) => void
  handleDeleteFiles: () => Promise<void>
  handleCreateFile: (name: string, content?: string) => Promise<void>
  handleCreateFolder: (name: string) => Promise<void>
  handleFileUpload: (files: FileList) => Promise<void>
  handleSearchSelect: (file: { path: string; name: string; type: string }) => void
}

interface FileBrowserContextValue extends FileBrowserState, FileBrowserActions {
  // Navigation
  currentPath: string
  navigate: (path: string) => void
  goBack: () => void
  goForward: () => void
  goUp: () => void
  canGoBack: boolean
  canGoForward: boolean
  
  // Selection
  selectedFiles: Set<string>
  selectedItems: FileInfo[]
  selectionStats: any
  handleFileSelect: (filePath: string, isSelected: boolean) => void
  clearSelection: () => void
  selectAll: () => void
  
  // File operations
  fileOps: ReturnType<typeof useFileOperations>
}

const FileBrowserContext = createContext<FileBrowserContextValue | undefined>(undefined)

interface FileBrowserProviderProps {
  children: ReactNode
  connectionId: string
  sessionToken: string
  onDisconnect: () => void
}

export function FileBrowserProvider({
  children,
  connectionId,
  sessionToken,
  onDisconnect
}: FileBrowserProviderProps) {
  // State
  const [state, setState] = useState<FileBrowserState>({
    files: [],
    isLoading: false,
    editingFile: null,
    showCreateFile: false,
    showCreateFolder: false,
    renameFile: null,
    permissionsFile: null,
    viewMode: 'list'
  })

  // Hooks
  const { toast } = useToast()
  const intl = useIntl()
  const { handleError } = useErrorHandler()

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
  } = useFileSelection(state.files)

  // Load files callback
  const loadFiles = useCallback(async () => {
    if (!sessionToken) return

    setState(prev => ({ ...prev, isLoading: true }))
    try {
      const response = await apiCall<FileListResponse>(
        `/api/connections/${connectionId}/files?path=${encodeURIComponent(currentPath)}`,
        {
          headers: { 'x-session-token': sessionToken },
        }
      )

      setState(prev => ({ ...prev, files: response.files || [] }))
      clearSelection()
    } catch (error) {
      handleError(error, {
        fallbackMessage: intl.formatMessage({ id: 'fileBrowser.error.loadFailed' })
      })
    } finally {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [sessionToken, currentPath, connectionId, clearSelection, handleError, intl])

  // File operations
  const fileOps = useFileOperations({
    connectionId,
    sessionToken,
    onRefresh: loadFiles,
  })

  // Actions
  const setFiles = useCallback((files: FileInfo[]) => {
    setState(prev => ({ ...prev, files }))
  }, [])

  const setIsLoading = useCallback((isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading }))
  }, [])

  const setEditingFile = useCallback((editingFile: FileInfo | null) => {
    setState(prev => ({ ...prev, editingFile }))
  }, [])

  const setShowCreateFile = useCallback((showCreateFile: boolean) => {
    setState(prev => ({ ...prev, showCreateFile }))
  }, [])

  const setShowCreateFolder = useCallback((showCreateFolder: boolean) => {
    setState(prev => ({ ...prev, showCreateFolder }))
  }, [])

  const setRenameFile = useCallback((renameFile: FileInfo | null) => {
    setState(prev => ({ ...prev, renameFile }))
  }, [])

  const setPermissionsFile = useCallback((permissionsFile: FileInfo | null) => {
    setState(prev => ({ ...prev, permissionsFile }))
  }, [])

  const setViewMode = useCallback((viewMode: 'list' | 'grid') => {
    setState(prev => ({ ...prev, viewMode }))
  }, [])

  // File action handlers
  const handleFileDoubleClick = useCallback((file: FileInfo) => {
    if (file.type === 'directory') {
      navigate(file.path)
    } else {
      setEditingFile(file)
    }
  }, [navigate, setEditingFile])

  const handleDeleteFiles = useCallback(async () => {
    if (selectedFiles.size === 0) return

    // We'll implement confirmation modal logic here
    // For now, just call the file operation
    await fileOps.deleteFiles(Array.from(selectedFiles))
  }, [selectedFiles, fileOps])

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
        handleError(error, {
          fallbackMessage: intl.formatMessage({ id: 'files.upload.error' })
        })
      }
    },
    [currentPath, connectionId, sessionToken, loadFiles, toast, intl, handleError]
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

  const contextValue: FileBrowserContextValue = {
    // State
    ...state,
    
    // Actions
    setFiles,
    setIsLoading,
    setEditingFile,
    setShowCreateFile,
    setShowCreateFolder,
    setRenameFile,
    setPermissionsFile,
    setViewMode,
    loadFiles,
    handleFileDoubleClick,
    handleDeleteFiles,
    handleCreateFile,
    handleCreateFolder,
    handleFileUpload,
    handleSearchSelect,
    
    // Navigation
    currentPath,
    navigate,
    goBack,
    goForward,
    goUp,
    canGoBack,
    canGoForward,
    
    // Selection
    selectedFiles,
    selectedItems,
    selectionStats,
    handleFileSelect,
    clearSelection,
    selectAll,
    
    // File operations
    fileOps
  }

  return (
    <FileBrowserContext.Provider value={contextValue}>
      {children}
    </FileBrowserContext.Provider>
  )
}

export function useFileBrowser() {
  const context = useContext(FileBrowserContext)
  if (context === undefined) {
    throw new Error('useFileBrowser must be used within a FileBrowserProvider')
  }
  return context
}