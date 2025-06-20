'use client'

import { useState, useEffect, useRef } from 'react'
import { useIntl, FormattedMessage } from '@/lib/i18n'
import { useToast } from '@/components/ui/ToastContext'
import type { FileInfo } from '@/types/ssh'

interface FilePermissionsModalProps {
  file: FileInfo | null
  connectionId: string
  sessionToken: string
  onClose: () => void
  onSuccess?: () => void
}

interface PermissionSet {
  read: boolean
  write: boolean
  execute: boolean
}

export function FilePermissionsModal({
  file,
  connectionId,
  sessionToken,
  onClose,
  onSuccess,
}: FilePermissionsModalProps) {
  const intl = useIntl()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Parse current permissions from the file
  const parsePermissions = (
    permissions: string
  ): { owner: PermissionSet; group: PermissionSet; other: PermissionSet } => {
    if (!permissions || permissions.length !== 9) {
      return {
        owner: { read: true, write: true, execute: false },
        group: { read: true, write: false, execute: false },
        other: { read: true, write: false, execute: false },
      }
    }

    const parseSet = (perms: string): PermissionSet => ({
      read: perms[0] === 'r',
      write: perms[1] === 'w',
      execute: perms[2] === 'x',
    })

    return {
      owner: parseSet(permissions.slice(0, 3)),
      group: parseSet(permissions.slice(3, 6)),
      other: parseSet(permissions.slice(6, 9)),
    }
  }

  const [permissions, setPermissions] = useState(() =>
    file
      ? parsePermissions(file.permissions)
      : {
          owner: { read: true, write: true, execute: false },
          group: { read: true, write: false, execute: false },
          other: { read: true, write: false, execute: false },
        }
  )

  const [octalMode, setOctalMode] = useState('')

  // Calculate octal representation
  const calculateOctal = (perms: typeof permissions): string => {
    const setToOctal = (set: PermissionSet): number => {
      return (set.read ? 4 : 0) + (set.write ? 2 : 0) + (set.execute ? 1 : 0)
    }

    return `${setToOctal(perms.owner)}${setToOctal(perms.group)}${setToOctal(perms.other)}`
  }

  // Update octal mode when permissions change
  useEffect(() => {
    setOctalMode(calculateOctal(permissions))
  }, [permissions, calculateOctal])

  // Focus management and keyboard handling
  useEffect(() => {
    if (file) {
      // Store current focus
      previousActiveElement.current = document.activeElement as HTMLElement

      // Focus modal
      modalRef.current?.focus()

      // Handle keyboard events
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isSaving) {
          onClose()
        }

        // Trap focus within modal
        if (e.key === 'Tab') {
          const focusableElements = modalRef.current?.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )

          if (!focusableElements || focusableElements.length === 0) return

          const firstElement = focusableElements[0] as HTMLElement
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault()
            lastElement.focus()
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault()
            firstElement.focus()
          }
        }
      }

      document.addEventListener('keydown', handleKeyDown)

      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        // Restore focus
        previousActiveElement.current?.focus()
      }
    }
  }, [file, isSaving, onClose])

  // Parse octal input
  const handleOctalChange = (value: string) => {
    // Only allow digits 0-7
    const cleanValue = value.replace(/[^0-7]/g, '').slice(0, 3)
    setOctalMode(cleanValue)

    if (cleanValue.length === 3) {
      const octalToSet = (digit: string): PermissionSet => {
        const num = parseInt(digit, 10)
        return {
          read: (num & 4) !== 0,
          write: (num & 2) !== 0,
          execute: (num & 1) !== 0,
        }
      }

      setPermissions({
        owner: octalToSet(cleanValue[0]),
        group: octalToSet(cleanValue[1]),
        other: octalToSet(cleanValue[2]),
      })
    }
  }

  const handlePermissionChange = (
    role: 'owner' | 'group' | 'other',
    type: 'read' | 'write' | 'execute',
    value: boolean
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [type]: value,
      },
    }))
  }

  const handleSave = async () => {
    if (!file || octalMode.length !== 3) return

    setIsSaving(true)
    try {
      const response = await fetch(`/api/connections/${connectionId}/files/chmod`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': sessionToken,
        },
        body: JSON.stringify({
          path: file.path,
          mode: octalMode,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || intl.formatMessage({ id: 'filePermissions.error' }))
      }

      toast.success(intl.formatMessage({ id: 'filePermissions.success' }))
      onSuccess?.()
      onClose()
    } catch (error: any) {
      toast.error(error.message || intl.formatMessage({ id: 'filePermissions.error' }))
    } finally {
      setIsSaving(false)
    }
  }

  const announceChange = (message: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('role', 'status')
    announcement.setAttribute('aria-live', 'polite')
    announcement.className = 'sr-only'
    announcement.textContent = message
    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 1000)
  }

  if (!file) return null

  const PermissionCheckbox = ({
    role,
    type,
    checked,
    onChange,
  }: {
    role: string
    type: string
    checked: boolean
    onChange: (value: boolean) => void
  }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => {
        onChange(e.target.checked)
        announceChange(`${role} ${type} permission ${e.target.checked ? 'granted' : 'removed'}`)
      }}
      disabled={isSaving}
      className="rounded border-border bg-background text-terminal-green focus:ring-terminal-green disabled:opacity-50"
      aria-label={`${role} ${type} permission`}
    />
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="permissions-modal-title"
    >
      <div
        ref={modalRef}
        className="w-full max-w-2xl rounded-lg bg-background-secondary shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        {/* Header */}
        <div className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 id="permissions-modal-title" className="text-lg font-semibold text-foreground">
              <FormattedMessage id="filePermissions.title" />
            </h2>
            <button
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg p-1 text-foreground-muted hover:bg-background hover:text-foreground disabled:opacity-50"
              aria-label={intl.formatMessage({ id: 'common.close' })}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-sm text-foreground-muted">
            <FormattedMessage id="filePermissions.subtitle" values={{ filename: file.name }} />
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current permissions display */}
          <div className="mb-6 rounded-lg bg-background p-4">
            <p className="mb-2 text-xs font-medium uppercase text-foreground-muted">
              <FormattedMessage id="filePermissions.current" />
            </p>
            <div className="flex items-center gap-4">
              <code className="font-mono text-lg text-terminal-green">
                {file.type === 'directory' ? 'd' : '-'}
                {file.permissions}
              </code>
              <span className="text-sm text-foreground-muted">({octalMode})</span>
            </div>
          </div>

          {/* Permission matrix */}
          <div className="mb-6">
            <table className="w-full" role="table">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="pb-3 text-left text-sm font-medium text-foreground">
                    <FormattedMessage id="filePermissions.role" />
                  </th>
                  <th scope="col" className="pb-3 text-center text-sm font-medium text-foreground">
                    <FormattedMessage id="filePermissions.read" />
                  </th>
                  <th scope="col" className="pb-3 text-center text-sm font-medium text-foreground">
                    <FormattedMessage id="filePermissions.write" />
                  </th>
                  <th scope="col" className="pb-3 text-center text-sm font-medium text-foreground">
                    <FormattedMessage id="filePermissions.execute" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-3 text-sm font-medium text-foreground">
                    <FormattedMessage id="filePermissions.owner" />
                  </td>
                  <td className="py-3 text-center">
                    <PermissionCheckbox
                      role="owner"
                      type="read"
                      checked={permissions.owner.read}
                      onChange={(value) => handlePermissionChange('owner', 'read', value)}
                    />
                  </td>
                  <td className="py-3 text-center">
                    <PermissionCheckbox
                      role="owner"
                      type="write"
                      checked={permissions.owner.write}
                      onChange={(value) => handlePermissionChange('owner', 'write', value)}
                    />
                  </td>
                  <td className="py-3 text-center">
                    <PermissionCheckbox
                      role="owner"
                      type="execute"
                      checked={permissions.owner.execute}
                      onChange={(value) => handlePermissionChange('owner', 'execute', value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-sm font-medium text-foreground">
                    <FormattedMessage id="filePermissions.group" />
                  </td>
                  <td className="py-3 text-center">
                    <PermissionCheckbox
                      role="group"
                      type="read"
                      checked={permissions.group.read}
                      onChange={(value) => handlePermissionChange('group', 'read', value)}
                    />
                  </td>
                  <td className="py-3 text-center">
                    <PermissionCheckbox
                      role="group"
                      type="write"
                      checked={permissions.group.write}
                      onChange={(value) => handlePermissionChange('group', 'write', value)}
                    />
                  </td>
                  <td className="py-3 text-center">
                    <PermissionCheckbox
                      role="group"
                      type="execute"
                      checked={permissions.group.execute}
                      onChange={(value) => handlePermissionChange('group', 'execute', value)}
                    />
                  </td>
                </tr>
                <tr>
                  <td className="py-3 text-sm font-medium text-foreground">
                    <FormattedMessage id="filePermissions.other" />
                  </td>
                  <td className="py-3 text-center">
                    <PermissionCheckbox
                      role="other"
                      type="read"
                      checked={permissions.other.read}
                      onChange={(value) => handlePermissionChange('other', 'read', value)}
                    />
                  </td>
                  <td className="py-3 text-center">
                    <PermissionCheckbox
                      role="other"
                      type="write"
                      checked={permissions.other.write}
                      onChange={(value) => handlePermissionChange('other', 'write', value)}
                    />
                  </td>
                  <td className="py-3 text-center">
                    <PermissionCheckbox
                      role="other"
                      type="execute"
                      checked={permissions.other.execute}
                      onChange={(value) => handlePermissionChange('other', 'execute', value)}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Octal input */}
          <div className="mb-6">
            <label htmlFor="octal-mode" className="mb-2 block text-sm font-medium text-foreground">
              <FormattedMessage id="filePermissions.octalMode" />
            </label>
            <input
              id="octal-mode"
              type="text"
              value={octalMode}
              onChange={(e) => handleOctalChange(e.target.value)}
              maxLength={3}
              pattern="[0-7]{3}"
              className="w-32 rounded-lg border border-border bg-background px-4 py-2 font-mono text-foreground focus:border-terminal-green focus:outline-none focus:ring-1 focus:ring-terminal-green"
              placeholder="755"
              disabled={isSaving}
              aria-describedby="octal-hint"
            />
            <p id="octal-hint" className="mt-2 text-sm text-foreground-muted">
              <FormattedMessage id="filePermissions.octalHint" />
            </p>
          </div>

          {/* Common presets */}
          <div>
            <p className="mb-2 text-sm font-medium text-foreground">
              <FormattedMessage id="filePermissions.presets" />
            </p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Permission presets">
              <button
                onClick={() => handleOctalChange('755')}
                disabled={isSaving}
                className="rounded bg-background px-3 py-1 text-sm text-foreground hover:bg-background-tertiary disabled:opacity-50"
                aria-label="Set permissions to 755"
              >
                755 - <FormattedMessage id="filePermissions.preset755" />
              </button>
              <button
                onClick={() => handleOctalChange('644')}
                disabled={isSaving}
                className="rounded bg-background px-3 py-1 text-sm text-foreground hover:bg-background-tertiary disabled:opacity-50"
                aria-label="Set permissions to 644"
              >
                644 - <FormattedMessage id="filePermissions.preset644" />
              </button>
              <button
                onClick={() => handleOctalChange('700')}
                disabled={isSaving}
                className="rounded bg-background px-3 py-1 text-sm text-foreground hover:bg-background-tertiary disabled:opacity-50"
                aria-label="Set permissions to 700"
              >
                700 - <FormattedMessage id="filePermissions.preset700" />
              </button>
              <button
                onClick={() => handleOctalChange('777')}
                disabled={isSaving}
                className="rounded bg-background px-3 py-1 text-sm text-foreground hover:bg-background-tertiary disabled:opacity-50"
                aria-label="Set permissions to 777"
              >
                777 - <FormattedMessage id="filePermissions.preset777" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-background-secondary disabled:opacity-50"
            >
              <FormattedMessage id="common.cancel" />
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || octalMode.length !== 3}
              className="rounded-lg bg-terminal-green px-4 py-2 text-sm font-medium text-background hover:bg-terminal-green/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <FormattedMessage id="common.saving" />
              ) : (
                <FormattedMessage id="common.save" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
