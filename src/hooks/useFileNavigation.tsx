import { useState, useCallback, useEffect } from 'react'

export function useFileNavigation(initialPath: string = '/') {
  const [currentPath, setCurrentPath] = useState(initialPath)
  const [history, setHistory] = useState<string[]>([initialPath])
  const [historyIndex, setHistoryIndex] = useState(0)

  const navigate = useCallback(
    (path: string, addToHistory = true) => {
      setCurrentPath(path)

      if (addToHistory) {
        setHistory((prev) => {
          const newHistory = prev.slice(0, historyIndex + 1)
          newHistory.push(path)
          return newHistory
        })
        setHistoryIndex((prev) => prev + 1)
      }
    },
    [historyIndex]
  )

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setCurrentPath(history[newIndex])
    }
  }, [history, historyIndex])

  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setCurrentPath(history[newIndex])
    }
  }, [history, historyIndex])

  const goUp = useCallback(() => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/'
    navigate(parentPath)
  }, [currentPath, navigate])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          goBack()
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          goForward()
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          goUp()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goBack, goForward, goUp])

  return {
    currentPath,
    history,
    canGoBack: historyIndex > 0,
    canGoForward: historyIndex < history.length - 1,
    navigate,
    goBack,
    goForward,
    goUp,
  }
}
