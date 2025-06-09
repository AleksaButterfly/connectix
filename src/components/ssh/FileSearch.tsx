'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useIntl, FormattedMessage } from '@/lib/i18n'
import { useToast } from '@/components/ui/ToastContext'
import { formatFileSize, getFileIcon } from '@/lib/utils/file'
import debounce from 'lodash/debounce'

interface FileSearchProps {
  connectionId: string
  sessionToken: string
  currentPath: string
  onFileSelect?: (file: { path: string; name: string; type: string }) => void
  className?: string
}

export function FileSearch({
  connectionId,
  sessionToken,
  currentPath,
  onFileSelect,
  className = '',
}: FileSearchProps) {
  const intl = useIntl()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchType, setSearchType] = useState<'all' | 'file' | 'directory'>('all')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [useRegex, setUseRegex] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Focus input when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Create memoized debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce(
        async (
          searchQuery: string,
          options: {
            connectionId: string
            sessionToken: string
            currentPath: string
            searchType: 'all' | 'file' | 'directory'
            caseSensitive: boolean
            useRegex: boolean
          }
        ) => {
          if (!searchQuery.trim()) {
            setResults([])
            setIsSearching(false)
            return
          }

          try {
            const response = await fetch(`/api/connections/${options.connectionId}/files/search`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-session-token': options.sessionToken,
              },
              body: JSON.stringify({
                query: searchQuery,
                path: options.currentPath,
                type: options.searchType,
                caseSensitive: options.caseSensitive,
                regex: options.useRegex,
                maxResults: 50,
              }),
            })

            if (!response.ok) {
              throw new Error('Search failed')
            }

            const data = await response.json()
            setResults(data.results || [])
          } catch (error: any) {
            console.error('Search error:', error)
            setResults([])
            // Don't show toast here - it can cause infinite loops
          } finally {
            setIsSearching(false)
          }
        },
        300
      ),
    [] // Empty deps - function never changes
  )

  // Handle search
  useEffect(() => {
    // Don't search if dropdown is closed
    if (!isOpen) return

    if (query.trim()) {
      setIsSearching(true)
      debouncedSearch(query, {
        connectionId,
        sessionToken,
        currentPath,
        searchType,
        caseSensitive,
        useRegex,
      })
    } else {
      debouncedSearch.cancel()
      setResults([])
      setIsSearching(false)
    }

    // Cleanup
    return () => {
      debouncedSearch.cancel()
    }
  }, [
    query,
    isOpen,
    connectionId,
    sessionToken,
    currentPath,
    searchType,
    caseSensitive,
    useRegex,
    debouncedSearch,
  ])

  const handleClose = () => {
    setIsOpen(false)
    setQuery('')
    setResults([])
    setIsSearching(false)
    debouncedSearch.cancel()
  }

  const handleResultClick = (result: any) => {
    if (onFileSelect) {
      onFileSelect(result)
      handleClose()
    }
  }

  const highlightMatch = (text: string, searchQuery: string) => {
    if (!searchQuery || useRegex) return text

    try {
      const parts = text.split(
        new RegExp(
          `(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`,
          caseSensitive ? 'g' : 'gi'
        )
      )
      return parts.map((part, i) =>
        part.toLowerCase() === searchQuery.toLowerCase() ? (
          <mark key={i} className="bg-terminal-yellow/30 text-foreground">
            {part}
          </mark>
        ) : (
          part
        )
      )
    } catch {
      return text
    }
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground hover:bg-background-secondary"
        title={intl.formatMessage({ id: 'fileSearch.button' })}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <span className="hidden sm:inline">
          <FormattedMessage id="fileSearch.button" />
        </span>
      </button>

      {/* Search Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-96 rounded-lg border border-border bg-background-secondary shadow-xl">
          {/* Search Input */}
          <div className="border-b border-border p-4">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={intl.formatMessage({ id: 'fileSearch.placeholder' })}
                className="w-full rounded-lg border border-border bg-background px-4 py-2 pr-10 text-foreground placeholder-foreground-muted focus:border-terminal-green focus:outline-none focus:ring-1 focus:ring-terminal-green"
              />
              {isSearching && (
                <div className="absolute right-3 top-2.5">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-terminal-green border-t-transparent"></div>
                </div>
              )}
            </div>

            {/* Search Options */}
            <div className="mt-3">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1 text-sm text-foreground-muted hover:text-foreground"
              >
                <svg
                  className={`h-3 w-3 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <FormattedMessage id="fileSearch.advancedOptions" />
              </button>

              {showAdvanced && (
                <div className="mt-3 space-y-3">
                  {/* File Type Filter */}
                  <div>
                    <label className="mb-1 block text-xs font-medium text-foreground-muted">
                      <FormattedMessage id="fileSearch.fileType" />
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSearchType('all')}
                        className={`rounded px-2 py-1 text-xs ${
                          searchType === 'all'
                            ? 'bg-terminal-green text-background'
                            : 'bg-background text-foreground hover:bg-background-tertiary'
                        }`}
                      >
                        <FormattedMessage id="fileSearch.typeAll" />
                      </button>
                      <button
                        onClick={() => setSearchType('file')}
                        className={`rounded px-2 py-1 text-xs ${
                          searchType === 'file'
                            ? 'bg-terminal-green text-background'
                            : 'bg-background text-foreground hover:bg-background-tertiary'
                        }`}
                      >
                        <FormattedMessage id="fileSearch.typeFiles" />
                      </button>
                      <button
                        onClick={() => setSearchType('directory')}
                        className={`rounded px-2 py-1 text-xs ${
                          searchType === 'directory'
                            ? 'bg-terminal-green text-background'
                            : 'bg-background text-foreground hover:bg-background-tertiary'
                        }`}
                      >
                        <FormattedMessage id="fileSearch.typeFolders" />
                      </button>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={caseSensitive}
                        onChange={(e) => setCaseSensitive(e.target.checked)}
                        className="rounded border-border bg-background text-terminal-green focus:ring-terminal-green"
                      />
                      <span className="text-xs text-foreground">
                        <FormattedMessage id="fileSearch.caseSensitive" />
                      </span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={useRegex}
                        onChange={(e) => setUseRegex(e.target.checked)}
                        className="rounded border-border bg-background text-terminal-green focus:ring-terminal-green"
                      />
                      <span className="text-xs text-foreground">
                        <FormattedMessage id="fileSearch.useRegex" />
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Current Path */}
            <div className="mt-3 text-xs text-foreground-muted">
              <FormattedMessage id="fileSearch.searchingIn" values={{ path: currentPath }} />
            </div>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {query && results.length === 0 && !isSearching && (
              <div className="p-8 text-center">
                <div className="mb-2 text-3xl opacity-50">🔍</div>
                <p className="text-sm text-foreground-muted">
                  <FormattedMessage id="fileSearch.noResults" />
                </p>
              </div>
            )}

            {results.length > 0 && (
              <div className="p-2">
                <p className="mb-2 px-2 text-xs text-foreground-muted">
                  <FormattedMessage
                    id="fileSearch.resultCount"
                    values={{ count: results.length }}
                  />
                </p>
                <div className="space-y-1">
                  {results.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleResultClick(result)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-background-tertiary"
                    >
                      <span className="text-lg">
                        {getFileIcon({ type: result.type || 'file', name: result.name })}
                      </span>
                      <div className="flex-1 overflow-hidden">
                        <div className="truncate text-sm font-medium text-foreground">
                          {highlightMatch(result.name, query)}
                        </div>
                        <div className="truncate text-xs text-foreground-muted">{result.path}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
