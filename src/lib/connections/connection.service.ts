import { createClient } from '@/lib/supabase/client'
import { encryptCredentials } from '@/lib/connections/encryption'
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
    if (!projectId) {
      throw new Error('Project ID is required!')
    }

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

    if (error) {
      console.error('Error fetching project connections:', error)
      throw error
    }

    // Fetch user details separately since the foreign key might be missing
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

  // Get all connections for an organization (across all projects)
  async getOrganizationConnections(organizationId: string): Promise<ConnectionWithDetails[]> {
    if (!organizationId) {
      throw new Error('Organization ID is required!')
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('connections')
      .select(
        `
        *,
        projects (
          name,
          organizations!inner (
            name
          )
        )
      `
      )
      .eq('organization_id', organizationId)
      .order('name')

    if (error) {
      console.error('Error fetching organization connections:', error)
      throw error
    }

    // Fetch user details
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
    if (!connectionId) {
      throw new Error('Connection ID is required!')
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      console.error('Error fetching connection:', error)
      throw error
    }

    return data
  },

  // Create a new connection
  async createConnection(
    organizationId: string,
    input: CreateConnectionInput
  ): Promise<Connection> {
    if (!organizationId) {
      throw new Error('Organization ID is required!')
    }

    if (!input.project_id) {
      throw new Error('Project ID is required!')
    }

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Get the active encryption key for the organization
    const { data: encryptionKeyId, error: keyError } = await supabase.rpc('get_encryption_key_id', {
      org_id: organizationId,
      proj_id: input.project_id,
    })

    if (keyError || !encryptionKeyId) {
      console.error('Encryption key error:', keyError)
      throw new Error('No active encryption key found for organization')
    }

    // Encrypt credentials
    const encryptedCredentials = await encryptCredentials(input.credentials)

    // Insert connection without returning data to avoid RLS issues
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
        throw new Error('A connection with this name already exists')
      }
      if (error.code === '42501') {
        throw new Error('Permission denied - make sure you are an admin of this organization')
      }
      throw error
    }

    // Fetch the created connection by name and project (unique combination)
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
      throw fetchError
    }

    return connection
  },

  // Update a connection
  async updateConnection(
    connectionId: string,
    updates: UpdateConnectionInput
  ): Promise<Connection> {
    if (!connectionId) {
      throw new Error('Connection ID is required!')
    }

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

    // Update and then fetch separately
    const { error } = await supabase.from('connections').update(updateData).eq('id', connectionId)

    if (error) {
      console.error('Error updating connection:', error)
      throw error
    }

    // Fetch the updated connection
    const { data: connection, error: fetchError } = await supabase
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (fetchError) {
      console.error('Error fetching updated connection:', fetchError)
      throw fetchError
    }

    return connection
  },

  // Delete a connection
  async deleteConnection(connectionId: string): Promise<void> {
    if (!connectionId) {
      throw new Error('Connection ID is required!')
    }

    const supabase = createClient()
    const { error } = await supabase.from('connections').delete().eq('id', connectionId)

    if (error) {
      console.error('Error deleting connection:', error)
      throw error
    }
  },

  // Test a connection (without saving)
  async testConnection(input: TestConnectionInput): Promise<TestConnectionResult> {
    // This would need to be implemented as an API endpoint that can actually test SSH connections
    // For now, return a mock response

    // You would call an API endpoint here
    // const response = await fetch('/api/connections/test', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(input)
    // })

    // Mock response for now
    return {
      success: true,
      message: 'Connection test successful (mock)',
      latency_ms: Math.floor(Math.random() * 100) + 50,
    }
  },

  // Test an existing connection
  async testExistingConnection(connectionId: string): Promise<TestConnectionResult> {
    if (!connectionId) {
      throw new Error('Connection ID is required!')
    }

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
      message: 'Connection test successful (mock)',
      latency_ms: Math.floor(Math.random() * 100) + 50,
    }
  },

  // Get active sessions for a connection
  async getConnectionSessions(connectionId: string): Promise<ConnectionSession[]> {
    if (!connectionId) {
      throw new Error('Connection ID is required!')
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('connection_sessions')
      .select('*')
      .eq('connection_id', connectionId)
      .in('status', ['active', 'idle'])
      .order('started_at', { ascending: false })

    if (error) {
      console.error('Error fetching connection sessions:', error)
      throw error
    }

    return data || []
  },

  // Get activity logs for a connection
  async getConnectionActivityLogs(
    connectionId: string,
    limit = 50
  ): Promise<ConnectionActivityLog[]> {
    if (!connectionId) {
      throw new Error('Connection ID is required!')
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('connection_activity_logs')
      .select('*')
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching activity logs:', error)
      throw error
    }

    return data || []
  },

  // Check if user can access a connection
  async checkConnectionAccess(connectionId: string): Promise<boolean> {
    if (!connectionId) {
      return false
    }

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return false
    }

    const { data, error } = await supabase.rpc('can_access_connection', {
      conn_id: connectionId,
      check_user_id: user.id,
    })

    if (error) {
      console.error('Error checking connection access:', error)
      return false
    }

    return data || false
  },

  // Check if user can manage a connection (create, update, delete)
  async checkConnectionManageAccess(connectionId: string): Promise<boolean> {
    if (!connectionId) {
      return false
    }

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return false
    }

    const { data, error } = await supabase.rpc('can_manage_connection', {
      conn_id: connectionId,
      check_user_id: user.id,
    })

    if (error) {
      console.error('Error checking connection manage access:', error)
      return false
    }

    return data || false
  },
}
