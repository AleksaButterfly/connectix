'use client'

import { useState, useRef, useEffect } from 'react'
import { FileBreadcrumb } from './FileBreadcrumb'
import { FileUpload } from './FileUpload'
import { FileSearch } from './FileSearch'
import { useIntl, FormattedMessage } from '@/lib/i18n'

interface SelectionStats {
  count: number
  totalSize: number
  hasFiles: boolean
  hasDirectories: boolean
  allFiles: boolean
  allDirectories: boolean
}

interface FileBrowserToolbarProps {
  currentPath: string
  viewMode: 'list' | 'grid'
  selectedCount: number
  selectionStats: SelectionStats
  isDownloading: boolean
  canGoBack: boolean
  canGoForward: boolean
  connectionId: string
  sessionToken: string
  onNavigate: (path: string) => void
  onGoBack: () => void
  onGoForward: () => void
  onGoUp: () => void
  onViewModeChange: (mode: 'list' | 'grid') => void
  onCreateFile: () => void
  onCreateFolder: () => void
  onUpload: (files: FileList) => Promise<void>
  onDownload: () => void
  onDelete: () => void
  onPermissions: () => void
  onClearSelection: () => void
  onRefresh: () => void
  onDisconnect: () => void
  onSearch: (file: { path: string; name: string; type: string }) => void
}

export function FileBrowserToolbar({
  currentPath,
  viewMode,
  selectedCount,
  selectionStats,
  isDownloading,
  canGoBack,
  canGoForward,
  connectionId,
  sessionToken,
  onNavigate,
  onGoBack,
  onGoForward,
  onGoUp,
  onViewModeChange,
  onCreateFile,
  onCreateFolder,
  onUpload,
  onDownload,
  onDelete,
  onPermissions,
  onClearSelection,
  onRefresh,
  onDisconnect,
  onSearch,
}: FileBrowserToolbarProps) {
  const intl = useIntl()
  const [showCreateDropdown, setShowCreateDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCreateDropdown(false)
      }
    }

    if (showCreateDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCreateDropdown])

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="border-b border-border bg-background-secondary">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Navigation buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={onGoBack}
              disabled={!canGoBack}
              className="rounded p-1 text-foreground-muted hover:bg-background hover:text-foreground disabled:opacity-50"
              title={intl.formatMessage({ id: 'files.navigation.back' })}
              aria-label={intl.formatMessage({ id: 'files.navigation.back' })}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={onGoForward}
              disabled={!canGoForward}
              className="rounded p-1 text-foreground-muted hover:bg-background hover:text-foreground disabled:opacity-50"
              title={intl.formatMessage({ id: 'files.navigation.forward' })}
              aria-label={intl.formatMessage({ id: 'files.navigation.forward' })}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>

          {/* Breadcrumb */}
          <FileBreadcrumb path={currentPath} onNavigate={onNavigate} />

          {/* Refresh button */}
          <button
            onClick={onRefresh}
            className="rounded p-1 text-foreground-muted hover:bg-background hover:text-foreground"
            title={intl.formatMessage({ id: 'files.refresh' })}
            aria-label={intl.formatMessage({ id: 'files.refresh' })}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* File Search */}
          <FileSearch
            connectionId={connectionId}
            sessionToken={sessionToken}
            currentPath={currentPath}
            onFileSelect={onSearch}
          />

          {/* View mode toggle */}
          <div className="flex rounded-lg border border-border">
            <button
              onClick={() => onViewModeChange('list')}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                viewMode === 'list'
                  ? 'bg-terminal-green text-background'
                  : 'text-foreground hover:bg-background-tertiary'
              }`}
              title={intl.formatMessage({ id: 'files.viewMode.list' })}
              aria-label={intl.formatMessage({ id: 'files.viewMode.list' })}
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
              onClick={() => onViewModeChange('grid')}
              className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                viewMode === 'grid'
                  ? 'bg-terminal-green text-background'
                  : 'text-foreground hover:bg-background-tertiary'
              }`}
              title={intl.formatMessage({ id: 'files.viewMode.grid' })}
              aria-label={intl.formatMessage({ id: 'files.viewMode.grid' })}
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
                      onCreateFile()
                      setShowCreateDropdown(false)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-background-tertiary"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      onCreateFolder()
                      setShowCreateDropdown(false)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-background-tertiary"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <FileUpload onUpload={onUpload} onComplete={onRefresh} currentPath={currentPath} />
          </div>

          {/* Disconnect button */}
          <button
            onClick={onDisconnect}
            className="ml-2 rounded-lg border border-red-500/20 bg-background px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-500/10"
          >
            <FormattedMessage id="common.disconnect" />
          </button>
        </div>
      </div>

      {/* Selection actions bar */}
      {selectedCount > 0 && (
        <div className="border-t border-border bg-terminal-green/5 px-4 py-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-terminal-green">
              {selectedCount === 1
                ? intl.formatMessage({ id: 'files.selection.single' }, { count: selectedCount })
                : intl.formatMessage({ id: 'files.selection.multiple' }, { count: selectedCount })}
              {selectionStats.hasFiles && selectionStats.totalSize > 0 && (
                <span className="ml-2 text-xs text-terminal-green/80">
                  ({formatFileSize(selectionStats.totalSize)})
                </span>
              )}
            </span>

            <div className="flex items-center gap-2">
              {/* Download button */}
              <div className="group relative inline-block">
                <button
                  onClick={onDownload}
                  disabled={!selectionStats.hasFiles || isDownloading}
                  className={`flex items-center gap-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                    selectionStats.hasFiles && !isDownloading
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-blue-600/20 text-blue-600/50'
                  }`}
                >
                  {isDownloading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600/50 border-t-transparent" />
                      <FormattedMessage id="common.downloading" />
                    </>
                  ) : (
                    <>
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
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                        />
                      </svg>
                      <FormattedMessage id="common.download" />
                      {selectedCount > 1 && selectionStats.hasFiles && ' as ZIP'}
                    </>
                  )}
                </button>
                {!selectionStats.hasFiles && !isDownloading && (
                  <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 transform group-hover:block">
                    <div className="whitespace-nowrap rounded bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg">
                      {intl.formatMessage({ id: 'files.tooltips.download.folderSelected' })}
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
                  onClick={onPermissions}
                  disabled={selectedCount !== 1}
                  className={`flex items-center gap-1 rounded px-3 py-1.5 text-sm font-medium transition-colors ${
                    selectedCount === 1
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
                {selectedCount !== 1 && (
                  <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 transform group-hover:block">
                    <div className="whitespace-nowrap rounded bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg">
                      {selectedCount === 0
                        ? intl.formatMessage({ id: 'files.tooltips.permissions.noSelection' })
                        : intl.formatMessage({
                            id: 'files.tooltips.permissions.multipleSelection',
                          })}
                      <div className="absolute left-1/2 top-full -mt-1 -translate-x-1/2 transform">
                        <div className="border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Delete button */}
              <button
                onClick={onDelete}
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
                onClick={onClearSelection}
                className="rounded border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-background-tertiary"
              >
                <FormattedMessage id="common.clear" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
