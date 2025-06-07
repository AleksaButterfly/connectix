import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { encryptCredentials, decryptCredentials } from '@/lib/connections/encryption'
import type { CreateConnectionInput } from '@/types/connection'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, input }: { organizationId: string; input: CreateConnectionInput } = body

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required!' }, { status: 400 })
    }

    if (!input.project_id) {
      return NextResponse.json({ error: 'Project ID is required!' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get the active encryption key for the organization
    const { data: encryptionKeyId, error: keyError } = await supabase.rpc('get_encryption_key_id', {
      org_id: organizationId,
      proj_id: input.project_id,
    })

    if (keyError || !encryptionKeyId) {
      console.error('Encryption key error:', keyError)
      return NextResponse.json(
        { error: 'No active encryption key found for organization' },
        { status: 400 }
      )
    }

    const encryptedCredentials = encryptCredentials(input.credentials)

    // Insert connection
    const { error } = await supabase.from('connections').insert({
      organization_id: organizationId,
      project_id: input.project_id,
      name: input.name,
      description: input.description || null,
      host: input.host,
      port: input.port || 22,
      username: input.username,
      auth_type: input.auth_type,
      encrypted_credentials: encryptedCredentials,
      encryption_key_id: encryptionKeyId,
      proxy_jump: input.proxy_jump || null,
      connection_timeout: input.connection_timeout || 30,
      keepalive_interval: input.keepalive_interval || 60,
      strict_host_checking: input.strict_host_checking ?? true,
      custom_options: input.custom_options || null,
      created_by: user.id,
    })

    if (error) {
      console.error('Error creating connection:', error)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A connection with this name already exists' },
          { status: 409 }
        )
      }
      if (error.code === '42501') {
        return NextResponse.json(
          { error: 'Permission denied - make sure you are an admin of this organization' },
          { status: 403 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Fetch the created connection
    const { data: connection, error: fetchError } = await supabase
      .from('connections')
      .select('*')
      .eq('project_id', input.project_id)
      .eq('name', input.name)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError) {
      console.error('Error fetching created connection:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 400 })
    }

    return NextResponse.json(connection)
  } catch (error: any) {
    console.error('Server-side connection creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create connection: ' + error.message },
      { status: 500 }
    )
  }
}
