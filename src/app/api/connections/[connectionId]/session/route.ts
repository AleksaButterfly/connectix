import { NextRequest, NextResponse } from 'next/server'
import { SSHConnectionManager } from '@/lib/ssh/connection-manager'
import { createClient } from '@/lib/supabase/server'
import { decryptCredentials } from '@/lib/connections/encryption'

// Define the SSH configuration interface
interface SSHConfig {
  host: string
  port: number
  username: string
  auth_type: 'password' | 'private_key' | 'key_with_passphrase'
  credentials: {
    password?: string
    private_key?: string
    passphrase?: string
  }
  proxy_jump?: string | null
  connection_timeout?: number
  strict_host_checking?: boolean
}

// CREATE SESSION (POST)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ connectionId: string }> }
) {
  try {
    const params = await context.params
    const { connectionId } = params

    if (!connectionId) {
      return NextResponse.json({ error: 'Connection ID is required' }, { status: 400 })
    }

    // Get user from Supabase session
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('Authentication error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch connection from database
    const { data: connection, error: connectionError } = await supabase
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (connectionError || !connection) {
      console.error('Database error fetching connection:', connectionError)
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    // Check if user can access this connection
    const { data: canAccess } = await supabase.rpc('can_access_connection', {
      conn_id: connectionId,
      check_user_id: user.id,
    })

    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Decrypt credentials - SIMPLE VERSION
    let decryptedCredentials
    try {
      if (!connection.encrypted_credentials) {
        return NextResponse.json(
          { error: 'No credentials found for this connection' },
          { status: 400 }
        )
      }

      // Use your working decryptCredentials function (no extra parameters needed)
      decryptedCredentials = decryptCredentials(connection.encrypted_credentials)
    } catch (decryptError: any) {
      return NextResponse.json(
        {
          error: 'Failed to decrypt credentials',
          message: 'Please edit the connection and re-enter your credentials.',
          debug:
            process.env.NODE_ENV === 'development'
              ? {
                  originalError: decryptError.message,
                  connectionId: connectionId,
                }
              : undefined,
        },
        { status: 500 }
      )
    }

    // Validate credentials for auth type
    if (connection.auth_type === 'password' && !decryptedCredentials.password) {
      return NextResponse.json(
        { error: 'Password is required for password authentication' },
        { status: 400 }
      )
    }

    if (
      (connection.auth_type === 'private_key' || connection.auth_type === 'key_with_passphrase') &&
      !decryptedCredentials.private_key
    ) {
      return NextResponse.json(
        { error: 'Private key is required for key authentication' },
        { status: 400 }
      )
    }

    if (connection.auth_type === 'key_with_passphrase' && !decryptedCredentials.passphrase) {
      return NextResponse.json(
        { error: 'Passphrase is required for key with passphrase authentication' },
        { status: 400 }
      )
    }

    // Transform to SSH config format
    const sshConfig: SSHConfig = {
      host: connection.host,
      port: connection.port,
      username: connection.username,
      auth_type: connection.auth_type,
      credentials: decryptedCredentials,
      proxy_jump: connection.proxy_jump,
      connection_timeout: connection.connection_timeout || 30,
      strict_host_checking: connection.strict_host_checking ?? false,
    }

    // Create SSH session
    const sessionToken = await SSHConnectionManager.createSession(connectionId, user.id, sshConfig)

    // Update connection usage
    await supabase
      .from('connections')
      .update({
        last_used_at: new Date().toISOString(),
        last_used_by: user.id,
        connection_test_status: 'success',
      })
      .eq('id', connectionId)

    return NextResponse.json({
      success: true,
      sessionToken,
      message: 'SSH session created successfully',
      connection: {
        id: connection.id,
        name: connection.name,
        host: connection.host,
        port: connection.port,
        username: connection.username,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || 'Failed to create SSH session',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

// GET SESSION INFO (GET)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ connectionId: string }> }
) {
  try {
    const sessionToken = request.headers.get('x-session-token')

    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token required' }, { status: 401 })
    }

    const sessionInfo = await SSHConnectionManager.getSessionInfo(sessionToken)

    return NextResponse.json({
      success: true,
      session: sessionInfo,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get session info' },
      { status: 500 }
    )
  }
}

// KEEP SESSION ALIVE (PUT)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ connectionId: string }> }
) {
  try {
    const sessionToken = request.headers.get('x-session-token')

    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token required' }, { status: 401 })
    }

    await SSHConnectionManager.keepSessionAlive(sessionToken)

    return NextResponse.json({
      success: true,
      message: 'Session kept alive',
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to keep session alive' },
      { status: 500 }
    )
  }
}

// CLOSE SESSION (DELETE)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ connectionId: string }> }
) {
  try {
    const sessionToken = request.headers.get('x-session-token')

    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token required' }, { status: 401 })
    }

    await SSHConnectionManager.closeSession(sessionToken)

    return NextResponse.json({
      success: true,
      message: 'SSH session closed successfully',
    })
  } catch (error: any) {
    console.error('Error closing SSH session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to close SSH session' },
      { status: 500 }
    )
  }
}
