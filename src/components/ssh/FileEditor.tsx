'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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

type FileType = 'text' | 'image' | 'video' | 'pdf' | 'binary'

export function FileEditor({ connectionId, file, sessionToken, onClose, onSave }: FileEditorProps) {
  const intl = useIntl()
  const [content, setContent] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [error, setError] = useState<ErrorState>({ type: 'none', message: '' })
  const [fileType, setFileType] = useState<FileType>('text')
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  

  const { toast } = useToast()
  const lastToastMessage = useRef<string>('')
  const mediaUrlRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Helper to determine file type
  const getFileType = (filename: string): FileType => {
    const ext = filename.split('.').pop()?.toLowerCase()

    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico']
    const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv']
    const textExtensions = [
      'txt',
      'md',
      'js',
      'jsx',
      'ts',
      'tsx',
      'json',
      'xml',
      'yaml',
      'yml',
      'css',
      'scss',
      'html',
      'py',
      'php',
      'java',
      'cpp',
      'c',
      'h',
      'hpp',
      'cs',
      'go',
      'rs',
      'rb',
      'swift',
      'kt',
      'scala',
      'sh',
      'bash',
      'zsh',
      'fish',
      'sql',
      'dockerfile',
      'gitignore',
      'env',
      'conf',
      'config',
      'ini',
      'toml',
      'log',
      'csv',
    ]

    if (imageExtensions.includes(ext || '')) return 'image'
    if (videoExtensions.includes(ext || '')) return 'video'
    if (ext === 'pdf') return 'pdf'
    if (textExtensions.includes(ext || '')) return 'text'

    // Check if filename has no extension but might be text
    if (!ext && filename.startsWith('.')) return 'text'

    return 'binary'
  }

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

  // Save file function
  const saveFile = useCallback(async () => {
    if (fileType !== 'text') return

    try {
      setIsSaving(true)
      const response = await fetch(`/api/connections/${connectionId}/files${file.path}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-session-token': sessionToken,
        },
        credentials: 'include',
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
      // Note: Removed onSave() call to keep user in the file editor after saving
    } catch (error: unknown) {
      showToast(intl.formatMessage({ id: 'fileEditor.error.networkSave' }))
    } finally {
      setIsSaving(false)
    }
  }, [
    fileType,
    connectionId,
    file.path,
    sessionToken,
    content,
    parseError,
    showToast,
    intl,
  ])

  // Add keyboard shortcut for saving (only for text files)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (hasChanges && !isSaving && error.type === 'none' && fileType === 'text') {
          saveFile()
        }
      }
    }

    if (fileType === 'text') {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [hasChanges, isSaving, error.type, fileType, saveFile])

  // Download file
  const downloadFile = async () => {
    try {
      setIsDownloading(true)

      const response = await fetch(
        `/api/connections/${connectionId}/files/download?path=${encodeURIComponent(file.path)}`,
        {
          headers: {
            'x-session-token': sessionToken,
          },
          credentials: 'include',
        }
      )

      if (!response.ok) {
        throw new Error(intl.formatMessage({ id: 'fileEditor.error.download' }))
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      showToast(intl.formatMessage({ id: 'fileEditor.download.success' }), 'success')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      showToast(errorMessage || intl.formatMessage({ id: 'fileEditor.error.download' }))
    } finally {
      setIsDownloading(false)
    }
  }


  // Create a stable reference for the file key
  const fileKey = `${connectionId}-${file.path}`
  const fileKeyRef = useRef(fileKey)
  
  useEffect(() => {
    // Only load if the file has actually changed
    if (fileKeyRef.current === fileKey) {
      return
    }
    fileKeyRef.current = fileKey

    const loadFile = async () => {
      console.log('Starting to load file:', file.path)
      try {
        setIsLoading(true)
        setError({ type: 'none', message: '' })
        setContent('')
        setMediaUrl(null)

        // Cancel any previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
        abortControllerRef.current = new AbortController()

        const type = getFileType(file.name)
        setFileType(type)
        console.log('File type determined:', type)

        if (type === 'text') {
          console.log('Loading text file...')
          const response = await fetch(`/api/connections/${connectionId}/files${file.path}`, {
            headers: {
              'x-session-token': sessionToken,
            },
            signal: abortControllerRef.current.signal,
          })

          if (!response.ok) {
            console.log('Response not ok:', response.status)
            let message = intl.formatMessage({ id: 'fileEditor.error.generic' })
            let errorType: ErrorState['type'] = 'unknown'

            try {
              const data = await response.json()
              message = data.error || data.message || message

              if (response.status === 403 || message.toLowerCase().includes('permission')) {
                errorType = 'permission'
                message = intl.formatMessage({ id: 'fileEditor.error.permissionDeniedRead' })
              } else if (response.status === 404 || message.toLowerCase().includes('not found')) {
                errorType = 'not_found'
                message = intl.formatMessage({ id: 'fileEditor.error.notFound' })
              }
            } catch {
              message = response.statusText || intl.formatMessage({ id: 'fileEditor.error.loadFile' })
            }

            setError({ type: errorType, message })
            return
          }

          const data = await response.text()
          console.log('Text file loaded, length:', data.length)
          setContent(data)
          setOriginalContent(data)
        } else if (type === 'image' || type === 'video' || type === 'pdf') {
          console.log('Loading media file...')
          // Clean up previous media URL if exists
          if (mediaUrlRef.current) {
            URL.revokeObjectURL(mediaUrlRef.current)
            mediaUrlRef.current = null
          }

          const response = await fetch(
            `/api/connections/${connectionId}/files/download?path=${encodeURIComponent(file.path)}`,
            {
              headers: {
                'x-session-token': sessionToken,
              },
              credentials: 'include',
              signal: abortControllerRef.current.signal,
            }
          )

          if (!response.ok) {
            console.log('Media response not ok:', response.status)
            let message = intl.formatMessage({ id: 'fileEditor.error.generic' })
            let errorType: ErrorState['type'] = 'unknown'

            try {
              const data = await response.json()
              message = data.error || data.message || message

              if (response.status === 403 || message.toLowerCase().includes('permission')) {
                errorType = 'permission'
                message = intl.formatMessage({ id: 'fileEditor.error.permissionDeniedRead' })
              } else if (response.status === 404 || message.toLowerCase().includes('not found')) {
                errorType = 'not_found'
                message = intl.formatMessage({ id: 'fileEditor.error.notFound' })
              }
            } catch {
              message = response.statusText || intl.formatMessage({ id: 'fileEditor.error.loadFile' })
            }

            setError({ type: errorType, message })
            return
          }

          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          mediaUrlRef.current = url
          setMediaUrl(url)
          console.log('Media file loaded')
        }
      } catch (error: any) {
        console.log('Error loading file:', error)
        if (error.name !== 'AbortError') {
          setError({
            type: 'network',
            message: intl.formatMessage({ id: 'fileEditor.error.network' }),
          })
          if (lastToastMessage.current !== intl.formatMessage({ id: 'fileEditor.error.network' })) {
            lastToastMessage.current = intl.formatMessage({ id: 'fileEditor.error.network' })
            toast.error(intl.formatMessage({ id: 'fileEditor.error.network' }))
            setTimeout(() => {
              lastToastMessage.current = ''
            }, 2000)
          }
        }
      } finally {
        console.log('Setting isLoading to false')
        setIsLoading(false)
      }
    }

    loadFile()

    // Cleanup function
    return () => {
      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Cleanup media URL on unmount
      if (mediaUrlRef.current) {
        URL.revokeObjectURL(mediaUrlRef.current)
        mediaUrlRef.current = null
      }
    }
  }, [fileKey]) // Only depend on the file key

  // Load initial file on mount
  useEffect(() => {
    const loadInitialFile = async () => {
      try {
        setIsLoading(true)
        setError({ type: 'none', message: '' })
        setContent('')
        setMediaUrl(null)

        const type = getFileType(file.name)
        setFileType(type)

        if (type === 'text') {
          const response = await fetch(`/api/connections/${connectionId}/files${file.path}`, {
            headers: {
              'x-session-token': sessionToken,
            },
          })

          if (!response.ok) {
            let message = intl.formatMessage({ id: 'fileEditor.error.generic' })
            let errorType: ErrorState['type'] = 'unknown'

            try {
              const data = await response.json()
              message = data.error || data.message || message

              if (response.status === 403 || message.toLowerCase().includes('permission')) {
                errorType = 'permission'
                message = intl.formatMessage({ id: 'fileEditor.error.permissionDeniedRead' })
              } else if (response.status === 404 || message.toLowerCase().includes('not found')) {
                errorType = 'not_found'
                message = intl.formatMessage({ id: 'fileEditor.error.notFound' })
              }
            } catch {
              message = response.statusText || intl.formatMessage({ id: 'fileEditor.error.loadFile' })
            }

            setError({ type: errorType, message })
            return
          }

          const data = await response.text()
          setContent(data)
          setOriginalContent(data)
        } else if (type === 'image' || type === 'video' || type === 'pdf') {
          const response = await fetch(
            `/api/connections/${connectionId}/files/download?path=${encodeURIComponent(file.path)}`,
            {
              headers: {
                'x-session-token': sessionToken,
              },
              credentials: 'include',
            }
          )

          if (!response.ok) {
            let message = intl.formatMessage({ id: 'fileEditor.error.generic' })
            let errorType: ErrorState['type'] = 'unknown'

            try {
              const data = await response.json()
              message = data.error || data.message || message

              if (response.status === 403 || message.toLowerCase().includes('permission')) {
                errorType = 'permission'
                message = intl.formatMessage({ id: 'fileEditor.error.permissionDeniedRead' })
              } else if (response.status === 404 || message.toLowerCase().includes('not found')) {
                errorType = 'not_found'
                message = intl.formatMessage({ id: 'fileEditor.error.notFound' })
              }
            } catch {
              message = response.statusText || intl.formatMessage({ id: 'fileEditor.error.loadFile' })
            }

            setError({ type: errorType, message })
            return
          }

          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          mediaUrlRef.current = url
          setMediaUrl(url)
        }
      } catch (error: any) {
        setError({
          type: 'network',
          message: intl.formatMessage({ id: 'fileEditor.error.network' }),
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialFile()
  }, []) // Only run on mount

  const handleClose = () => {
    if (fileType === 'text' && hasChanges) {
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
      <div className="flex h-full flex-col">
        {/* Header Skeleton */}
        <div className="border-b border-border bg-background-secondary px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-5 w-32 animate-pulse rounded bg-foreground-muted/20"></div>
              <div className="h-5 w-16 animate-pulse rounded bg-terminal-green/20"></div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-16 animate-pulse rounded bg-foreground-muted/20"></div>
              <div className="h-8 w-16 animate-pulse rounded bg-foreground-muted/20"></div>
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <div className="h-3 w-48 animate-pulse rounded bg-foreground-muted/20"></div>
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="flex-1 p-4">
          <div className="space-y-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-4 animate-pulse rounded bg-foreground-muted/10"
                style={{ width: `${Math.random() * 40 + 60}%` }}
              ></div>
            ))}
          </div>
        </div>

        {/* Status Bar Skeleton */}
        <div className="border-t border-border bg-background-secondary px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-3 w-20 animate-pulse rounded bg-foreground-muted/20"></div>
              <div className="h-3 w-24 animate-pulse rounded bg-foreground-muted/20"></div>
            </div>
          </div>
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
            {fileType === 'text' && hasChanges && (
              <span className="rounded bg-terminal-green/20 px-2 py-1 text-xs text-terminal-green">
                <FormattedMessage id="fileEditor.modified" />
              </span>
            )}
            {fileType !== 'text' && (
              <span className="rounded bg-terminal-blue/20 px-2 py-1 text-xs text-terminal-blue">
                <FormattedMessage id={`fileEditor.fileType.${fileType}`} />
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {fileType === 'text' ? (
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
            ) : (
              <button
                onClick={downloadFile}
                disabled={isDownloading}
                className="hover:bg-terminal-green-hover rounded-lg bg-terminal-green px-3 py-1.5 text-sm font-medium text-background transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDownloading ? (
                  <FormattedMessage id="fileEditor.downloading" />
                ) : (
                  <FormattedMessage id="fileEditor.download" />
                )}
              </button>
            )}
            <button
              onClick={handleClose}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background-secondary"
            >
              <FormattedMessage id="common.close" />
            </button>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-2 text-xs text-foreground-muted">
          <span>{file.path}</span>
          <span>•</span>
          <span>
            <FormattedMessage id="fileEditor.size" values={{ size: file.size.toLocaleString() }} />
          </span>
          {fileType === 'text' && (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="relative flex-1 overflow-auto">
        {fileType === 'text' ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="absolute inset-0 h-full w-full resize-none border-none bg-background p-4 font-mono text-sm text-foreground outline-none focus:outline-none"
            style={{ tabSize: 2 }}
            spellCheck={false}
            placeholder={intl.formatMessage({ id: 'fileEditor.placeholder' })}
          />
        ) : fileType === 'image' ? (
          <div className="flex h-full items-center justify-center p-8">
            {mediaUrl && (
              <img
                src={mediaUrl}
                alt={file.name}
                className="max-h-full max-w-full object-contain"
                style={{ imageRendering: 'high-quality' }}
              />
            )}
          </div>
        ) : fileType === 'video' ? (
          <div className="flex h-full items-center justify-center p-8">
            {mediaUrl && (
              <video
                src={mediaUrl}
                controls
                className="max-h-full max-w-full"
                style={{ backgroundColor: '#000' }}
              >
                <FormattedMessage id="fileEditor.video.unsupported" />
              </video>
            )}
          </div>
        ) : fileType === 'pdf' ? (
          <div className="flex h-full flex-col items-center justify-center p-8">
            <div className="mb-4 text-6xl">📄</div>
            <h3 className="mb-2 text-lg font-medium text-foreground">
              <FormattedMessage id="fileEditor.pdf.title" />
            </h3>
            <p className="mb-4 text-center text-foreground-muted">
              <FormattedMessage id="fileEditor.pdf.description" />
            </p>
            <button
              onClick={downloadFile}
              disabled={isDownloading}
              className="hover:bg-terminal-green-hover rounded-lg bg-terminal-green px-4 py-2 text-sm font-medium text-background transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDownloading ? (
                <FormattedMessage id="fileEditor.downloading" />
              ) : (
                <FormattedMessage id="fileEditor.pdf.downloadButton" />
              )}
            </button>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-8">
            <div className="mb-4 text-6xl">📦</div>
            <h3 className="mb-2 text-lg font-medium text-foreground">
              <FormattedMessage id="fileEditor.binary.title" />
            </h3>
            <p className="mb-4 text-center text-foreground-muted">
              <FormattedMessage
                id="fileEditor.binary.description"
                values={{ fileName: file.name }}
              />
            </p>
            <button
              onClick={downloadFile}
              disabled={isDownloading}
              className="hover:bg-terminal-green-hover rounded-lg bg-terminal-green px-4 py-2 text-sm font-medium text-background transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDownloading ? (
                <FormattedMessage id="fileEditor.downloading" />
              ) : (
                <FormattedMessage id="fileEditor.binary.downloadButton" />
              )}
            </button>
          </div>
        )}
      </div>

      {/* Status Bar */}
      {fileType === 'text' && (
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
      )}
    </div>
  )
}
