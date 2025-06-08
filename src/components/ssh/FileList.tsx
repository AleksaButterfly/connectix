'use client'

import { useState } from 'react'
import { useIntl, FormattedMessage } from '@/lib/i18n'
import { formatFileSize, formatDate, getFileIcon } from '@/lib/utils/file'
import type { FileInfo } from '@/types/ssh'

interface FileListProps {
  files: FileInfo[]
  isLoading?: boolean
  viewMode?: 'list' | 'grid'
  selectedFiles?: Set<string>
  onFileSelect?: (filePath: string, isSelected: boolean) => void
  onFileOpen?: (file: FileInfo) => void
  onRename?: (file: FileInfo) => void
  onDelete?: (files: FileInfo[]) => void
}

export function FileList({
  files,
  isLoading = false,
  viewMode = 'list',
  selectedFiles = new Set(),
  onFileSelect,
  onFileOpen,
  onRename,
  onDelete,
}: FileListProps) {
  const intl = useIntl()
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'modified'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Safety check: ensure files is always an array
  const safeFiles = Array.isArray(files) ? files : []

  // Sort files with additional safety checks
  const sortedFiles = [...safeFiles].sort((a, b) => {
    // Ensure file has required properties
    if (!a || !b || !a.name || !b.name) {
      return 0
    }

    // Always put directories first
    const aIsDir = a.type === 'directory'
    const bIsDir = b.type === 'directory'

    if (aIsDir !== bIsDir) {
      return aIsDir ? -1 : 1
    }

    let comparison = 0
    switch (sortBy) {
      case 'name':
        comparison = (a.name || '').localeCompare(b.name || '')
        break
      case 'size':
        comparison = (a.size || 0) - (b.size || 0)
        break
      case 'modified':
        const aDate = a.mtime || new Date(0)
        const bDate = b.mtime || new Date(0)
        comparison = new Date(aDate).getTime() - new Date(bDate).getTime()
        break
    }

    return sortOrder === 'asc' ? comparison : -comparison
  })

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const handleFileAction = (file: FileInfo, action: string, event?: React.MouseEvent) => {
    event?.stopPropagation()

    switch (action) {
      case 'rename':
        onRename?.(file)
        break
      case 'delete':
        // If file is selected, delete all selected files, otherwise just this file
        const filesToDelete = selectedFiles.has(file.path)
          ? Array.from(selectedFiles)
              .map((path) => files.find((f) => f.path === path)!)
              .filter(Boolean)
          : [file]
        onDelete?.(filesToDelete)
        break
    }
  }

  const handleCheckboxClick = (file: FileInfo, event: React.MouseEvent) => {
    event.stopPropagation()
    if (onFileSelect) {
      onFileSelect(file.path, !selectedFiles.has(file.path))
    }
  }

  const handleRowClick = (file: FileInfo) => {
    onFileOpen?.(file)
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-terminal-green border-t-transparent"></div>
          <p className="text-foreground-muted">
            <FormattedMessage id="fileList.loading" />
          </p>
        </div>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl opacity-50">📁</div>
          <h3 className="mb-2 text-lg font-medium text-foreground">
            <FormattedMessage id="fileList.empty.title" />
          </h3>
          <p className="text-foreground-muted">
            <FormattedMessage id="fileList.empty.description" />
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* File count info */}
      <div className="border-b border-border bg-background-secondary px-4 py-2">
        <span className="text-sm text-foreground-muted">
          <FormattedMessage id="fileList.itemCount" values={{ count: files.length }} />
          {selectedFiles.size > 0 && (
            <>
              {' • '}
              <FormattedMessage
                id="fileList.selectedCount"
                values={{ count: selectedFiles.size }}
              />
            </>
          )}
        </span>
      </div>

      {/* File List */}
      {viewMode === 'list' ? (
        <table className="w-full">
          <thead className="sticky top-0 z-10 border-b border-border bg-background-secondary">
            <tr>
              {onFileSelect && <th className="w-12 px-4 py-3"></th>}
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-terminal-green"
                >
                  <FormattedMessage id="fileList.column.name" />
                  {sortBy === 'name' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('size')}
                  className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-terminal-green"
                >
                  <FormattedMessage id="fileList.column.size" />
                  {sortBy === 'size' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('modified')}
                  className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-terminal-green"
                >
                  <FormattedMessage id="fileList.column.modified" />
                  {sortBy === 'modified' && (
                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </button>
              </th>
              <th className="w-24 px-4 py-3">
                <span className="sr-only">
                  <FormattedMessage id="fileList.column.actions" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedFiles.map((file) => {
              if (!file || !file.name) {
                return null
              }

              const isSelected = selectedFiles.has(file.path)
              return (
                <tr
                  key={file.path}
                  onClick={() => handleRowClick(file)}
                  className={`cursor-pointer border-b border-border transition-colors hover:bg-background-secondary ${
                    isSelected ? 'bg-terminal-green/10' : ''
                  }`}
                >
                  {onFileSelect && (
                    <td className="px-4 py-3">
                      <div
                        className="flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleCheckboxClick(file, e as any)}
                          className="h-4 w-4 rounded border-border text-terminal-green focus:ring-1 focus:ring-terminal-green focus:ring-offset-0"
                        />
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{getFileIcon(file)}</span>
                      <span className="font-medium text-foreground">{file.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground-muted">
                    {file.type === 'directory' ? '-' : formatFileSize(file.size)}
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground-muted">
                    {formatDate(file.mtime)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => handleFileAction(file, 'rename', e)}
                        className="rounded p-1 text-xs text-foreground-muted hover:bg-background-tertiary hover:text-foreground"
                        title={intl.formatMessage({ id: 'fileList.action.rename' })}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => handleFileAction(file, 'delete', e)}
                        className="rounded p-1 text-xs text-foreground-muted hover:bg-red-500/10 hover:text-red-500"
                        title={intl.formatMessage({ id: 'fileList.action.delete' })}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : (
        <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {sortedFiles.map((file) => {
            if (!file || !file.name) {
              return null
            }

            const isSelected = selectedFiles.has(file.path)
            return (
              <div
                key={file.path}
                onClick={() => handleRowClick(file)}
                className={`group relative cursor-pointer rounded-lg border p-4 transition-all hover:shadow-lg ${
                  isSelected
                    ? 'border-terminal-green bg-terminal-green/10'
                    : 'border-border hover:border-terminal-green/50 hover:bg-background-secondary'
                }`}
              >
                {onFileSelect && (
                  <div className="absolute right-2 top-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleCheckboxClick(file, e as any)}
                      className="h-4 w-4 rounded border-border text-terminal-green focus:ring-1 focus:ring-terminal-green focus:ring-offset-0"
                    />
                  </div>
                )}

                <div className="flex flex-col items-center text-center">
                  <div className="mb-2 text-3xl">{getFileIcon(file)}</div>
                  <div className="mb-1 w-full truncate text-sm font-medium text-foreground">
                    {file.name}
                  </div>
                  <div className="text-xs text-foreground-muted">
                    {file.type === 'directory' ? (
                      <FormattedMessage id="fileList.type.folder" />
                    ) : (
                      formatFileSize(file.size)
                    )}
                  </div>
                </div>

                {/* Action buttons on hover */}
                <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => handleFileAction(file, 'rename', e)}
                    className="rounded bg-background p-1 text-xs shadow-md hover:bg-background-secondary"
                    title={intl.formatMessage({ id: 'fileList.action.rename' })}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => handleFileAction(file, 'delete', e)}
                    className="rounded bg-background p-1 text-xs shadow-md hover:bg-red-500/10"
                    title={intl.formatMessage({ id: 'fileList.action.delete' })}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
