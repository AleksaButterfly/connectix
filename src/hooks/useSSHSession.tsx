import { useState, useCallback } from 'react'
import { useToast } from '@/components/ui/ToastContext'

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
        throw new Error(errorData.error || 'Failed to establish SSH connection')
      }

      const data = await response.json()
      setSessionToken(data.sessionToken)
      setIsConnected(true)
      toast.success('SSH connection established')
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message || 'Failed to connect')
    } finally {
      setIsConnecting(false)
    }
  }, [connectionId, isConnected, isConnecting, toast])

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
    toast.success('SSH connection closed')
  }, [connectionId, sessionToken, toast])

  return {
    sessionToken,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
  }
}
