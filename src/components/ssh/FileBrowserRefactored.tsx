'use client'

import { useEffect } from 'react'
import { FileBrowserProvider, useFileBrowser } from './FileBrowserProvider'
import { FileList } from './FileList'
import { FileEditor } from './FileEditor'
import { FileBrowserToolbar } from './FileBrowserToolbar'
import FileActions from './FileActions'
import FileModals from './FileModals'
import { LoadingSpinner, ErrorBoundary } from '@/components/ui'
import { FormattedMessage } from '@/lib/i18n'

interface FileBrowserProps {
  connectionId: string
  sessionToken: string
  onDisconnect: () => void
}

// Main FileBrowser component content
function FileBrowserContent({
  connectionId,
  sessionToken,
  onDisconnect
}: FileBrowserProps) {
  const {
    files,
    isLoading,
    editingFile,
    viewMode,
    selectedFiles,
    currentPath,
    canGoBack,
    canGoForward,
    selectionStats,
    loadFiles,
    navigate,
    goBack,
    goForward,
    goUp,
    setViewMode,
    setRenameFile,
    setPermissionsFile,
    setEditingFile,
    handleFileSelect,
    handleFileDoubleClick,
    handleSearchSelect,
    fileOps
  } = useFileBrowser()

  // Load files when session or path changes
  useEffect(() => {
    if (sessionToken) {
      loadFiles()
    }
  }, [sessionToken, currentPath, loadFiles])

  // Render file editor if editing
  if (editingFile) {
    return (
      <ErrorBoundary>
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
      </ErrorBoundary>
    )
  }

  // Loading state for initial connection
  if (!sessionToken) {
    return (
      <LoadingSpinner
        size="lg"
        fullScreen
        text={<FormattedMessage id="files.connection.establishing" />}
      />
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="border-b border-border bg-background-secondary p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Navigation and Path */}
          <FileBrowserToolbar
            currentPath={currentPath}
            viewMode={viewMode}
            selectedCount={selectedFiles.size}
            selectionStats={selectionStats}
            isDownloading={fileOps.isDownloading}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            connectionId={connectionId}
            sessionToken={sessionToken}
            onNavigate={navigate}
            onGoBack={goBack}
            onGoForward={goForward}
            onGoUp={goUp}
            onViewModeChange={setViewMode}
            onCreateFile={() => {}} // Handled by FileActions
            onCreateFolder={() => {}} // Handled by FileActions
            onUpload={() => {}} // Handled by FileActions
            onDownload={() => {}} // Handled by FileActions
            onDelete={() => {}} // Handled by FileActions
            onPermissions={() => {}} // Handled by FileActions
            onClearSelection={() => {}} // Handled by FileActions
            onRefresh={loadFiles}
            onDisconnect={onDisconnect}
            onSearch={handleSearchSelect}
          />
          
          {/* Action Buttons */}
          <FileActions
            connectionId={connectionId}
            sessionToken={sessionToken}
            onDisconnect={onDisconnect}
          />
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto">
        <ErrorBoundary>
          <FileList
            files={files}
            isLoading={isLoading}
            viewMode={viewMode}
            selectedFiles={selectedFiles}
            onFileSelect={handleFileSelect}
            onFileDoubleClick={handleFileDoubleClick}
            onRename={(file) => setRenameFile(file)}
            onDelete={(filesToDelete) => 
              fileOps.deleteFiles(filesToDelete.map((f) => f.path))
            }
            onPermissions={(file) => setPermissionsFile(file)}
          />
        </ErrorBoundary>
      </div>

      {/* Modals */}
      <FileModals
        connectionId={connectionId}
        sessionToken={sessionToken}
      />
    </div>
  )
}

// Main FileBrowser component with provider
export function FileBrowser({ connectionId, sessionToken, onDisconnect }: FileBrowserProps) {
  return (
    <ErrorBoundary
      showErrorDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        console.error('FileBrowser error:', error, errorInfo)
        // Could send to error reporting service here
      }}
    >
      <FileBrowserProvider
        connectionId={connectionId}
        sessionToken={sessionToken}
        onDisconnect={onDisconnect}
      >
        <FileBrowserContent
          connectionId={connectionId}
          sessionToken={sessionToken}
          onDisconnect={onDisconnect}
        />
      </FileBrowserProvider>
    </ErrorBoundary>
  )
}