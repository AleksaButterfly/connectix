import { useState, useCallback, useRef, useEffect } from 'react'
import { useIntl } from '@/lib/i18n'
import { useToast } from '@/components/ui/ToastContext'

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

  const intl = useIntl()
  const { toast } = useToast()

  // Use refs to access latest values without causing re-renders
  const intlRef = useRef(intl)
  const toastRef = useRef(toast)

  // Update refs when they change
  useEffect(() => {
    intlRef.current = intl
  }, [intl])

  useEffect(() => {
    toastRef.current = toast
  }, [toast])

  // Keep-alive interval reference
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Connect to SSH
  const connect = useCallback(async () => {
    if (isConnecting || isConnected) return

    setIsConnecting(true)
    setError(null)

    try {
      const response = await fetch(`/api/connections/${connectionId}/connect`, {
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

      // Use ref to access latest toast
      toastRef.current.success('Connected successfully')

      if (onConnect) {
        onConnect(token)
      }

      // Start keep-alive interval
      keepAliveIntervalRef.current = setInterval(
        () => {
          keepAlive(token)
        },
        30000 // 30 seconds
      )
    } catch (err: any) {
      const errorMessage = err.message || 'Connection failed'
      setError(errorMessage)

      // Use ref to access latest toast
      toastRef.current.error(errorMessage)

      if (onError) {
        onError(errorMessage)
      }
    } finally {
      setIsConnecting(false)
    }
  }, [connectionId, isConnecting, isConnected, onConnect, onError])

  // Keep session alive
  const keepAlive = useCallback(
    async (token?: string) => {
      const currentToken = token || sessionToken
      if (!currentToken) return

      try {
        const response = await fetch(`/api/connections/${connectionId}/session/keepalive`, {
          method: 'POST',
          headers: {
            'x-session-token': currentToken,
          },
        })

        if (!response.ok) {
          throw new Error('Keep-alive failed')
        }
      } catch (err) {
        console.error('Keep-alive error:', err)
        // Don't show error toast for keep-alive failures
      }
    },
    [connectionId, sessionToken]
  )

  // Disconnect from SSH
  const disconnect = useCallback(() => {
    if (!sessionToken) return

    // Clear keep-alive interval
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current)
      keepAliveIntervalRef.current = null
    }

    // Send disconnect request
    fetch(`/api/connections/${connectionId}/disconnect`, {
      method: 'POST',
      headers: {
        'x-session-token': sessionToken,
      },
    }).catch((err) => {
      console.error('Disconnect error:', err)
    })

    setSessionToken(null)
    setIsConnected(false)
    setError(null)

    // Use ref to access latest toast
    toastRef.current.info('Disconnected')

    if (onDisconnect) {
      onDisconnect()
    }
  }, [connectionId, sessionToken, onDisconnect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current)
      }
      // Disconnect when component unmounts
      if (sessionToken) {
        fetch(`/api/connections/${connectionId}/disconnect`, {
          method: 'POST',
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
    keepAlive: () => keepAlive(),
  }
}
