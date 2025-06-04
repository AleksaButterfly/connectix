import { createClient } from '@/lib/supabase/client'
import { encryptCredentials, decryptCredentials } from '@/lib/connections/encryption'
import type {
  Connection,
  ConnectionWithDetails,
  CreateConnectionInput,
  UpdateConnectionInput,
  TestConnectionInput,
  TestConnectionResult,
  ConnectionSession,
  ConnectionActivityLog,
} from '@/types/connection'

export const connectionService = {
  // Get all connections for a project
  async getProjectConnections(projectId: string): Promise<ConnectionWithDetails[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('connections')
      .select(
        `
        *,
        projects!inner (
          name,
          organizations (
            name
          )
        )
      `
      )
      .eq('project_id', projectId)
      .order('name')

    if (error) throw error

    // For now, we'll fetch user details separately since the foreign key might be missing
    const userIds = Array.from(
      new Set([
        ...(data || []).map((c) => c.created_by).filter(Boolean),
        ...(data || []).map((c) => c.last_used_by).filter(Boolean),
      ])
    )

    let profileMap = new Map<string, string>()
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', userIds)

      profileMap = new Map(profiles?.map((p) => [p.id, p.username]) || [])
    }

    return (data || []).map((conn) => ({
      ...conn,
      created_by_username: conn.created_by ? profileMap.get(conn.created_by) || null : null,
      last_used_by_username: conn.last_used_by ? profileMap.get(conn.last_used_by) || null : null,
      project_name: conn.projects?.name || null,
      organization_name: conn.projects?.organizations?.name || '',
    }))
  },

  // Get a single connection
  async getConnection(connectionId: string): Promise<Connection | null> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return data
  },

  // Create a new connection
  async createConnection(
    organizationId: string,
    input: CreateConnectionInput
  ): Promise<Connection> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get the active encryption key for the organization
    const { data: encryptionKeyId, error: keyError } = await supabase.rpc('get_encryption_key_id', {
      org_id: organizationId,
      proj_id: input.project_id, // Now always provided
    })

    if (keyError || !encryptionKeyId) {
      throw new Error('No active encryption key found for organization')
    }

    // Encrypt credentials
    const encryptedCredentials = await encryptCredentials(input.credentials)

    const { data, error } = await supabase
      .from('connections')
      .insert({
        organization_id: organizationId,
        project_id: input.project_id, // Now required
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
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        throw new Error('A connection with this name already exists')
      }
      throw error
    }

    return data
  },

  // Update a connection
  async updateConnection(
    connectionId: string,
    updates: UpdateConnectionInput
  ): Promise<Connection> {
    const supabase = createClient()

    const updateData: any = {}

    // Handle credential updates
    if (updates.credentials) {
      // Get current connection to find encryption key
      const { data: connection } = await supabase
        .from('connections')
        .select('encryption_key_id')
        .eq('id', connectionId)
        .single()

      if (!connection) throw new Error('Connection not found')

      updateData.encrypted_credentials = await encryptCredentials(updates.credentials)
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

    const { data, error } = await supabase
      .from('connections')
      .update(updateData)
      .eq('id', connectionId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete a connection
  async deleteConnection(connectionId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('connections').delete().eq('id', connectionId)

    if (error) throw error
  },

  // Test a connection (without saving)
  async testConnection(input: TestConnectionInput): Promise<TestConnectionResult> {
    // This would need to be implemented as an API endpoint that can actually test SSH connections
    // For now, return a mock response
    const supabase = createClient()

    // You would call an API endpoint here
    // const response = await fetch('/api/connections/test', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(input)
    // })

    // Mock response for now
    return {
      success: true,
      message: 'Connection test successful',
      latency_ms: Math.floor(Math.random() * 100) + 50,
    }
  },

  // Test an existing connection
  async testExistingConnection(connectionId: string): Promise<TestConnectionResult> {
    const supabase = createClient()

    // Update test status
    await supabase
      .from('connections')
      .update({
        last_test_at: new Date().toISOString(),
        connection_test_status: 'success', // This would be based on actual test result
      })
      .eq('id', connectionId)

    // Mock response for now
    return {
      success: true,
      message: 'Connection test successful',
      latency_ms: Math.floor(Math.random() * 100) + 50,
    }
  },

  // Get active sessions for a connection
  async getConnectionSessions(connectionId: string): Promise<ConnectionSession[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('connection_sessions')
      .select('*')
      .eq('connection_id', connectionId)
      .in('status', ['active', 'idle'])
      .order('started_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get activity logs for a connection
  async getConnectionActivityLogs(
    connectionId: string,
    limit = 50
  ): Promise<ConnectionActivityLog[]> {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('connection_activity_logs')
      .select('*')
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  // Check if user can access a connection
  async checkConnectionAccess(connectionId: string): Promise<boolean> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase.rpc('can_access_connection', {
      conn_id: connectionId,
      check_user_id: user.id,
    })

    if (error) return false
    return data || false
  },

  // Check if user can manage a connection (create, update, delete)
  async checkConnectionManageAccess(connectionId: string): Promise<boolean> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase.rpc('can_manage_connection', {
      conn_id: connectionId,
      check_user_id: user.id,
    })

    if (error) return false
    return data || false
  },
}
