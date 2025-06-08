'use client'

import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/components/ui/ToastContext'
import { useIntl, FormattedMessage } from '@/lib/i18n'
import type { FileInfo } from '@/types/ssh'

interface FileEditorProps {
  connectionId: string
  file: FileInfo
  sessionToken: string
  onClose: () => void
  onSave: () => void
}

interface ErrorState {
  type: 'none' | 'permission' | 'not_found' | 'network' | 'unknown'
  message: string
}

export function FileEditor({ connectionId, file, sessionToken, onClose, onSave }: FileEditorProps) {
  const intl = useIntl()
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [error, setError] = useState<ErrorState>({ type: 'none', message: '' })

  const { toast } = useToast()
  const lastToastMessage = useRef<string>('')

  // Helper to show toast without duplicates
  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    if (lastToastMessage.current !== message) {
      lastToastMessage.current = message
      toast[type](message)
      setTimeout(() => {
        lastToastMessage.current = ''
      }, 2000)
    }
  }

  // Parse error response
  const parseError = async (response: Response): Promise<ErrorState> => {
    let message = intl.formatMessage({ id: 'fileEditor.error.generic' })
    let type: ErrorState['type'] = 'unknown'

    try {
      const data = await response.json()
      message = data.error || data.message || message

      if (response.status === 403 || message.toLowerCase().includes('permission')) {
        type = 'permission'
        message = intl.formatMessage({ id: 'fileEditor.error.permissionDeniedRead' })
      } else if (response.status === 404 || message.toLowerCase().includes('not found')) {
        type = 'not_found'
        message = intl.formatMessage({ id: 'fileEditor.error.notFound' })
      }
    } catch {
      message = response.statusText || intl.formatMessage({ id: 'fileEditor.error.loadFile' })
    }

    return { type, message }
  }

  useEffect(() => {
    setHasChanges(content !== originalContent)
  }, [content, originalContent])

  // Add keyboard shortcut for saving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (hasChanges && !isSaving && error.type === 'none') {
          saveFile()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasChanges, isSaving, error.type])

  const loadFileContent = async () => {
    try {
      setIsLoading(true)
      setError({ type: 'none', message: '' })

      const response = await fetch(`/api/connections/${connectionId}/files${file.path}`, {
        headers: {
          'x-session-token': sessionToken,
        },
      })

      if (!response.ok) {
        const errorState = await parseError(response)
        setError(errorState)
        return
      }

      const data = await response.text()
      setContent(data)
      setOriginalContent(data)
    } catch (error: any) {
      setError({
        type: 'network',
        message: intl.formatMessage({ id: 'fileEditor.error.network' }),
      })
      showToast(intl.formatMessage({ id: 'fileEditor.error.network' }))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFileContent()
  }, [])

  const saveFile = async () => {
    try {
      setIsSaving(true)
      const response = await fetch(`/api/connections/${connectionId}/files${file.path}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': sessionToken,
        },
        body: JSON.stringify({ content }),
      })

      if (!response.ok) {
        const errorState = await parseError(response)

        if (errorState.type === 'permission') {
          showToast(intl.formatMessage({ id: 'fileEditor.error.permissionDeniedWrite' }))
        } else {
          showToast(errorState.message)
        }
        return
      }

      setOriginalContent(content)
      showToast(intl.formatMessage({ id: 'fileEditor.save.success' }), 'success')
      onSave()
    } catch (error: any) {
      showToast(intl.formatMessage({ id: 'fileEditor.error.networkSave' }))
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (hasChanges) {
      if (confirm(intl.formatMessage({ id: 'fileEditor.unsavedChanges' }))) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  const getLanguageFromFilename = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase()
    const langMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      php: 'php',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      go: 'go',
      rs: 'rust',
      rb: 'ruby',
      swift: 'swift',
      kt: 'kotlin',
      scala: 'scala',
      sh: 'bash',
      bash: 'bash',
      zsh: 'bash',
      fish: 'bash',
      sql: 'sql',
      html: 'html',
      css: 'css',
      scss: 'scss',
      sass: 'sass',
      less: 'less',
      json: 'json',
      xml: 'xml',
      yaml: 'yaml',
      yml: 'yaml',
      toml: 'toml',
      ini: 'ini',
      conf: 'ini',
      config: 'ini',
      md: 'markdown',
      markdown: 'markdown',
      dockerfile: 'dockerfile',
    }
    return langMap[ext || ''] || 'text'
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-terminal-green border-t-transparent"></div>
          <p className="text-foreground-muted">
            <FormattedMessage id="fileEditor.loading" />
          </p>
        </div>
      </div>
    )
  }

  if (error.type === 'permission') {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">🔒</div>
          <h3 className="mb-2 text-lg font-medium text-foreground">
            <FormattedMessage id="fileEditor.permission.title" />
          </h3>
          <p className="mb-4 text-foreground-muted">
            <FormattedMessage
              id="fileEditor.permission.description"
              values={{ fileName: file.name }}
            />
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-background-secondary"
            >
              <FormattedMessage id="common.goBack" />
            </button>
            <button
              className="rounded-lg border border-terminal-green bg-terminal-green/10 px-4 py-2 text-sm font-medium text-terminal-green hover:bg-terminal-green/20"
              onClick={() => {
                showToast(
                  intl.formatMessage({ id: 'fileEditor.permission.requestAccessComingSoon' }),
                  'success'
                )
              }}
            >
              <FormattedMessage id="fileEditor.permission.requestAccess" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (error.type !== 'none') {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h3 className="mb-2 text-lg font-medium text-foreground">
            <FormattedMessage id="fileEditor.error.title" />
          </h3>
          <p className="mb-4 text-foreground-muted">{error.message}</p>
          <button
            onClick={onClose}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-background-secondary"
          >
            <FormattedMessage id="common.goBack" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-background-secondary px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-medium text-foreground">{file.name}</h2>
            {hasChanges && (
              <span className="rounded bg-terminal-green/20 px-2 py-1 text-xs text-terminal-green">
                <FormattedMessage id="fileEditor.modified" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={saveFile}
              disabled={!hasChanges || isSaving}
              className="hover:bg-terminal-green-hover rounded-lg bg-terminal-green px-3 py-1.5 text-sm font-medium text-background transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <FormattedMessage id="fileEditor.saving" />
              ) : (
                <FormattedMessage id="common.save" />
              )}
            </button>
            <button
              onClick={handleClose}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background-secondary"
            >
              <FormattedMessage id="common.close" />
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-4 text-xs text-foreground-muted">
          <span>{file.path}</span>
          <span>•</span>
          <span>
            <FormattedMessage id="fileEditor.size" values={{ size: file.size.toLocaleString() }} />
          </span>
          <span>•</span>
          <span>{getLanguageFromFilename(file.name)}</span>
          {hasChanges && (
            <>
              <span>•</span>
              <span className="text-terminal-green">
                <FormattedMessage id="fileEditor.shortcut.save" />
              </span>
            </>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="relative flex-1">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="absolute inset-0 h-full w-full resize-none border-none bg-background p-4 font-mono text-sm text-foreground outline-none focus:outline-none"
          style={{ tabSize: 2 }}
          spellCheck={false}
          placeholder={intl.formatMessage({ id: 'fileEditor.placeholder' })}
        />
      </div>

      {/* Status Bar */}
      <div className="border-t border-border bg-background-secondary px-4 py-2">
        <div className="flex items-center justify-between text-xs text-foreground-muted">
          <div className="flex items-center gap-4">
            <span>
              <FormattedMessage
                id="fileEditor.status.lines"
                values={{ count: content.split('\n').length }}
              />
            </span>
            <span>•</span>
            <span>
              <FormattedMessage
                id="fileEditor.status.characters"
                values={{ count: content.length }}
              />
            </span>
            {content !== originalContent && (
              <>
                <span>•</span>
                <span>
                  <FormattedMessage
                    id="fileEditor.status.changes"
                    values={{ count: Math.abs(content.length - originalContent.length) }}
                  />
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-terminal-green">
                <FormattedMessage id="fileEditor.status.unsavedChanges" />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
