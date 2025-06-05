import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encryptCredentials, decryptCredentials } from '@/lib/connections/encryption'
import type { UpdateConnectionInput } from '@/types/connection'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ connectionId: string }> }
) {
  try {
    const params = await context.params
    const updates: UpdateConnectionInput = await request.json()

    console.log('🔐 SERVER-SIDE CONNECTION UPDATE START')
    console.log('  Connection ID:', params.connectionId)
    if (updates.credentials) {
      console.log('  Updating credentials keys:', Object.keys(updates.credentials))
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const updateData: any = {}

    // Handle credential updates with SERVER-SIDE encryption
    if (updates.credentials) {
      console.log('🔐 SERVER-SIDE CREDENTIAL ENCRYPTION START')
      console.log('  CONNECTIX_ENCRYPTION_KEY exists:', !!process.env.CONNECTIX_ENCRYPTION_KEY)
      console.log('  SSH_ENCRYPTION_KEY exists:', !!process.env.SSH_ENCRYPTION_KEY)

      // Get current connection to find encryption key
      const { data: connection } = await supabase
        .from('connections')
        .select('encryption_key_id')
        .eq('id', params.connectionId)
        .single()

      if (!connection) {
        return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
      }

      const encryptedCredentials = encryptCredentials(updates.credentials)
      console.log('🔐 SERVER-SIDE CREDENTIAL ENCRYPTION COMPLETE')
      console.log('  Encrypted data length:', encryptedCredentials.length)

      // Test immediate decryption
      try {
        const testDecrypt = decryptCredentials(encryptedCredentials)
        console.log('  ✅ Immediate decryption test: SUCCESS')
        console.log('  Decrypted keys:', Object.keys(testDecrypt))
      } catch (testError) {
        console.log('  ❌ Immediate decryption test: FAILED -', testError.message)
        return NextResponse.json({ error: 'Encryption/decryption test failed' }, { status: 500 })
      }

      updateData.encrypted_credentials = encryptedCredentials
    }

    // Copy other updates
    const fields = [
      'name',
      'description',
      'host',
      'port',
      'username',
      'auth_type',
      'proxy_jump',
      'connection_timeout',
      'keepalive_interval',
      'strict_host_checking',
      'custom_options',
    ]

    fields.forEach((field) => {
      if (field in updates) {
        updateData[field] = (updates as any)[field]
      }
    })

    // Update connection
    const { error } = await supabase
      .from('connections')
      .update(updateData)
      .eq('id', params.connectionId)

    if (error) {
      console.error('Error updating connection:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Fetch the updated connection
    const { data: connection, error: fetchError } = await supabase
      .from('connections')
      .select('*')
      .eq('id', params.connectionId)
      .single()

    if (fetchError) {
      console.error('Error fetching updated connection:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 400 })
    }

    console.log('🔐 SERVER-SIDE CONNECTION UPDATE SUCCESS')
    return NextResponse.json(connection)
  } catch (error: any) {
    console.error('❌ Server-side connection update error:', error)
    return NextResponse.json(
      { error: 'Failed to update connection: ' + error.message },
      { status: 500 }
    )
  }
}
