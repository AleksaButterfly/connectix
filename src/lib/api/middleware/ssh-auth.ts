import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient, User } from '@supabase/supabase-js'

export type SSHAuthHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string | string[]>> },
  extra: {
    user: User
    supabase: SupabaseClient
    connectionId: string
    sshSessionToken: string
  }
) => Promise<NextResponse>

export function createSSHAuthenticatedRoute(handler: SSHAuthHandler) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string | string[]>> }
  ) => {
    try {
      // Get Supabase client and verify user
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // Get connection ID from params
      const params = await context.params
      const connectionId = params.connectionId as string

      if (!connectionId) {
        return NextResponse.json({ error: 'Connection ID required' }, { status: 400 })
      }

      // Verify user has access to this connection
      const { data: canAccess } = await supabase.rpc('can_access_connection', {
        conn_id: connectionId,
        check_user_id: user.id,
      })

      if (!canAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      // Get SSH session token from header
      const sshSessionToken = request.headers.get('x-session-token')
      if (!sshSessionToken) {
        return NextResponse.json({ error: 'SSH session token required' }, { status: 401 })
      }
      
      // Validate session exists and is active
      const { SSHConnectionManager } = await import('@/lib/ssh/connection-manager')
      const isValidSession = await SSHConnectionManager.validateSession(sshSessionToken)
      if (!isValidSession) {
        console.log('Session validation failed for token:', sshSessionToken)
        return NextResponse.json({ 
          error: 'SSH session expired',
          code: 'SESSION_EXPIRED',
          message: 'Your SSH session has expired. Please refresh the page to reconnect.'
        }, { status: 401 })
      }

      // Call the handler with verified context
      return await handler(request, context, {
        user,
        supabase,
        connectionId,
        sshSessionToken,
      })
    } catch (error) {
      console.error('SSH authentication error:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Authentication failed' },
        { status: 500 }
      )
    }
  }
}