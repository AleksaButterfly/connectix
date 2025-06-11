export interface Connection {
  id: string
  name: string
  description: string | null
  organization_id: string
  project_id: string | null
  host: string
  port: number
  username: string
  auth_type: 'password' | 'private_key' | 'key_with_passphrase'
  encrypted_credentials: string
  encryption_key_id: string
  proxy_jump: string | null
  connection_timeout: number
  keepalive_interval: number
  strict_host_checking: boolean
  custom_options: Record<string, unknown> | null
  created_by: string | null
  last_used_at: string | null
  last_used_by: string | null
  connection_test_status: 'untested' | 'success' | 'failed' | null
  last_test_at: string | null
  last_test_error: string | null
  created_at: string
  updated_at: string
}

// For displaying connections with additional info
export interface ConnectionWithDetails extends Connection {
  created_by_username: string | null
  last_used_by_username: string | null
  project_name: string | null
  organization_name: string
}

// For creating a new connection
export interface CreateConnectionInput {
  name: string
  description?: string | null
  project_id: string // Made required since connections are project-only
  host: string
  port?: number
  username: string
  auth_type: 'password' | 'private_key' | 'key_with_passphrase'
  credentials: {
    password?: string
    privateKey?: string
    passphrase?: string
  }
  proxy_jump?: string | null
  connection_timeout?: number
  keepalive_interval?: number
  strict_host_checking?: boolean
  custom_options?: Record<string, unknown> | null
}

// For updating an existing connection
export interface UpdateConnectionInput {
  name?: string
  description?: string | null
  host?: string
  port?: number
  username?: string
  auth_type?: 'password' | 'private_key' | 'key_with_passphrase'
  credentials?: {
    password?: string
    privateKey?: string
    passphrase?: string
  }
  proxy_jump?: string | null
  connection_timeout?: number
  keepalive_interval?: number
  strict_host_checking?: boolean
  custom_options?: Record<string, unknown> | null
}

// Connection session
export interface ConnectionSession {
  id: string
  connection_id: string
  user_id: string
  session_token: string
  client_ip: string | null
  user_agent: string | null
  status: 'active' | 'idle' | 'disconnected' | 'terminated'
  started_at: string
  last_activity_at: string
  ended_at: string | null
  termination_reason: string | null
  bytes_uploaded: number
  bytes_downloaded: number
  commands_executed: number
  created_at: string
  updated_at: string
}

// Connection activity log entry
export interface ConnectionActivityLog {
  id: string
  connection_id: string
  session_id: string | null
  user_id: string | null
  activity_type:
    | 'connection.created'
    | 'connection.updated'
    | 'connection.deleted'
    | 'connection.tested'
    | 'session.started'
    | 'session.ended'
    | 'file.read'
    | 'file.write'
    | 'file.delete'
    | 'file.rename'
    | 'directory.create'
    | 'directory.delete'
    | 'directory.list'
    | 'command.execute'
    | 'error.occurred'
  details: Record<string, unknown> | null
  ip_address: string | null
  duration_ms: number | null
  bytes_affected: number | null
  created_at: string
}

// For testing a connection
export interface TestConnectionInput {
  host: string
  port: number
  username: string
  auth_type: 'password' | 'private_key' | 'key_with_passphrase'
  credentials: {
    password?: string
    privateKey?: string
    passphrase?: string
  }
  proxy_jump?: string | null
  connection_timeout?: number
  strict_host_checking?: boolean
}

// Test connection result
export interface TestConnectionResult {
  success: boolean
  message: string
  error?: string
  latency_ms?: number
}
