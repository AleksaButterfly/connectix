import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { SSHConnectionManager } from '@/lib/ssh/connection-manager'

export async function POST(request: NextRequest, { params }: { params: { connectionId: string } }) {
  try {
    const supabase = createClient()
    const sessionToken = request.headers.get('x-session-token')

    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token required' }, { status: 401 })
    }

    // Close the SSH session
    SSHConnectionManager.closeSession(sessionToken)

    // Update session status in database
    const { error: sessionError } = await supabase
      .from('connection_sessions')
      .update({
        status: 'disconnected',
        ended_at: new Date().toISOString(),
        termination_reason: 'User requested disconnect',
      })
      .eq('session_token', sessionToken)
      .eq('connection_id', params.connectionId)

    if (sessionError) {
      console.error('Failed to update session status:', sessionError)
    }

    // Log the disconnection activity
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('connection_activity_logs').insert({
        connection_id: params.connectionId,
        user_id: user.id,
        activity_type: 'session.ended',
        details: {
          termination_reason: 'User requested disconnect',
          session_token: sessionToken.substring(0, 8) + '...', // Log partial token for security
        },
        ip_address:
          request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
      })
    }

    return NextResponse.json({
      success: true,
      message: 'SSH connection closed successfully',
    })
  } catch (error: any) {
    console.error('SSH disconnect error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to close SSH connection' },
      { status: 500 }
    )
  }
}
