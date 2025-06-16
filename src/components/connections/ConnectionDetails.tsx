'use client'

import { useState } from 'react'
import { useIntl, FormattedMessage } from '@/lib/i18n'
import { ConnectionStatusDisplay } from './ConnectionStatusDisplay'
import type { ConnectionWithDetails } from '@/types/connection'

interface ConnectionDetailsProps {
  connection: ConnectionWithDetails
  onEdit: () => void
  onDelete: () => void
  onTest: () => void
  onBrowse: () => void
}

export default function ConnectionDetails({
  connection,
  onEdit,
  onDelete,
  onTest,
  onBrowse,
}: ConnectionDetailsProps) {
  const intl = useIntl()
  const [isTesting, setIsTesting] = useState(false)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return intl.formatMessage({ id: 'connections.list.neverUsed' })

    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return intl.formatMessage({ id: 'common.justNow' })
    if (diffMins < 60) return intl.formatMessage({ id: 'common.minutesAgo' }, { count: diffMins })
    if (diffHours < 24) return intl.formatMessage({ id: 'common.hoursAgo' }, { count: diffHours })
    if (diffDays < 7) return intl.formatMessage({ id: 'common.daysAgo' }, { count: diffDays })

    return date.toLocaleDateString(intl.locale)
  }

  const handleTest = async () => {
    setIsTesting(true)
    try {
      await onTest()
    } finally {
      setIsTesting(false)
    }
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
          {connection.project_name && (
            <p className="mt-2 text-sm text-terminal-green">{connection.project_name}</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onBrowse}
            className="rounded-lg bg-terminal-green px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-terminal-green/90"
          >
            <FormattedMessage id="connections.actions.browse" />
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

      {/* Connection Status */}
      <div className="mb-6">
        <ConnectionStatusDisplay
          connection={connection}
          onTest={handleTest}
          isTesting={isTesting}
        />
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
                <FormattedMessage id={`connections.form.authTypes.${connection.auth_type}`} />
              </dd>
            </div>
          </dl>

          {/* SSH Command */}
          <div className="mt-6 rounded-lg bg-background p-4">
            <p className="mb-2 text-xs font-medium text-foreground-muted">
              <FormattedMessage id="connections.details.sshCommand" />
            </p>
            <code className="block font-mono text-sm text-terminal-green">
              $ ssh {connection.username}@{connection.host}
              {connection.port !== 22 && ` -p ${connection.port}`}
              {connection.proxy_jump && ` -J ${connection.proxy_jump}`}
            </code>
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      {(connection.proxy_jump ||
        connection.connection_timeout !== 30 ||
        connection.keepalive_interval !== 60 ||
        !connection.strict_host_checking) && (
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
                <dd className="mt-1 text-sm text-foreground">
                  <FormattedMessage
                    id="connections.details.seconds"
                    values={{ count: connection.connection_timeout }}
                  />
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-foreground-muted">
                  <FormattedMessage id="connections.form.keepaliveIntervalLabel" />
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  <FormattedMessage
                    id="connections.details.seconds"
                    values={{ count: connection.keepalive_interval }}
                  />
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-sm font-medium text-foreground-muted">
                  <FormattedMessage id="connections.form.strictHostCheckingLabel" />
                </dt>
                <dd className="mt-1 text-sm text-foreground">
                  {connection.strict_host_checking ? (
                    <FormattedMessage id="common.enabled" />
                  ) : (
                    <FormattedMessage id="common.disabled" />
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="rounded-lg border border-border bg-background-secondary">
        <div className="border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            <FormattedMessage id="connections.details.informationSection" />
          </h2>
        </div>
        <div className="p-6">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <dt className="text-sm font-medium text-foreground-muted">
                <FormattedMessage id="connections.details.createdBy" />
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {connection.created_by_username || intl.formatMessage({ id: 'common.unknown' })}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-foreground-muted">
                <FormattedMessage id="connections.details.created" />
              </dt>
              <dd className="mt-1 text-sm text-foreground">{formatDate(connection.created_at)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-foreground-muted">
                <FormattedMessage id="connections.details.lastUsed" />
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {formatDate(connection.last_used_at)}
              </dd>
            </div>
            {connection.last_used_by_username && (
              <div>
                <dt className="text-sm font-medium text-foreground-muted">
                  <FormattedMessage id="connections.details.lastUsedBy" />
                </dt>
                <dd className="mt-1 text-sm text-foreground">{connection.last_used_by_username}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  )
}
