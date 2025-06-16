'use client'

import Link from 'next/link'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth.store'
import { format } from 'date-fns'
import { useIntl, FormattedMessage } from '@/lib/i18n'

interface AuditLog {
  id: string
  user_id: string
  action: string
  resource_type: string
  resource_id: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

export default function AccountAuditLogsPage() {
  const intl = useIntl()
  const { user } = useAuthStore()
  const datePickerRef = useRef<HTMLDivElement>(null)
  const filterPickerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showFilterPicker, setShowFilterPicker] = useState(false)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    end: new Date(),
  })

  // Action mapping for better performance
  const ACTION_MAP: Record<string, string> = useMemo(
    () => ({
      'user.signup': intl.formatMessage({ id: 'audit.action.userSignup' }),
      'user.login': intl.formatMessage({ id: 'audit.action.userLogin' }),
      'user.logout': intl.formatMessage({ id: 'audit.action.userLogout' }),
      'user.password_updated': intl.formatMessage({ id: 'audit.action.passwordUpdated' }),
      'user.email_updated': intl.formatMessage({ id: 'audit.action.emailUpdated' }),
      'user.profile_updated': intl.formatMessage({ id: 'audit.action.profileUpdated' }),
      'organization.created': intl.formatMessage({ id: 'audit.action.organizationCreated' }),
      'organization.updated': intl.formatMessage({ id: 'audit.action.organizationUpdated' }),
      'organization.deleted': intl.formatMessage({ id: 'audit.action.organizationDeleted' }),
      'organization.member_added': intl.formatMessage({ id: 'audit.action.memberAdded' }),
      'organization.member_removed': intl.formatMessage({ id: 'audit.action.memberRemoved' }),
      'project.created': intl.formatMessage({ id: 'audit.action.projectCreated' }),
      'project.updated': intl.formatMessage({ id: 'audit.action.projectUpdated' }),
      'project.deleted': intl.formatMessage({ id: 'audit.action.projectDeleted' }),
      'ssh_key.created': intl.formatMessage({ id: 'audit.action.sshKeyCreated' }),
      'ssh_key.deleted': intl.formatMessage({ id: 'audit.action.sshKeyDeleted' }),
    }),
    []
  )

  // Filter options
  const FILTER_OPTIONS = useMemo(
    () => [
      { value: 'all', label: intl.formatMessage({ id: 'audit.filter.allTypes' }), icon: 'all' },
      { value: 'user', label: intl.formatMessage({ id: 'audit.filter.account' }), icon: 'user' },
      {
        value: 'organization',
        label: intl.formatMessage({ id: 'audit.filter.organizations' }),
        icon: 'organization',
      },
      {
        value: 'project',
        label: intl.formatMessage({ id: 'audit.filter.projects' }),
        icon: 'project',
      },
    ],
    []
  )

  // Memoized getters
  const getActionDisplay = useCallback(
    (action: string): string => {
      return ACTION_MAP[action] || action
    },
    [ACTION_MAP]
  )

  const getResourceTypeIcon = useCallback((resourceType: string) => {
    switch (resourceType) {
      case 'user':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        )
      case 'organization':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        )
      case 'project':
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        )
      default:
        return (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        )
    }
  }, [])

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false)
      }
      if (filterPickerRef.current && !filterPickerRef.current.contains(event.target as Node)) {
        setShowFilterPicker(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Consolidated fetch function
  const fetchLogs = useCallback(async () => {
    if (!user) return

    // Cancel any ongoing requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    try {
      setIsLoading(true)
      const supabase = createClient()

      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
        .order('created_at', { ascending: false })
        .limit(50)

      if (filterType !== 'all') {
        query = query.eq('resource_type', filterType)
      }

      const { data, error } = await query

      if (!abortControllerRef.current?.signal.aborted) {
        if (error) throw error
        setLogs(data || [])
        setIsLoading(false)
      }
    } catch (error) {
      if (!abortControllerRef.current?.signal.aborted) {
        console.error('Failed to fetch audit logs:', error)
        setIsLoading(false)
      }
    }
  }, [user, filterType, dateRange])

  // Fetch logs on filter changes with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchLogs()
    }, 300) // 300ms debounce

    return () => {
      clearTimeout(timeoutId)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchLogs])

  const formatDateRange = useMemo(() => {
    const start = format(dateRange.start, 'dd MMM')
    const end = format(dateRange.end, 'dd MMM')
    return `${start} - ${end}`
  }, [dateRange])

  const handleDateChange = useCallback((type: 'start' | 'end', date: string) => {
    setDateRange((prev) => ({
      ...prev,
      [type]: new Date(date),
    }))
  }, [])

  const presetDateRanges = useMemo(
    () => [
      { label: intl.formatMessage({ id: 'audit.dateRange.last7Days' }), days: 7 },
      { label: intl.formatMessage({ id: 'audit.dateRange.last30Days' }), days: 30 },
      { label: intl.formatMessage({ id: 'audit.dateRange.last90Days' }), days: 90 },
    ],
    []
  )

  const applyPresetRange = useCallback((days: number) => {
    setDateRange({
      start: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      end: new Date(),
    })
    setShowDatePicker(false)
  }, [])

  const handleFilterSelect = useCallback((value: string) => {
    setFilterType(value)
    setShowFilterPicker(false)
  }, [])

  // Get current filter label
  const currentFilterLabel = useMemo(() => {
    return (
      FILTER_OPTIONS.find((option) => option.value === filterType)?.label ||
      intl.formatMessage({ id: 'audit.filter.allTypes' })
    )
  }, [filterType, FILTER_OPTIONS, intl])

  if (isLoading && logs.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <svg
            className="mx-auto mb-4 h-8 w-8 animate-spin text-terminal-green"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-foreground-muted">
            <FormattedMessage id="audit.loading" />
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-16">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">
            <FormattedMessage id="account.settings.title" />
          </h1>
          <p className="mt-2 text-foreground-muted">
            <FormattedMessage id="account.settings.subtitle" />
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 flex justify-center gap-6 border-b border-border">
          <Link
            href="/account/settings"
            className="pb-3 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
          >
            <FormattedMessage id="account.settings.tabs.settings" />
          </Link>
          <Link
            href="/account/audit"
            className="border-b-2 border-terminal-green pb-3 text-sm font-medium text-foreground"
          >
            <FormattedMessage id="account.settings.tabs.audit" />
          </Link>
        </div>

        <div>
          {/* Main Content */}
          <div>
            {/* Filters Bar */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-foreground-muted">
                  <FormattedMessage id="audit.filterBy" />
                </span>

                {/* Resource Type Filter - Custom Dropdown */}
                <div className="relative" ref={filterPickerRef}>
                  <button
                    onClick={() => setShowFilterPicker(!showFilterPicker)}
                    className="flex items-center gap-2 rounded-lg border border-border bg-background-secondary px-3 py-1.5 text-sm transition-colors hover:bg-background-tertiary"
                  >
                    <span className="text-foreground">{currentFilterLabel}</span>
                    <svg
                      className={`h-4 w-4 text-foreground-muted transition-transform ${
                        showFilterPicker ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Filter Picker Dropdown */}
                  {showFilterPicker && (
                    <div className="absolute left-0 top-full z-50 mt-2 w-48 rounded-lg border border-border bg-background-secondary shadow-lg">
                      <div className="py-1">
                        {FILTER_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleFilterSelect(option.value)}
                            className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-background-tertiary ${
                              filterType === option.value
                                ? 'bg-background-tertiary text-terminal-green'
                                : 'text-foreground'
                            }`}
                          >
                            {option.icon && (
                              <div className="flex h-5 w-5 items-center justify-center text-foreground-muted">
                                {getResourceTypeIcon(option.icon)}
                              </div>
                            )}
                            <span className={option.icon ? '' : 'ml-8'}>{option.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Date Range */}
                <div className="relative" ref={datePickerRef}>
                  <button
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="flex items-center gap-2 rounded-lg border border-border bg-background-secondary px-3 py-1.5 text-sm transition-colors hover:bg-background-tertiary"
                  >
                    <svg
                      className="h-4 w-4 text-foreground-muted"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-foreground">{formatDateRange}</span>
                    <svg
                      className={`h-4 w-4 text-foreground-muted transition-transform ${
                        showDatePicker ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Date Picker Dropdown */}
                  {showDatePicker && (
                    <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-lg border border-border bg-background-secondary p-4 shadow-lg">
                      <div className="mb-4">
                        <h4 className="mb-3 text-sm font-medium text-foreground">
                          <FormattedMessage id="audit.dateRange.quickSelect" />
                        </h4>
                        <div className="flex gap-2">
                          {presetDateRanges.map((preset) => (
                            <button
                              key={preset.days}
                              onClick={() => applyPresetRange(preset.days)}
                              className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-background-tertiary"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-xs text-foreground-muted">
                            <FormattedMessage id="audit.dateRange.startDate" />
                          </label>
                          <input
                            type="date"
                            value={format(dateRange.start, 'yyyy-MM-dd')}
                            onChange={(e) => handleDateChange('start', e.target.value)}
                            max={format(dateRange.end, 'yyyy-MM-dd')}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-terminal-green focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs text-foreground-muted">
                            <FormattedMessage id="audit.dateRange.endDate" />
                          </label>
                          <input
                            type="date"
                            value={format(dateRange.end, 'yyyy-MM-dd')}
                            onChange={(e) => handleDateChange('end', e.target.value)}
                            min={format(dateRange.start, 'yyyy-MM-dd')}
                            max={format(new Date(), 'yyyy-MM-dd')}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-terminal-green focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end gap-2">
                        <button
                          onClick={() => setShowDatePicker(false)}
                          className="rounded-md px-3 py-1.5 text-sm text-foreground-muted hover:text-foreground"
                        >
                          <FormattedMessage id="common.cancel" />
                        </button>
                        <button
                          onClick={() => setShowDatePicker(false)}
                          className="rounded-md bg-terminal-green px-3 py-1.5 text-sm text-black hover:bg-terminal-green/90"
                        >
                          <FormattedMessage id="common.apply" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={fetchLogs}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-lg border border-border bg-background-secondary px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-background-tertiary disabled:opacity-50"
              >
                <svg
                  className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {isLoading ? (
                  <FormattedMessage id="audit.refreshing" />
                ) : (
                  <FormattedMessage id="audit.refresh" />
                )}
              </button>
            </div>

            {/* Audit Logs Table */}
            <div className="rounded-lg border border-border bg-background-secondary">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-4 text-left text-sm font-medium text-foreground-muted">
                      <FormattedMessage id="audit.table.action" />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-foreground-muted">
                      <FormattedMessage id="audit.table.target" />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-foreground-muted">
                      <div className="flex items-center gap-1">
                        <FormattedMessage id="audit.table.date" />
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-foreground-muted">
                      {/* Actions column */}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-foreground-muted">
                        <FormattedMessage id="audit.noLogs" />
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr
                        key={log.id}
                        className={`border-b border-border transition-colors last:border-0 ${
                          selectedLog?.id === log.id ? 'bg-background-tertiary' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background-tertiary text-foreground-muted">
                              {getResourceTypeIcon(log.resource_type)}
                            </div>
                            <span className="text-sm text-foreground">
                              {getActionDisplay(log.action)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-foreground-muted">
                            {log.resource_id || '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-foreground-muted">
                            {format(new Date(log.created_at), 'dd MMM HH:mm:ss')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            className="text-sm text-foreground-muted transition-colors hover:text-foreground"
                            onClick={() => setSelectedLog(log)}
                          >
                            <FormattedMessage id="audit.viewDetails" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Table Footer */}
              {logs.length > 0 && (
                <div className="border-t border-border px-6 py-3">
                  <p className="text-sm text-foreground-muted">
                    <FormattedMessage
                      id="audit.showingResults"
                      values={{ shown: logs.length, total: logs.length }}
                    />
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Details Panel - Fixed Overlay */}
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-[100] bg-black/50 transition-opacity duration-300 ${
              selectedLog ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            onClick={() => setSelectedLog(null)}
          />

          {/* Sliding Panel */}
          <div
            className={`fixed right-0 top-0 z-[101] h-full w-96 bg-background-secondary shadow-xl transition-transform duration-300 ease-out ${
              selectedLog ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            {selectedLog && (
              <>
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                  <h3 className="text-lg font-medium text-foreground">
                    <FormattedMessage id="audit.details.title" />
                  </h3>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="rounded-md p-1 text-foreground-muted transition-colors hover:bg-background-tertiary hover:text-foreground"
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

                <div className="h-full overflow-y-auto pb-20">
                  <div className="space-y-6 p-6">
                    {/* Action Details */}
                    <div>
                      <h4 className="mb-3 text-sm font-medium text-foreground">
                        <FormattedMessage id="audit.details.action" />
                      </h4>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background-tertiary text-foreground-muted">
                          {getResourceTypeIcon(selectedLog.resource_type)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {getActionDisplay(selectedLog.action)}
                          </p>
                          <p className="text-xs text-foreground-muted">{selectedLog.action}</p>
                        </div>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-foreground">
                        <FormattedMessage id="audit.details.timestamp" />
                      </h4>
                      <p className="text-sm text-foreground-muted">
                        {format(new Date(selectedLog.created_at), 'PPpp')}
                      </p>
                    </div>

                    {/* Resource Details */}
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-foreground">
                        <FormattedMessage id="audit.details.resource" />
                      </h4>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="text-foreground-muted">
                            <FormattedMessage id="audit.details.type" />:
                          </span>{' '}
                          <span className="text-foreground">{selectedLog.resource_type}</span>
                        </p>
                        {selectedLog.resource_id && (
                          <p className="text-sm">
                            <span className="text-foreground-muted">
                              <FormattedMessage id="audit.details.id" />:
                            </span>{' '}
                            <span className="font-mono text-xs text-foreground">
                              {selectedLog.resource_id}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Session Details */}
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-foreground">
                        <FormattedMessage id="audit.details.sessionDetails" />
                      </h4>
                      <div className="space-y-2">
                        {selectedLog.ip_address && (
                          <div>
                            <p className="text-xs text-foreground-muted">
                              <FormattedMessage id="audit.details.ipAddress" />
                            </p>
                            <p className="font-mono text-sm text-foreground">
                              {selectedLog.ip_address}
                            </p>
                          </div>
                        )}
                        {selectedLog.user_agent && (
                          <div>
                            <p className="text-xs text-foreground-muted">
                              <FormattedMessage id="audit.details.userAgent" />
                            </p>
                            <p className="break-words text-sm text-foreground">
                              {selectedLog.user_agent}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Log ID */}
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-foreground">
                        <FormattedMessage id="audit.details.logId" />
                      </h4>
                      <p className="font-mono text-xs text-foreground-muted">{selectedLog.id}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      </div>
    </div>
  )
}
