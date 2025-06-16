'use client'

import { useRef } from 'react'
import { Button, Icon } from '@/components/ui'
import { useFileBrowser } from './FileBrowserProvider'
import { useIntl, FormattedMessage } from '@/lib/i18n'

interface FileActionsProps {
  connectionId: string
  sessionToken: string
  onDisconnect: () => void
}

export default function FileActions({
  onDisconnect
}: FileActionsProps) {
  const intl = useIntl()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const {
    selectedFiles,
    selectionStats,
    setShowCreateFile,
    setShowCreateFolder,
    handleFileUpload,
    handleDeleteFiles,
    clearSelection,
    loadFiles,
    fileOps
  } = useFileBrowser()

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      handleFileUpload(files)
      // Reset the input so the same file can be uploaded again
      event.target.value = ''
    }
  }

  const handleDownload = () => {
    if (selectedFiles.size === 0) return
    fileOps.downloadFiles(selectionStats.allFiles ? Array.from(selectedFiles).map(path => ({ path, type: 'file' as const })) : [], selectedFiles)
  }

  const handlePermissions = () => {
    if (selectedFiles.size === 1) {
      // This will be handled by the parent component
      console.log('Handle permissions for:', Array.from(selectedFiles)[0])
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Create Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowCreateFile(true)}
          leftIcon={<Icon name="plus" size="sm" />}
          title={intl.formatMessage({ id: 'fileActions.createFile' })}
        >
          <span className="hidden sm:inline">
            <FormattedMessage id="fileActions.createFile" />
          </span>
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowCreateFolder(true)}
          leftIcon={<Icon name="folder" size="sm" />}
          title={intl.formatMessage({ id: 'fileActions.createFolder' })}
        >
          <span className="hidden sm:inline">
            <FormattedMessage id="fileActions.createFolder" />
          </span>
        </Button>
      </div>

      {/* File Operations */}
      <div className="flex items-center gap-1">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleUploadClick}
          leftIcon={<Icon name="upload" size="sm" />}
          title={intl.formatMessage({ id: 'fileActions.upload' })}
        >
          <span className="hidden sm:inline">
            <FormattedMessage id="fileActions.upload" />
          </span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleDownload}
          disabled={selectedFiles.size === 0 || fileOps.isDownloading}
          leftIcon={fileOps.isDownloading ? 
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> :
            <Icon name="download" size="sm" />
          }
          title={intl.formatMessage({ id: 'fileActions.download' })}
        >
          <span className="hidden sm:inline">
            {fileOps.isDownloading ? (
              <FormattedMessage id="fileActions.downloading" />
            ) : (
              <FormattedMessage id="fileActions.download" />
            )}
          </span>
        </Button>

        <Button
          variant="danger"
          size="sm"
          onClick={handleDeleteFiles}
          disabled={selectedFiles.size === 0}
          leftIcon={<Icon name="delete" size="sm" />}
          title={intl.formatMessage({ id: 'fileActions.delete' })}
        >
          <span className="hidden sm:inline">
            <FormattedMessage id="fileActions.delete" />
          </span>
        </Button>
      </div>

      {/* Selection Actions */}
      {selectedFiles.size > 0 && (
        <div className="flex items-center gap-1">
          {selectedFiles.size === 1 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePermissions}
              leftIcon={<Icon name="lock" size="sm" />}
              title={intl.formatMessage({ id: 'fileActions.permissions' })}
            >
              <span className="hidden sm:inline">
                <FormattedMessage id="fileActions.permissions" />
              </span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={clearSelection}
            leftIcon={<Icon name="x" size="sm" />}
            title={intl.formatMessage({ id: 'fileActions.clearSelection' })}
          >
            <span className="hidden sm:inline">
              <FormattedMessage id="fileActions.clearSelection" />
            </span>
          </Button>
        </div>
      )}

      {/* System Actions */}
      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={loadFiles}
          leftIcon={<Icon name="refresh" size="sm" />}
          title={intl.formatMessage({ id: 'fileActions.refresh' })}
        >
          <span className="hidden sm:inline">
            <FormattedMessage id="fileActions.refresh" />
          </span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onDisconnect}
          leftIcon={<Icon name="disconnect" size="sm" />}
          title={intl.formatMessage({ id: 'fileActions.disconnect' })}
        >
          <span className="hidden sm:inline">
            <FormattedMessage id="fileActions.disconnect" />
          </span>
        </Button>
      </div>

      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileInputChange}
      />
    </div>
  )
}