import { useState, useCallback, useMemo } from 'react'
import type { FileInfo } from '@/types/ssh'

export function useFileSelection(files: FileInfo[]) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())

  const handleFileSelect = useCallback((filePath: string, isSelected: boolean) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev)
      if (isSelected) {
        newSet.add(filePath)
      } else {
        newSet.delete(filePath)
      }
      return newSet
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedFiles(new Set())
  }, [])

  const selectAll = useCallback(() => {
    setSelectedFiles(new Set(files.map((f) => f.path)))
  }, [files])

  const toggleSelection = useCallback((filePath: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(filePath)) {
        newSet.delete(filePath)
      } else {
        newSet.add(filePath)
      }
      return newSet
    })
  }, [])

  const selectedItems = useMemo(() => {
    return Array.from(selectedFiles)
      .map((path) => files.find((f) => f.path === path))
      .filter((f): f is FileInfo => f !== undefined)
  }, [selectedFiles, files])

  const selectionStats = useMemo(() => {
    const items = selectedItems
    return {
      count: items.length,
      totalSize: items.reduce((sum, f) => sum + (f.type === 'file' ? f.size : 0), 0),
      hasFiles: items.some((f) => f.type === 'file'),
      hasDirectories: items.some((f) => f.type === 'directory'),
      allFiles: items.every((f) => f.type === 'file'),
      allDirectories: items.every((f) => f.type === 'directory'),
    }
  }, [selectedItems])

  return {
    selectedFiles,
    selectedItems,
    selectionStats,
    handleFileSelect,
    clearSelection,
    selectAll,
    toggleSelection,
  }
}
