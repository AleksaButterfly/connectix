import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const {
      host,
      port,
      username,
      auth_type,
      credentials,
      connection_timeout,
      strict_host_checking,
    } = body

    if (!host || !username || !auth_type || !credentials) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required connection parameters',
          message: 'Host, username, auth_type, and credentials are required',
        },
        { status: 400 }
      )
    }

    // Validate credentials based on auth type
    if (auth_type === 'password' && !credentials.password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password is required for password authentication',
          message: 'Please provide a password',
        },
        { status: 400 }
      )
    }

    if (
      (auth_type === 'private_key' || auth_type === 'key_with_passphrase') &&
      !credentials.privateKey
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Private key is required for key-based authentication',
          message: 'Please provide a private key',
        },
        { status: 400 }
      )
    }

    if (auth_type === 'key_with_passphrase' && !credentials.passphrase) {
      return NextResponse.json(
        {
          success: false,
          error: 'Passphrase is required for encrypted private key',
          message: 'Please provide the passphrase for your private key',
        },
        { status: 400 }
      )
    }

    const result = await testSSHConnection({
      host,
      port: port || 22,
      username,
      auth_type,
      credentials,
      connection_timeout: connection_timeout || 30,
      strict_host_checking: strict_host_checking ?? true,
    })

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Test connection error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'An unexpected error occurred during connection test',
      },
      { status: 500 }
    )
  }
}
