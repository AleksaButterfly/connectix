import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decryptCredentials, checkEncryptionConfig } from '@/lib/connections/encryption'
import { Client } from 'ssh2'

interface TestConnectionResult {
  success: boolean
  message: string
  error?: string
  latency_ms?: number
}

async function testSSHConnection(config: {
  host: string
  port: number
  username: string
  auth_type: 'password' | 'private_key' | 'key_with_passphrase'
  credentials: {
    password?: string
    privateKey?: string
    passphrase?: string
  }
  connection_timeout?: number
  strict_host_checking?: boolean
}): Promise<TestConnectionResult> {
  return new Promise((resolve) => {
    const startTime = Date.now()
    const client = new Client()

    const timeout = setTimeout(
      () => {
        client.end()
        resolve({
          success: false,
          error: 'Connection timeout',
          message: 'Connection timed out after ' + (config.connection_timeout || 30) + ' seconds',
        })
      },
      (config.connection_timeout || 30) * 1000
    )

    client.on('ready', () => {
      clearTimeout(timeout)
      const latency = Date.now() - startTime
      client.end()

      resolve({
        success: true,
        message: 'SSH connection successful',
        latency_ms: latency,
      })
    })

    client.on('error', (err) => {
      clearTimeout(timeout)
      console.error('SSH connection error:', err)

      let errorMessage = 'Connection failed'

      if (err.message.includes('ENOTFOUND')) {
        errorMessage = 'Host not found - check the hostname or IP address'
      } else if (err.message.includes('ECONNREFUSED')) {
        errorMessage = 'Connection refused - check if SSH is running on the target host'
      } else if (err.message.includes('Authentication')) {
        errorMessage = 'Authentication failed - check your credentials'
      } else if (err.message.includes('timeout')) {
        errorMessage = 'Connection timeout - host may be unreachable'
      } else {
        errorMessage = err.message
      }

      resolve({
        success: false,
        error: err.message,
        message: errorMessage,
      })
    })

    const connectConfig: any = {
      host: config.host,
      port: config.port,
      username: config.username,
      readyTimeout: (config.connection_timeout || 30) * 1000,
      hostHash: config.strict_host_checking ? 'sha256' : undefined,
      hostVerifier: config.strict_host_checking ? undefined : () => true,
    }

    if (config.auth_type === 'password') {
      connectConfig.password = config.credentials.password
    } else if (config.auth_type === 'private_key') {
      connectConfig.privateKey = config.credentials.privateKey
    } else if (config.auth_type === 'key_with_passphrase') {
      connectConfig.privateKey = config.credentials.privateKey
      connectConfig.passphrase = config.credentials.passphrase
    }

    try {
      client.connect(connectConfig)
    } catch (error: any) {
      clearTimeout(timeout)
      resolve({
        success: false,
        error: error.message,
        message: 'Failed to initiate connection: ' + error.message,
      })
    }
  })
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ connectionId: string }> }
) {
  try {
    const params = await context.params
    const supabase = await createClient()

    // Enhanced encryption debugging
    console.log('🔍 ENCRYPTION ENVIRONMENT DEBUG:')
    console.log('  CONNECTIX_ENCRYPTION_KEY exists:', !!process.env.CONNECTIX_ENCRYPTION_KEY)
    console.log('  SSH_ENCRYPTION_KEY exists:', !!process.env.SSH_ENCRYPTION_KEY)
    console.log(
      '  Will use fallback:',
      !process.env.CONNECTIX_ENCRYPTION_KEY && !process.env.SSH_ENCRYPTION_KEY
    )

    if (process.env.CONNECTIX_ENCRYPTION_KEY) {
      console.log('  CONNECTIX_ENCRYPTION_KEY length:', process.env.CONNECTIX_ENCRYPTION_KEY.length)
      console.log(
        '  CONNECTIX_ENCRYPTION_KEY preview:',
        process.env.CONNECTIX_ENCRYPTION_KEY.substring(0, 10) + '...'
      )
    }

    if (process.env.SSH_ENCRYPTION_KEY) {
      console.log('  SSH_ENCRYPTION_KEY length:', process.env.SSH_ENCRYPTION_KEY.length)
      console.log(
        '  SSH_ENCRYPTION_KEY preview:',
        process.env.SSH_ENCRYPTION_KEY.substring(0, 10) + '...'
      )
    }

    // Test encryption configuration
    try {
      const encConfig = checkEncryptionConfig()
      console.log('  Encryption config:', encConfig)

      if (!encConfig.testPassed) {
        console.error('❌ Encryption test failed - this will cause decryption issues!')
      }
    } catch (encTestError) {
      console.error('❌ Encryption config test failed:', encTestError)
    }

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

    console.log('🔍 CONNECTION DEBUG:')
    console.log('  Connection ID:', params.connectionId)
    console.log('  Created at:', connection.created_at)
    console.log('  Updated at:', connection.updated_at)
    console.log('  Has encrypted data:', !!connection.encrypted_credentials)
    console.log('  Encrypted data length:', connection.encrypted_credentials?.length)
    console.log('  Last test status:', connection.connection_test_status)
    console.log('  Last test error:', connection.last_test_error)

    // Check if user can access this connection
    const { data: canAccess } = await supabase.rpc('can_access_connection', {
      conn_id: params.connectionId,
      check_user_id: user.id,
    })

    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Validate encrypted data format before attempting decryption
    if (!connection.encrypted_credentials) {
      return NextResponse.json(
        {
          success: false,
          error: 'No credentials stored',
          message:
            'This connection has no stored credentials. Please edit the connection and enter your credentials.',
        },
        { status: 400 }
      )
    }

    // Check if encrypted data is valid JSON
    try {
      const parsedData = JSON.parse(connection.encrypted_credentials)
      console.log(
        '  Encrypted data structure valid:',
        !!parsedData.data && !!parsedData.iv && !!parsedData.salt && !!parsedData.tag
      )

      if (!parsedData.data || !parsedData.iv || !parsedData.salt || !parsedData.tag) {
        throw new Error('Missing required encryption fields')
      }
    } catch (parseError) {
      console.error('❌ Invalid encrypted data format:', parseError)

      await supabase
        .from('connections')
        .update({
          connection_test_status: 'failed',
          last_test_at: new Date().toISOString(),
          last_test_error: 'Invalid encrypted data format',
        })
        .eq('id', params.connectionId)

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid encrypted data format',
          message:
            'Connection credentials are corrupted. Please edit the connection and re-enter your credentials.',
        },
        { status: 400 }
      )
    }

    // Decrypt credentials with enhanced error handling
    let credentials: any
    try {
      console.log('🔓 Attempting decryption...')
      credentials = decryptCredentials(connection.encrypted_credentials)
      console.log('✅ Decryption successful')
    } catch (decryptError: any) {
      console.error('❌ DETAILED DECRYPTION ERROR:')
      console.error('  Error message:', decryptError.message)
      console.error('  Error name:', decryptError.name)
      console.error('  Error stack:', decryptError.stack)
      console.error('  Connection ID:', params.connectionId)
      console.error('  Connection created:', connection.created_at)
      console.error('  Encrypted data exists:', !!connection.encrypted_credentials)
      console.error('  Encrypted data length:', connection.encrypted_credentials?.length)

      // Determine specific error type
      let userMessage =
        'Connection credentials could not be decrypted. Please edit the connection and re-enter your credentials.'
      let errorCode = 'DECRYPTION_FAILED'

      if (decryptError.message?.includes('authentication failed')) {
        userMessage =
          'Encryption key mismatch detected. Your credentials were encrypted with a different key. Please re-enter your credentials.'
        errorCode = 'KEY_MISMATCH'
      } else if (decryptError.message?.includes('corrupted data')) {
        userMessage = 'Stored credentials are corrupted. Please re-enter your credentials.'
        errorCode = 'CORRUPTED_DATA'
      } else if (decryptError.message?.includes('invalid encryption key')) {
        userMessage = 'Invalid encryption key. Please contact support if this persists.'
        errorCode = 'INVALID_KEY'
      }

      // Update connection status
      await supabase
        .from('connections')
        .update({
          connection_test_status: 'failed',
          last_test_at: new Date().toISOString(),
          last_test_error: `${errorCode}: ${decryptError.message}`,
        })
        .eq('id', params.connectionId)

      return NextResponse.json(
        {
          success: false,
          error: errorCode,
          message: userMessage,
          debug: {
            originalError: decryptError.message,
            connectionAge: connection.created_at,
            hasEncryptionKey:
              !!process.env.CONNECTIX_ENCRYPTION_KEY || !!process.env.SSH_ENCRYPTION_KEY,
          },
        },
        { status: 400 }
      )
    }

    // Test the connection
    console.log('🔌 Testing SSH connection...')
    const result = await testSSHConnection({
      host: connection.host,
      port: connection.port,
      username: connection.username,
      auth_type: connection.auth_type,
      credentials,
      connection_timeout: connection.connection_timeout,
      strict_host_checking: connection.strict_host_checking,
    })

    // Update connection test status
    await supabase
      .from('connections')
      .update({
        connection_test_status: result.success ? 'success' : 'failed',
        last_test_at: new Date().toISOString(),
        last_test_error: result.success ? null : result.error,
      })
      .eq('id', params.connectionId)

    console.log('✅ Connection test completed:', result.success ? 'SUCCESS' : 'FAILED')
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('❌ UNEXPECTED ERROR in connection test:', error)

    // Update connection status on unexpected error
    try {
      const params = await context.params
      const supabase = await createClient()
      await supabase
        .from('connections')
        .update({
          connection_test_status: 'failed',
          last_test_at: new Date().toISOString(),
          last_test_error: `UNEXPECTED: ${error.message}`,
        })
        .eq('id', params.connectionId)
    } catch (updateError) {
      console.error('Failed to update connection status:', updateError)
    }

    return NextResponse.json(
      {
        success: false,
        error: 'UNEXPECTED_ERROR',
        message: 'An unexpected error occurred during connection test',
        debug: {
          originalError: error.message,
          stack: error.stack,
        },
      },
      { status: 500 }
    )
  }
}
