'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth.store'
import { format } from 'date-fns'

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

// Move date range outside component to prevent recreation
const INITIAL_DATE_RANGE = {
  start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
  end: new Date(),
}

export default function AccountAuditLogsPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterType, setFilterType] = useState<string>('all')
  const [hasInitialized, setHasInitialized] = useState(false)

  // Check auth and redirect if needed
  useEffect(() => {
    if (!user && !hasInitialized) {
      router.push('/login')
    }
    setHasInitialized(true)
  }, [user, hasInitialized, router])

  // Fetch logs only when we have a user and component is initialized
  useEffect(() => {
    // Skip if no user or already initializing
    if (!user || !hasInitialized) return

    let isCancelled = false

    const fetchLogs = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()

        let query = supabase
          .from('audit_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', INITIAL_DATE_RANGE.start.toISOString())
          .lte('created_at', INITIAL_DATE_RANGE.end.toISOString())
          .order('created_at', { ascending: false })
          .limit(50)

        if (filterType !== 'all') {
          query = query.eq('resource_type', filterType)
        }

        const { data, error } = await query

        if (!isCancelled) {
          if (error) throw error
          setLogs(data || [])
          setIsLoading(false)
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to fetch audit logs:', error)
          setIsLoading(false)
        }
      }
    }

    fetchLogs()

    // Cleanup function
    return () => {
      isCancelled = true
    }
  }, [user?.id, filterType, hasInitialized]) // Use specific user.id instead of whole object

  const fetchAuditLogs = async () => {
    if (!user) return

    try {
      const supabase = createClient()

      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', INITIAL_DATE_RANGE.start.toISOString())
        .lte('created_at', INITIAL_DATE_RANGE.end.toISOString())
        .order('created_at', { ascending: false })
        .limit(50)

      if (filterType !== 'all') {
        query = query.eq('resource_type', filterType)
      }

      const { data, error } = await query

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
    }
  }

  const getActionDisplay = (action: string): string => {
    const actionMap: Record<string, string> = {
      'user.signup': 'Account created',
      'user.login': 'Logged into account',
      'user.logout': 'Logged out',
      'user.password_updated': 'Updated password',
      'user.email_updated': 'Updated email',
      'user.profile_updated': 'Updated profile',
      'organization.created': 'Created organization',
      'organization.updated': 'Updated organization',
      'organization.deleted': 'Deleted organization',
      'organization.member_added': 'Added organization member',
      'organization.member_removed': 'Removed organization member',
      'project.created': 'Created project',
      'project.updated': 'Updated project',
      'project.deleted': 'Deleted project',
      'ssh_key.created': 'Added SSH key',
      'ssh_key.deleted': 'Removed SSH key',
    }
    return actionMap[action] || action
  }

  const getResourceTypeIcon = (resourceType: string) => {
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
  }

  const formatDateRange = () => {
    const start = format(INITIAL_DATE_RANGE.start, 'dd MMM')
    const end = format(INITIAL_DATE_RANGE.end, 'dd MMM')
    return `${start} - ${end}`
  }

  if (!hasInitialized || isLoading) {
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
          <p className="text-foreground-muted">Loading audit logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-16">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground">Account Settings</h1>
          <p className="mt-2 text-foreground-muted">Manage your personal account settings</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8 flex justify-center gap-6 border-b border-border">
          <Link
            href="/account/settings"
            className="pb-3 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
          >
            Account Settings
          </Link>
          <Link
            href="/account/audit"
            className="border-b-2 border-terminal-green pb-3 text-sm font-medium text-foreground"
          >
            Audit Logs
          </Link>
        </div>

        {/* Filters Bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-foreground-muted">Filter by</span>

            {/* Resource Type Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-lg border border-border bg-background-secondary px-3 py-1.5 text-sm text-foreground focus:border-terminal-green focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="user">Account</option>
              <option value="organization">Organizations</option>
              <option value="project">Projects</option>
            </select>

            {/* Date Range */}
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background-secondary px-3 py-1.5 text-sm">
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
              <span className="text-foreground">{formatDateRange()}</span>
            </div>

            <span className="text-sm text-foreground-muted">
              Viewing {logs.length} logs in total
            </span>
          </div>

          <button
            onClick={fetchAuditLogs}
            className="flex items-center gap-2 rounded-lg border border-border bg-background-secondary px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-background-tertiary"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>

        {/* Audit Logs Table */}
        <div className="rounded-lg border border-border bg-background-secondary">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-4 text-left text-sm font-medium text-foreground-muted">
                  Action
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-foreground-muted">
                  Target
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-foreground-muted">
                  <div className="flex items-center gap-1">
                    Date
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    No audit logs found for the selected period
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-border last:border-0">
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
                        onClick={() => {
                          // You can implement a modal or dropdown with more details
                          console.log('View details for:', log)
                        }}
                      >
                        View details
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
                Showing {logs.length} of {logs.length} results
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
