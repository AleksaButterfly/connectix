import { useState, useCallback } from 'react'
import { useToast } from '@/components/ui/ToastContext'
import { useIntl } from '@/lib/i18n'

interface UseSSHSessionReturn {
  sessionToken: string | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
}

export function useSSHSession(connectionId: string): UseSSHSessionReturn {
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const intl = useIntl()

  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return

    try {
      setIsConnecting(true)
      setError(null)

      const response = await fetch(`/api/connections/${connectionId}/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(
          errorData.error || intl.formatMessage({ id: 'ssh.errors.connectionFailed' })
        )
      }

      const data = await response.json()
      setSessionToken(data.sessionToken)
      setIsConnected(true)
      toast.success(intl.formatMessage({ id: 'ssh.connectionEstablished' }))
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message || intl.formatMessage({ id: 'ssh.errors.connectFailed' }))
    } finally {
      setIsConnecting(false)
    }
  }, [connectionId, isConnected, isConnecting, toast, intl])

  const disconnect = useCallback(() => {
    if (sessionToken) {
      // Call disconnect API if needed
      fetch(`/api/connections/${connectionId}/disconnect`, {
        method: 'POST',
        headers: {
          'x-session-token': sessionToken,
        },
      }).catch(console.error)
    }

    setSessionToken(null)
    setIsConnected(false)
    setError(null)
    toast.success(intl.formatMessage({ id: 'ssh.connectionClosed' }))
  }, [connectionId, sessionToken, toast, intl])

  return {
    sessionToken,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
  }
}
