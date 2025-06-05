import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { SSHConnectionManager } from '@/lib/ssh/connection-manager'
import { decryptCredentials } from '@/lib/connections/encryption'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ connectionId: string }> }
) {
  try {
    const params = await context.params
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get connection details
    const { data: connection, error } = await supabase
      .from('connections')
      .select('*')
      .eq('id', params.connectionId)
      .single()

    if (error || !connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    // Check if user can access this connection
    const { data: canAccess } = await supabase.rpc('can_access_connection', {
      conn_id: params.connectionId,
      check_user_id: user.id,
    })

    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Decrypt credentials
    let credentials: any
    try {
      credentials = decryptCredentials(connection.encrypted_credentials)
    } catch (decryptError) {
      console.error('Decryption error:', decryptError)

      // Update connection status
      await supabase
        .from('connections')
        .update({
          connection_test_status: 'failed',
          last_test_at: new Date().toISOString(),
          last_test_error: 'Failed to decrypt credentials',
        })
        .eq('id', params.connectionId)

      return NextResponse.json(
        {
          error: 'Failed to decrypt credentials',
          message:
            'Connection credentials could not be decrypted. Please edit the connection and re-enter your credentials.',
        },
        { status: 400 }
      )
    }

    // Create SSH connection
    const sessionToken = await SSHConnectionManager.createSession(params.connectionId, user.id, {
      host: connection.host,
      port: connection.port,
      username: connection.username,
      auth_type: connection.auth_type,
      credentials,
      proxy_jump: connection.proxy_jump,
      connection_timeout: connection.connection_timeout,
      strict_host_checking: connection.strict_host_checking,
    })

    // Update last used timestamp
    await supabase
      .from('connections')
      .update({
        last_used_at: new Date().toISOString(),
        last_used_by: user.id,
        connection_test_status: 'success',
      })
      .eq('id', params.connectionId)

    // Log the connection in session table
    await supabase.from('connection_sessions').insert({
      connection_id: params.connectionId,
      user_id: user.id,
      session_token: sessionToken,
      client_ip:
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      user_agent: request.headers.get('user-agent'),
      status: 'active',
    })

    return NextResponse.json({
      sessionToken,
      message: 'SSH connection established successfully',
      connection: {
        id: connection.id,
        name: connection.name,
        host: connection.host,
        port: connection.port,
        username: connection.username,
      },
    })
  } catch (error: any) {
    console.error('SSH connection error:', error)

    // Update connection test status on failure
    try {
      const params = await context.params
      const supabase = await createClient()
      await supabase
        .from('connections')
        .update({
          connection_test_status: 'failed',
          last_test_at: new Date().toISOString(),
          last_test_error: error.message,
        })
        .eq('id', params.connectionId)
    } catch (updateError) {
      console.error('Failed to update connection status:', updateError)
    }

    return NextResponse.json(
      { error: error.message || 'Failed to establish SSH connection' },
      { status: 500 }
    )
  }
}
