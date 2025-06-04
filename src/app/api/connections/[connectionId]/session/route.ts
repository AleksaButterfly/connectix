import { NextRequest, NextResponse } from 'next/server'
import { SSHConnectionManager } from '@/lib/ssh/connection-manager'
import { createClient } from '@/lib/supabase/server'
import { decryptCredentials } from '@/lib/connections/encryption'

// Define the SSH configuration interface to match your database schema
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
export async function POST(request: NextRequest, { params }: { params: { connectionId: string } }) {
  try {
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

    // Fetch connection from database with RLS protection
    const { data: connection, error: connectionError } = await supabase
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (connectionError) {
      console.error('Database error fetching connection:', connectionError)
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    // Decrypt credentials
    let decryptedCredentials
    try {
      // Check if credentials exist
      if (!connection.encrypted_credentials) {
        return NextResponse.json(
          {
            error: 'No credentials found for this connection',
          },
          { status: 400 }
        )
      }

      // Parse the encrypted credentials JSON first
      let encryptedData
      try {
        encryptedData = JSON.parse(connection.encrypted_credentials)
      } catch (parseError) {
        console.error('❌ Failed to parse encrypted credentials JSON:', parseError)
        return NextResponse.json(
          {
            error: 'Invalid encrypted credentials format - not valid JSON',
          },
          { status: 500 }
        )
      }

      // Check if it has the expected encryption format
      if (!encryptedData.data || !encryptedData.iv || !encryptedData.salt) {
        return NextResponse.json(
          {
            error: 'Invalid encrypted credentials format - missing encryption fields',
          },
          { status: 500 }
        )
      }

      // Use the actual decryption function
      if (typeof decryptCredentials === 'function') {
        console.log(
          '🔐 Attempting to decrypt credentials with key ID:',
          connection.encryption_key_id
        )

        try {
          // Pass both the encrypted data and the key ID
          decryptedCredentials = await decryptCredentials(
            connection.encrypted_credentials,
            connection.encryption_key_id
          )
        } catch (decryptError) {
          // Check if the decryptCredentials function expects different parameters
          // Try alternative calling patterns
          try {
            decryptedCredentials = await decryptCredentials(
              encryptedData,
              connection.encryption_key_id
            )
          } catch (altError) {
            console.error('❌ Alternative decryption also failed:', altError)

            return NextResponse.json(
              {
                error: 'Failed to decrypt credentials - check encryption key availability',
                details:
                  process.env.NODE_ENV === 'development'
                    ? {
                        encryptionKeyId: connection.encryption_key_id,
                        originalError: decryptError.message,
                        alternativeError: altError.message,
                      }
                    : undefined,
              },
              { status: 500 }
            )
          }
        }
      } else {
        return NextResponse.json(
          {
            error: 'Decryption function not available - credentials are encrypted',
          },
          { status: 500 }
        )
      }

      // Validate decrypted credentials
      if (!decryptedCredentials || typeof decryptedCredentials !== 'object') {
        return NextResponse.json(
          {
            error: 'Decrypted credentials are not in expected format',
          },
          { status: 500 }
        )
      }

      // Validate that we have credentials at this point
      if (!decryptedCredentials) {
        return NextResponse.json(
          {
            error: 'No valid credentials available after decryption attempt',
          },
          { status: 500 }
        )
      }
    } catch (error) {
      return NextResponse.json(
        {
          error: `Credential processing failed: ${error.message}`,
          details:
            process.env.NODE_ENV === 'development'
              ? {
                  errorType: error.name,
                  errorMessage: error.message,
                  stack: error.stack,
                }
              : undefined,
        },
        { status: 500 }
      )
    }

    // Validate that we have the required credentials for the auth type
    if (connection.auth_type === 'password' && !decryptedCredentials.password) {
      return NextResponse.json(
        {
          error: 'Password is required for password authentication',
        },
        { status: 400 }
      )
    }

    if (
      (connection.auth_type === 'private_key' || connection.auth_type === 'key_with_passphrase') &&
      !decryptedCredentials.private_key
    ) {
      return NextResponse.json(
        {
          error: 'Private key is required for key authentication',
        },
        { status: 400 }
      )
    }

    if (connection.auth_type === 'key_with_passphrase' && !decryptedCredentials.passphrase) {
      return NextResponse.json(
        {
          error: 'Passphrase is required for key with passphrase authentication',
        },
        { status: 400 }
      )
    }

    // Transform database connection to SSHConfig format
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

    return NextResponse.json({
      success: true,
      sessionToken,
      message: 'SSH session created successfully',
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
export async function GET(request: NextRequest, { params }: { params: { connectionId: string } }) {
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
export async function PUT(request: NextRequest, { params }: { params: { connectionId: string } }) {
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
  { params }: { params: { connectionId: string } }
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
