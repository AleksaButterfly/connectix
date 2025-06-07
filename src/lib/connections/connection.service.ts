import { createClient } from '@/lib/supabase/client'
import { getErrorMessageKey } from '@/lib/errors/error-messages'
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
      throw new Error('connections.error.projectIdRequired')
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
      throw new Error(getErrorMessageKey(error))
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
      throw new Error('connections.error.organizationIdRequired')
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
      throw new Error(getErrorMessageKey(error))
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
      throw new Error('connections.error.connectionIdRequired')
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

      throw new Error(getErrorMessageKey(error))
    }

    return data
  },

  // Create a new connection
  async createConnection(
    organizationId: string,
    input: CreateConnectionInput
  ): Promise<Connection> {
    if (!organizationId) {
      throw new Error('connections.error.organizationIdRequired')
    }

    if (!input.project_id) {
      throw new Error('connections.error.projectIdRequired')
    }

    try {
      // Call the server-side API that handles encryption
      const response = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          organizationId,
          input,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Check for specific error codes in the response
        const errorKey = getErrorMessageKey({ message: data.error })
        throw new Error(errorKey)
      }

      return data
    } catch (error: any) {
      // If it's already a translation key, use it, otherwise map it
      const message = error.message || 'connections.error.createFailed'
      const errorKey = message.includes('.error.') ? message : getErrorMessageKey(error)
      throw new Error(errorKey)
    }
  },

  // Update a connection
  async updateConnection(
    connectionId: string,
    updates: UpdateConnectionInput
  ): Promise<Connection> {
    if (!connectionId) {
      throw new Error('connections.error.connectionIdRequired')
    }

    try {
      // Call the server-side API that handles encryption
      const response = await fetch(`/api/connections/${connectionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(updates),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorKey = getErrorMessageKey({ message: data.error })
        throw new Error(errorKey)
      }

      return data
    } catch (error: any) {
      // If it's already a translation key, use it, otherwise map it
      const message = error.message || 'connections.error.updateFailed'
      const errorKey = message.includes('.error.') ? message : getErrorMessageKey(error)
      throw new Error(errorKey)
    }
  },

  // Delete a connection
  async deleteConnection(connectionId: string): Promise<void> {
    if (!connectionId) {
      throw new Error('connections.error.connectionIdRequired')
    }

    const supabase = createClient()
    const { error } = await supabase.from('connections').delete().eq('id', connectionId)

    if (error) {
      throw new Error(getErrorMessageKey(error))
    }
  },

  // Test a connection (without saving)
  async testConnection(input: TestConnectionInput): Promise<TestConnectionResult> {
    try {
      const response = await fetch('/api/connections/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(input),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorKey = getErrorMessageKey({ message: data.error || data.message })
        throw new Error(errorKey)
      }

      return data
    } catch (error: any) {
      const errorKey = getErrorMessageKey(error)
      return {
        success: false,
        message: errorKey,
        error: errorKey,
      }
    }
  },

  // Test an existing connection
  async testExistingConnection(connectionId: string): Promise<TestConnectionResult> {
    if (!connectionId) {
      throw new Error('connections.error.connectionIdRequired')
    }

    // Call the API endpoint (which now only tests, doesn't update DB)
    const response = await fetch(`/api/connections/${connectionId}/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      const errorKey = getErrorMessageKey({ message: errorData.error || errorData.message })

      try {
        const supabase = createClient()
        await supabase
          .from('connections')
          .update({
            connection_test_status: 'failed',
            last_test_at: new Date().toISOString(),
            last_test_error: errorKey,
          })
          .eq('id', connectionId)
      } catch (dbError) {
        // Silent fail - don't throw another error
      }

      throw new Error(errorKey)
    }

    const result = await response.json()

    try {
      const supabase = createClient()
      await supabase
        .from('connections')
        .update({
          connection_test_status: result.success ? 'success' : 'failed',
          last_test_at: new Date().toISOString(),
          last_test_error: result.success ? null : getErrorMessageKey({ message: result.error }),
        })
        .eq('id', connectionId)
    } catch (dbError) {
      // Silent fail - don't throw another error
    }

    return result
  },

  // Get active sessions for a connection
  async getConnectionSessions(connectionId: string): Promise<ConnectionSession[]> {
    if (!connectionId) {
      throw new Error('connections.error.connectionIdRequired')
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('connection_sessions')
      .select('*')
      .eq('connection_id', connectionId)
      .in('status', ['active', 'idle'])
      .order('started_at', { ascending: false })

    if (error) {
      throw new Error(getErrorMessageKey(error))
    }

    return data || []
  },

  // Get activity logs for a connection
  async getConnectionActivityLogs(
    connectionId: string,
    limit = 50
  ): Promise<ConnectionActivityLog[]> {
    if (!connectionId) {
      throw new Error('connections.error.connectionIdRequired')
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('connection_activity_logs')
      .select('*')
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(getErrorMessageKey(error))
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
      return false
    }

    return data || false
  },
}
