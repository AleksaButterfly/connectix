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
  onFileDoubleClick?: (file: FileInfo) => void
  onRename?: (file: FileInfo) => void
  onDelete?: (files: FileInfo[]) => void
  onPermissions?: (file: FileInfo) => void
}

export function FileList({
  files,
  isLoading = false,
  viewMode = 'list',
  selectedFiles = new Set(),
  onFileSelect,
  onFileDoubleClick,
  onRename,
  onDelete,
  onPermissions,
}: FileListProps) {
  const intl = useIntl()
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'modified' | 'permissions'>('name')
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
      case 'permissions':
        comparison = (a.permissions || '').localeCompare(b.permissions || '')
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
      case 'open':
        onFileDoubleClick?.(file)
        break
      case 'rename':
        onRename?.(file)
        break
      case 'delete':
        onDelete?.(
          selectedFiles.has(file.path)
            ? Array.from(selectedFiles)
                .map((path) => files.find((f) => f.path === path)!)
                .filter(Boolean)
            : [file]
        )
        break
      case 'permissions':
        onPermissions?.(file)
        break
    }
  }

  const handleFileSelect = (filePath: string, event: React.MouseEvent) => {
    if (!onFileSelect) return

    event.stopPropagation()
    onFileSelect(filePath, !selectedFiles.has(filePath))
  }

  const handleCheckboxClick = (e: React.MouseEvent<HTMLInputElement>, filePath: string) => {
    e.stopPropagation()
    if (onFileSelect) {
      onFileSelect(filePath, !selectedFiles.has(filePath))
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center text-center">
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
            <FormattedMessage id="fileList.emptyDirectory" />
          </h3>
          <p className="text-foreground-muted">
            <FormattedMessage id="fileList.emptyDescription" />
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="border-b border-border bg-background-secondary px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm text-foreground-muted">
              <FormattedMessage
                id="fileList.itemCount"
                values={{
                  count: files.length,
                  selected:
                    selectedFiles.size > 0
                      ? intl.formatMessage(
                          { id: 'fileList.selectedCount' },
                          { count: selectedFiles.size }
                        )
                      : '',
                }}
              />
            </span>
          </div>
        </div>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'list' ? (
          <table className="w-full">
            <thead className="border-b border-border bg-background-secondary">
              <tr>
                {onFileSelect && <th className="w-8 px-4 py-3"></th>}
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-terminal-green"
                  >
                    <FormattedMessage id="fileList.column.name" />
                    {sortBy === 'name' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('size')}
                    className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-terminal-green"
                  >
                    <FormattedMessage id="fileList.column.size" />
                    {sortBy === 'size' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('permissions')}
                    className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-terminal-green"
                  >
                    <FormattedMessage id="fileList.column.permissions" />
                    {sortBy === 'permissions' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('modified')}
                    className="flex items-center gap-1 text-sm font-medium text-foreground hover:text-terminal-green"
                  >
                    <FormattedMessage id="fileList.column.modified" />
                    {sortBy === 'modified' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
                <th className="w-32 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sortedFiles.map((file, index) => {
                // Safety check for each file
                if (!file || !file.name) {
                  return null
                }

                const isSelected = selectedFiles.has(file.path)
                return (
                  <tr
                    key={file.path}
                    onClick={() => handleFileAction(file, 'open')}
                    className={`cursor-pointer border-b border-border hover:bg-background-secondary ${
                      isSelected ? 'bg-terminal-green/10' : ''
                    }`}
                  >
                    {onFileSelect && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Prevent default onChange
                          onClick={(e) => handleCheckboxClick(e, file.path)}
                          className="rounded border-border text-terminal-green focus:ring-terminal-green"
                        />
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
                    <td className="px-4 py-3">
                      <code className="font-mono text-xs text-foreground-muted">
                        {file.type === 'directory' ? 'd' : '-'}
                        {file.permissions}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground-muted">
                      {formatDate(file.mtime)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {onPermissions && (
                          <button
                            onClick={(e) => handleFileAction(file, 'permissions', e)}
                            className="rounded p-1 text-xs text-foreground-muted hover:bg-background-tertiary hover:text-terminal-purple"
                            title={intl.formatMessage({ id: 'fileList.action.changePermissions' })}
                          >
                            🔐
                          </button>
                        )}
                        <button
                          onClick={(e) => handleFileAction(file, 'rename', e)}
                          className="rounded p-1 text-xs text-foreground-muted hover:bg-background-tertiary hover:text-foreground"
                          title={intl.formatMessage({ id: 'fileList.action.rename' })}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => handleFileAction(file, 'delete', e)}
                          className="rounded p-1 text-xs text-foreground-muted hover:bg-red-100 hover:text-red-600"
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
            {sortedFiles.map((file, index) => {
              // Safety check for each file
              if (!file || !file.name) {
                return null
              }

              const isSelected = selectedFiles.has(file.path)
              return (
                <div
                  key={file.path}
                  onClick={() => handleFileAction(file, 'open')}
                  className={`group relative cursor-pointer rounded-lg border border-border p-3 hover:bg-background-secondary ${
                    isSelected ? 'border-terminal-green/30 bg-terminal-green/10' : ''
                  }`}
                >
                  {onFileSelect && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // Prevent default onChange
                      onClick={(e) => handleCheckboxClick(e, file.path)}
                      className="absolute right-2 top-2 rounded border-border text-terminal-green focus:ring-terminal-green"
                    />
                  )}

                  <div className="flex flex-col items-center text-center">
                    <div className="mb-2 text-3xl">{getFileIcon(file)}</div>
                    <div className="mb-1 truncate text-sm font-medium text-foreground">
                      {file.name}
                    </div>
                    <div className="text-xs text-foreground-muted">
                      {file.type === 'directory'
                        ? intl.formatMessage({ id: 'fileList.folder' })
                        : formatFileSize(file.size)}
                    </div>
                    <div className="mt-1 font-mono text-xs text-foreground-subtle">
                      {file.permissions}
                    </div>
                  </div>

                  {/* Action buttons on hover */}
                  <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {onPermissions && (
                      <button
                        onClick={(e) => handleFileAction(file, 'permissions', e)}
                        className="rounded bg-background p-1 text-xs shadow-md hover:bg-background-secondary"
                        title={intl.formatMessage({ id: 'fileList.action.permissions' })}
                      >
                        🔐
                      </button>
                    )}
                    <button
                      onClick={(e) => handleFileAction(file, 'rename', e)}
                      className="rounded bg-background p-1 text-xs shadow-md hover:bg-background-secondary"
                      title={intl.formatMessage({ id: 'fileList.action.rename' })}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={(e) => handleFileAction(file, 'delete', e)}
                      className="rounded bg-background p-1 text-xs shadow-md hover:bg-red-100"
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
    </div>
  )
}
