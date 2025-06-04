'use client'

import { useState } from 'react'
import { useIntl, FormattedMessage } from '@/lib/i18n'
import type { ConnectionWithDetails } from '@/types/connection'

interface ConnectionDetailsProps {
  connection: ConnectionWithDetails
  onEdit: () => void
  onDelete: () => void
  onTest: () => void
}

export default function ConnectionDetails({
  connection,
  onEdit,
  onDelete,
  onTest,
}: ConnectionDetailsProps) {
  const intl = useIntl()
  const [showCredentials, setShowCredentials] = useState(false)

  const getStatusBadge = () => {
    if (!connection.connection_test_status || connection.connection_test_status === 'untested') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-background-tertiary px-3 py-1 text-xs font-medium text-foreground-muted">
          <span>○</span>
          <FormattedMessage id="connections.list.testStatus.untested" />
        </span>
      )
    }
    if (connection.connection_test_status === 'success') {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-terminal-green/10 px-3 py-1 text-xs font-medium text-terminal-green">
          <span>●</span>
          <FormattedMessage id="connections.list.testStatus.success" />
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-500">
        <span>●</span>
        <FormattedMessage id="connections.list.testStatus.failed" />
      </span>
    )
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return intl.formatMessage({ id: 'connections.list.neverUsed' })

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`

    return date.toLocaleDateString()
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{connection.name}</h1>
          {connection.description && (
            <p className="mt-2 text-foreground-muted">{connection.description}</p>
          )}
          <div className="mt-4 flex items-center gap-4">
            {getStatusBadge()}
            {connection.project_name && (
              <span className="text-sm text-terminal-green">{connection.project_name}</span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onTest}
            className="rounded-lg border border-border bg-background-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background-tertiary"
          >
            <FormattedMessage id="connections.actions.test" />
          </button>
          <button
            onClick={onEdit}
            className="rounded-lg border border-border bg-background-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background-tertiary"
          >
            <FormattedMessage id="connections.actions.edit" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-lg border border-red-500/20 bg-background-secondary px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
          >
            <FormattedMessage id="connections.actions.delete" />
          </button>
        </div>
      </div>

      {/* Connection Info */}
      <div className="mb-6 rounded-lg border border-border bg-background-secondary">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            <FormattedMessage id="connections.form.connectionSection" />
          </h2>
        </div>
        <div className="p-6">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <dt className="text-sm font-medium text-foreground-muted">
                <FormattedMessage id="connections.form.hostLabel" />
              </dt>
              <dd className="mt-1 font-mono text-sm text-foreground">{connection.host}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-foreground-muted">
                <FormattedMessage id="connections.form.portLabel" />
              </dt>
              <dd className="mt-1 font-mono text-sm text-foreground">{connection.port}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-foreground-muted">
                <FormattedMessage id="connections.form.usernameLabel" />
              </dt>
              <dd className="mt-1 font-mono text-sm text-foreground">{connection.username}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-foreground-muted">
                <FormattedMessage id="connections.form.authTypeLabel" />
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {intl.formatMessage({
                  id: `connections.form.authTypes.${connection.auth_type}`,
                })}
              </dd>
            </div>
          </dl>

          {/* SSH Command */}
          <div className="mt-6 rounded-lg bg-background p-4">
            <p className="mb-2 text-xs font-medium text-foreground-muted">SSH Command</p>
            <code className="block font-mono text-sm text-terminal-green">
              $ ssh {connection.username}@{connection.host} -p {connection.port}
              {connection.proxy_jump && ` -J ${connection.proxy_jump}`}
            </code>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      {(connection.proxy_jump ||
        connection.connection_timeout !== 30 ||
        connection.keepalive_interval !== 60) && (
        <div className="mb-6 rounded-lg border border-border bg-background-secondary">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">
              <FormattedMessage id="connections.form.advancedSection" />
            </h2>
          </div>
          <div className="p-6">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              {connection.proxy_jump && (
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-foreground-muted">
                    <FormattedMessage id="connections.form.proxyJumpLabel" />
                  </dt>
                  <dd className="mt-1 font-mono text-sm text-foreground">
                    {connection.proxy_jump}
                  </dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-foreground-muted">
                  <FormattedMessage id="connections.form.connectionTimeoutLabel" />
                </dt>
                <dd className="mt-1 text-sm text-foreground">{connection.connection_timeout}s</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-foreground-muted">
                  <FormattedMessage id="connections.form.keepaliveIntervalLabel" />
                </dt>
                <dd className="mt-1 text-sm text-foreground">{connection.keepalive_interval}s</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-sm font-medium text-foreground-muted">
                  <FormattedMessage id="connections.form.strictHostCheckingLabel" />
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {connection.strict_host_checking ? 'Enabled' : 'Disabled'}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="rounded-lg border border-border bg-background-secondary">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">Information</h2>
        </div>
        <div className="p-6">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <dt className="text-sm font-medium text-foreground-muted">Created by</dt>
              <dd className="mt-1 text-sm text-foreground">
                {connection.created_by_username || 'Unknown'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-foreground-muted">Created</dt>
              <dd className="mt-1 text-sm text-foreground">{formatDate(connection.created_at)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-foreground-muted">Last used</dt>
              <dd className="mt-1 text-sm text-foreground">
                {formatDate(connection.last_used_at)}
              </dd>
            </div>
            {connection.last_used_by_username && (
              <div>
                <dt className="text-sm font-medium text-foreground-muted">Last used by</dt>
                <dd className="mt-1 text-sm text-foreground">{connection.last_used_by_username}</dd>
              </div>
            )}
            {connection.last_test_at && (
              <>
                <div>
                  <dt className="text-sm font-medium text-foreground-muted">Last tested</dt>
                  <dd className="mt-1 text-sm text-foreground">
                    {formatDate(connection.last_test_at)}
                  </dd>
                </div>
                {connection.last_test_error && (
                  <div className="col-span-2">
                    <dt className="text-sm font-medium text-foreground-muted">Last test error</dt>
                    <dd className="mt-1 rounded bg-red-500/10 p-2 font-mono text-xs text-red-500">
                      {connection.last_test_error}
                    </dd>
                  </div>
                )}
              </>
            )}
          </dl>
        </div>
      </div>
    </div>
  )
}
