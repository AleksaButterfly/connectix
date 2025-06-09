'use client'

import { useIntl, FormattedMessage } from '@/lib/i18n'
import type { ConnectionWithDetails } from '@/types/connection'

interface ConnectionStatusDisplayProps {
  connection: ConnectionWithDetails
  onTest: () => void
  isTesting?: boolean
}

export function ConnectionStatusDisplay({
  connection,
  onTest,
  isTesting = false,
}: ConnectionStatusDisplayProps) {
  const intl = useIntl()

  const getStatusDisplay = () => {
    if (!connection.connection_test_status || connection.connection_test_status === 'untested') {
      return {
        color: 'bg-gray-500',
        pulseColor: 'bg-gray-400',
        text: intl.formatMessage({ id: 'connections.list.testStatus.untested' }),
        icon: '○',
        showPulse: false,
      }
    }

    if (connection.connection_test_status === 'success') {
      return {
        color: 'bg-terminal-green',
        pulseColor: 'bg-terminal-green',
        text: intl.formatMessage({ id: 'connections.list.testStatus.success' }),
        icon: '●',
        showPulse: true,
      }
    }

    return {
      color: 'bg-red-500',
      pulseColor: 'bg-red-400',
      text: intl.formatMessage({ id: 'connections.list.testStatus.failed' }),
      icon: '●',
      showPulse: false,
    }
  }

  const status = getStatusDisplay()

  const formatLastTested = () => {
    if (!connection.last_test_at) {
      return intl.formatMessage({ id: 'connections.details.neverTested' })
    }

    const date = new Date(connection.last_test_at)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) {
      return intl.formatMessage({ id: 'common.justNow' })
    } else if (diffInMinutes < 60) {
      return intl.formatMessage({ id: 'common.minutesAgo' }, { count: diffInMinutes })
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return intl.formatMessage({ id: 'common.hoursAgo' }, { count: hours })
    } else {
      return date.toLocaleDateString(intl.locale, {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      })
    }
  }

  return (
    <div className="rounded-lg border border-border bg-background-secondary p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="mb-2 text-sm font-medium text-foreground-muted">
            <FormattedMessage id="connections.details.testStatus" />
          </h3>

          <div className="flex items-center gap-3">
            {/* Status Indicator */}
            <div className="relative">
              <div className={`h-4 w-4 rounded-full ${status.color}`}>
                {status.showPulse && (
                  <div
                    className={`absolute inset-0 rounded-full ${status.pulseColor} animate-ping opacity-75`}
                  />
                )}
              </div>
            </div>

            {/* Status Text */}
            <div>
              <p className="text-lg font-medium text-foreground">{status.text}</p>
              <p className="text-xs text-foreground-muted">{formatLastTested()}</p>
            </div>
          </div>

          {/* Error Message */}
          {connection.connection_test_status === 'failed' && connection.last_test_error && (
            <div className="mt-3 rounded bg-red-500/10 p-2">
              <p className="text-xs text-red-500">
                <FormattedMessage
                  id="connections.details.testError"
                  values={{ error: connection.last_test_error }}
                />
              </p>
            </div>
          )}
        </div>

        {/* Test Button */}
        <button
          onClick={onTest}
          disabled={isTesting}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            isTesting
              ? 'cursor-not-allowed bg-background-tertiary text-foreground-muted'
              : 'bg-terminal-green text-background hover:bg-terminal-green/90'
          }`}
        >
          {isTesting ? (
            <span className="flex items-center gap-2">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-foreground-muted border-t-transparent" />
              <FormattedMessage id="connections.actions.testing" />
            </span>
          ) : (
            <FormattedMessage id="connections.actions.test" />
          )}
        </button>
      </div>

      {/* Visual Connection Path */}
      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-center gap-2 font-mono text-xs text-foreground-muted">
          <span className="text-terminal-green">$</span>
          <span>
            <FormattedMessage
              id="connections.details.sshCommandFormat"
              values={{
                username: connection.username,
                host: connection.host,
              }}
            />
          </span>
          {connection.port !== 22 && (
            <span>
              {' '}
              <FormattedMessage
                id="connections.details.sshPortFlag"
                values={{ port: connection.port }}
              />
            </span>
          )}
          {connection.proxy_jump && (
            <span>
              {' '}
              <FormattedMessage
                id="connections.details.sshProxyFlag"
                values={{ proxyJump: connection.proxy_jump }}
              />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
