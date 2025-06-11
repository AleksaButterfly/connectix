'use client'

import { Suspense, lazy } from 'react'
import { useFileBrowser } from './FileBrowserProvider'
import { useConfirmation } from '@/hooks/useConfirmation'
import { useIntl } from '@/lib/i18n'
import { LoadingSpinner } from '@/components/ui'

// Lazy load modals for better performance
const CreateFileModal = lazy(() =>
  import('./CreateFileModal').then((m) => ({ default: m.CreateFileModal }))
)
const CreateFolderModal = lazy(() =>
  import('./CreateFolderModal').then((m) => ({ default: m.CreateFolderModal }))
)
const RenameModal = lazy(() => 
  import('./RenameModal').then((m) => ({ default: m.RenameModal }))
)
const FilePermissionsModal = lazy(() =>
  import('./FilePermissionsModal').then((m) => ({ default: m.FilePermissionsModal }))
)

interface FileModalsProps {
  connectionId: string
  sessionToken: string
}

export default function FileModals({
  connectionId,
  sessionToken
}: FileModalsProps) {
  const intl = useIntl()
  const { confirm, ConfirmationModal } = useConfirmation()
  
  const {
    showCreateFile,
    showCreateFolder,
    renameFile,
    permissionsFile,
    selectedFiles,
    setShowCreateFile,
    setShowCreateFolder,
    setRenameFile,
    setPermissionsFile,
    handleCreateFile,
    handleCreateFolder,
    handleDeleteFiles,
    fileOps
  } = useFileBrowser()

  // Enhanced delete handler with confirmation
  const handleDeleteWithConfirmation = () => {
    if (selectedFiles.size === 0) return

    confirm({
      title: intl.formatMessage({ id: 'files.delete.title' }),
      message: intl.formatMessage(
        { id: 'files.delete.confirmText' },
        { count: selectedFiles.size }
      ),
      confirmText: intl.formatMessage({ id: 'common.delete' }),
      variant: 'danger',
      onConfirm: handleDeleteFiles,
    })
  }

  // Enhanced rename handler
  const handleRename = (oldPath: string, newName: string) => {
    fileOps.renameFile(oldPath, newName)
    setRenameFile(null)
  }

  return (
    <>
      {/* File Creation Modals */}
      <Suspense fallback={<LoadingSpinner size="sm" />}>
        {showCreateFile && (
          <CreateFileModal 
            onClose={() => setShowCreateFile(false)} 
            onCreate={handleCreateFile} 
          />
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
            onRename={handleRename}
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

      {/* Confirmation Modal */}
      <ConfirmationModal />
    </>
  )
}