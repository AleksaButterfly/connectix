import { useState, useCallback, useMemo } from 'react'
import type { FileInfo } from '@/types/ssh'

export type ClipboardOperation = 'copy' | 'cut'

interface ClipboardItem {
  files: FileInfo[]
  operation: ClipboardOperation
  timestamp: number
}

export function useClipboard() {
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null)

  const copyFiles = useCallback((files: FileInfo[]) => {
    setClipboard({
      files,
      operation: 'copy',
      timestamp: Date.now(),
    })
  }, [])

  const cutFiles = useCallback((files: FileInfo[]) => {
    setClipboard({
      files,
      operation: 'cut',
      timestamp: Date.now(),
    })
  }, [])

  const clearClipboard = useCallback(() => {
    setClipboard(null)
  }, [])

  const hasClipboard = useMemo(() => {
    return clipboard !== null && clipboard.files.length > 0
  }, [clipboard])

  const clipboardInfo = useMemo(() => {
    if (!clipboard) return null

    return {
      count: clipboard.files.length,
      operation: clipboard.operation,
      files: clipboard.files,
      isCut: clipboard.operation === 'cut',
      isCopy: clipboard.operation === 'copy',
    }
  }, [clipboard])

  return {
    clipboard,
    clipboardInfo,
    hasClipboard,
    copyFiles,
    cutFiles,
    clearClipboard,
  }
}