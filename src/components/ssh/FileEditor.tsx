'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/ToastContext'
import type { FileInfo } from '@/types/ssh'

interface FileEditorProps {
  connectionId: string
  file: FileInfo
  sessionToken: string
  onClose: () => void
  onSave: () => void
}

export function FileEditor({ connectionId, file, sessionToken, onClose, onSave }: FileEditorProps) {
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadFileContent()
  }, [])

  useEffect(() => {
    setHasChanges(content !== originalContent)
  }, [content, originalContent])

  const loadFileContent = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/connections/${connectionId}/files${file.path}`, {
        headers: {
          'x-session-token': sessionToken,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load file content')
      }

      const data = await response.text()
      setContent(data)
      setOriginalContent(data)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load file')
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

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
        throw new Error('Failed to save file')
      }

      setOriginalContent(content)
      toast.success('File saved successfully')
      onSave()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save file')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close?')) {
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
          <p className="text-foreground-muted">Loading file...</p>
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
                Modified
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={saveFile}
              disabled={!hasChanges || isSaving}
              className="hover:bg-terminal-green-hover rounded-lg bg-terminal-green px-3 py-1.5 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleClose}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background-secondary"
            >
              Close
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-4 text-xs text-foreground-muted">
          <span>{file.path}</span>
          <span>Size: {file.size} bytes</span>
          <span>Language: {getLanguageFromFilename(file.name)}</span>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="h-full w-full resize-none border-none bg-background p-4 font-mono text-sm text-foreground focus:outline-none"
          style={{ tabSize: 2 }}
          spellCheck={false}
        />
      </div>

      {/* Status Bar */}
      <div className="border-t border-border bg-background-secondary px-4 py-2">
        <div className="flex items-center justify-between text-xs text-foreground-muted">
          <div className="flex items-center gap-4">
            <span>Lines: {content.split('\n').length}</span>
            <span>Characters: {content.length}</span>
          </div>

          <div className="flex items-center gap-2">
            <span>Ctrl+S to save</span>
            {hasChanges && <span className="text-terminal-green">●</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
