'use client'

import { useEffect, useRef } from 'react'
import { useIntl, FormattedMessage } from '@/lib/i18n'
import type { FileInfo } from '@/types/ssh'

interface FileContextMenuProps {
  isOpen: boolean
  position: { x: number; y: number }
  selectedFiles: FileInfo[]
  selectionStats: {
    count: number
    totalSize: number
    hasFiles: boolean
    hasDirectories: boolean
    allFiles: boolean
    allDirectories: boolean
  }
  hasClipboard: boolean
  clipboardInfo: {
    count: number
    operation: 'copy' | 'cut'
    isCut: boolean
    isCopy: boolean
  } | null
  onClose: () => void
  onCopy: () => void
  onCut: () => void
  onPaste: () => void
  onRename: () => void
  onDelete: () => void
  onDownload: () => void
  onPermissions: () => void
  onEdit?: () => void
}

export function FileContextMenu({
  isOpen,
  position,
  selectedFiles,
  selectionStats,
  hasClipboard,
  clipboardInfo,
  onClose,
  onCopy,
  onCut,
  onPaste,
  onRename,
  onDelete,
  onDownload,
  onPermissions,
  onEdit,
}: FileContextMenuProps) {
  const intl = useIntl()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const canEdit = selectionStats.count === 1 && selectionStats.allFiles
  const canRename = selectionStats.count === 1
  const canDownload = selectionStats.hasFiles

  const menuItems = [
    // Edit (for single text files)
    ...(canEdit && onEdit
      ? [
          {
            key: 'edit',
            label: <FormattedMessage id="fileBrowser.edit" />,
            icon: '📝',
            onClick: () => {
              onEdit()
              onClose()
            },
          },
        ]
      : []),

    // Copy
    {
      key: 'copy',
      label: <FormattedMessage id="fileBrowser.copy" />,
      icon: '📋',
      shortcut: 'Ctrl+C',
      onClick: () => {
        onCopy()
        onClose()
      },
    },

    // Cut
    {
      key: 'cut',
      label: <FormattedMessage id="fileBrowser.cut" />,
      icon: '✂️',
      shortcut: 'Ctrl+X',
      onClick: () => {
        onCut()
        onClose()
      },
    },

    // Paste
    ...(hasClipboard
      ? [
          {
            key: 'paste',
            label: (
              <FormattedMessage 
                id="fileBrowser.paste" 
                values={{
                  count: clipboardInfo?.count || 0,
                  operation: clipboardInfo?.operation || 'copy'
                }}
              />
            ),
            icon: clipboardInfo?.isCut ? '📤' : '📥',
            shortcut: 'Ctrl+V',
            onClick: () => {
              onPaste()
              onClose()
            },
          },
        ]
      : []),

    // Separator
    ...(hasClipboard ? [{ key: 'separator1', separator: true }] : []),

    // Rename (for single items)
    ...(canRename
      ? [
          {
            key: 'rename',
            label: <FormattedMessage id="fileBrowser.rename" />,
            icon: '✏️',
            shortcut: 'F2',
            onClick: () => {
              onRename()
              onClose()
            },
          },
        ]
      : []),

    // Download (for files)
    ...(canDownload
      ? [
          {
            key: 'download',
            label: <FormattedMessage id="fileBrowser.download" />,
            icon: '⬇️',
            onClick: () => {
              onDownload()
              onClose()
            },
          },
        ]
      : []),

    // Permissions
    {
      key: 'permissions',
      label: <FormattedMessage id="fileBrowser.permissions" />,
      icon: '🔒',
      onClick: () => {
        onPermissions()
        onClose()
      },
    },

    // Separator
    { key: 'separator2', separator: true },

    // Delete
    {
      key: 'delete',
      label: <FormattedMessage id="fileBrowser.delete" />,
      icon: '🗑️',
      shortcut: 'Delete',
      className: 'text-red-500 hover:bg-red-50 hover:text-red-600',
      onClick: () => {
        onDelete()
        onClose()
      },
    },
  ]

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-48 rounded-lg border border-border bg-background-secondary shadow-xl"
      style={{
        left: position.x,
        top: position.y,
      }}
      role="menu"
    >
      <div className="py-1">
        {menuItems.map((item) => {
          if ('separator' in item) {
            return <div key={item.key} className="my-1 border-t border-border" />
          }

          return (
            <button
              key={item.key}
              onClick={item.onClick}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-background-tertiary focus:bg-background-tertiary focus:outline-none ${
                item.className || 'text-foreground'
              }`}
              role="menuitem"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.shortcut && (
                  <span className="text-xs text-foreground-muted">{item.shortcut}</span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Selection info footer */}
      {selectionStats.count > 1 && (
        <div className="border-t border-border bg-background-tertiary px-3 py-2 text-xs text-foreground-muted">
          <FormattedMessage
            id="fileBrowser.contextMenu.selection"
            values={{
              count: selectionStats.count,
              size: selectionStats.totalSize,
            }}
          />
        </div>
      )}
    </div>
  )
}