import { encryptCredentials } from '@/lib/connections/encryption'
import type { CreateConnectionInput } from '@/types/connection'
import { createAuthenticatedRoute, ApiErrorResponse } from '@/lib/api/middleware'
import { successResponse } from '@/lib/api/response'
import { ErrorCodes } from '@/lib/api/errorCodes'

export const POST = createAuthenticatedRoute(async (request, _context, { user, supabase }) => {
    const body = await request.json()
    const { organizationId, input }: { organizationId: string; input: CreateConnectionInput } = body

    if (!organizationId) {
      throw new ApiErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Organization ID is required!',
        400
      )
    }

    if (!input.project_id) {
      throw new ApiErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Project ID is required!',
        400
      )
    }

    // Get the active encryption key for the organization
    const { data: encryptionKeyId, error: keyError } = await supabase.rpc('get_encryption_key_id', {
      org_id: organizationId,
      proj_id: input.project_id,
    })

    if (keyError || !encryptionKeyId) {
      console.error('Encryption key error:', keyError)
      throw new ApiErrorResponse(
        ErrorCodes.INTERNAL_ERROR,
        'No active encryption key found for organization',
        400
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
        throw new ApiErrorResponse(
          ErrorCodes.DUPLICATE_ERROR,
          'A connection with this name already exists',
          409
        )
      }
      if (error.code === '42501') {
        throw new ApiErrorResponse(
          ErrorCodes.PERMISSION_DENIED,
          'Permission denied - make sure you are an admin of this organization',
          403
        )
      }
      throw new ApiErrorResponse(
        ErrorCodes.DATABASE_ERROR,
        error.message,
        400
      )
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
      throw new ApiErrorResponse(
        ErrorCodes.DATABASE_ERROR,
        fetchError.message,
        400
      )
    }

    return successResponse(connection, { action: 'created' }, 201)
})
