import { useState, useCallback, useRef, useEffect } from 'react'
import { useToast } from '@/components/ui/ToastContext'
import { useIntl } from '@/lib/i18n'

interface UseSSHSessionProps {
  connectionId: string
  onConnect?: (sessionToken: string) => void
  onDisconnect?: () => void
  onError?: (error: string) => void
}

interface UseSSHSessionReturn {
  sessionToken: string | null
  isConnecting: boolean
  isConnected: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  keepAlive: () => Promise<void>
}

export function useSSHSession({
  connectionId,
  onConnect,
  onDisconnect,
  onError,
}: UseSSHSessionProps): UseSSHSessionReturn {
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { toast } = useToast()
  const intl = useIntl()

  // Keep-alive interval reference
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Refs for callbacks to avoid dependency issues
  const onConnectRef = useRef(onConnect)
  const onDisconnectRef = useRef(onDisconnect)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onConnectRef.current = onConnect
    onDisconnectRef.current = onDisconnect
    onErrorRef.current = onError
  }, [onConnect, onDisconnect, onError])

  // Keep session alive
  const keepAlive = useCallback(async () => {
    if (!sessionToken) return

    try {
      const response = await fetch(`/api/connections/${connectionId}/session`, {
        method: 'PUT',
        headers: {
          'x-session-token': sessionToken,
        },
      })

      if (!response.ok) {
        throw new Error('Keep-alive failed')
      }
    } catch (err) {
      console.error('Keep-alive error:', err)
      // Don't show error toast for keep-alive failures
    }
  }, [connectionId, sessionToken])

  // Connect to SSH
  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return

    setIsConnecting(true)
    setError(null)

    try {
      const response = await fetch(`/api/connections/${connectionId}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to connect')
      }

      const data = await response.json()
      const token = data.sessionToken

      setSessionToken(token)
      setIsConnected(true)

      toast.success(intl.formatMessage({ id: 'ssh.session.connected' }))

      if (onConnectRef.current) {
        onConnectRef.current(token)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      const finalMessage = errorMessage || 'Connection failed'
      setError(finalMessage)

      toast.error(finalMessage)

      if (onErrorRef.current) {
        onErrorRef.current(errorMessage)
      }
    } finally {
      setIsConnecting(false)
    }
  }, [connectionId, isConnecting, isConnected])

  // Start keep-alive interval when connected
  useEffect(() => {
    if (!sessionToken) {
      return
    }

    // Start keep-alive interval
    keepAliveIntervalRef.current = setInterval(() => {
      keepAlive()
    }, 30000) // 30 seconds

    return () => {
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current)
        keepAliveIntervalRef.current = null
      }
    }
  }, [sessionToken, keepAlive])

  // Disconnect from SSH
  const disconnect = useCallback(() => {
    if (!sessionToken) return

    // Clear keep-alive interval
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current)
      keepAliveIntervalRef.current = null
    }

    // Send disconnect request
    fetch(`/api/connections/${connectionId}/session`, {
      method: 'DELETE',
      headers: {
        'x-session-token': sessionToken,
      },
    }).catch((err) => {
      console.error('Disconnect error:', err)
    })

    setSessionToken(null)
    setIsConnected(false)
    setError(null)

    toast.info(intl.formatMessage({ id: 'ssh.session.disconnected' }))

    if (onDisconnectRef.current) {
      onDisconnectRef.current()
    }
  }, [connectionId, sessionToken])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current)
      }
      // Disconnect when component unmounts
      if (sessionToken) {
        fetch(`/api/connections/${connectionId}/session`, {
          method: 'DELETE',
          headers: {
            'x-session-token': sessionToken,
          },
        }).catch(() => {
          // Ignore errors on cleanup
        })
      }
    }
  }, [connectionId, sessionToken])

  return {
    sessionToken,
    isConnecting,
    isConnected,
    error,
    connect,
    disconnect,
    keepAlive,
  }
}
