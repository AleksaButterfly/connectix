// types/database.ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          username: string
          created_at: string
          updated_at: string
          two_factor_enabled: boolean
        }
        Insert: {
          id: string
          email: string
          username: string
          created_at?: string
          updated_at?: string
          two_factor_enabled?: boolean
        }
        Update: {
          id?: string
          email?: string
          username?: string
          created_at?: string
          updated_at?: string
          two_factor_enabled?: boolean
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          owner_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          owner_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          owner_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          joined_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          joined_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          organization_id: string
          name: string
          slug: string
          description: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          slug: string
          description?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          slug?: string
          description?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      encryption_keys: {
        Row: {
          id: string
          organization_id: string
          key_version: number
          encrypted_key: string
          is_active: boolean
          created_at: string
          rotated_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          key_version?: number
          encrypted_key: string
          is_active?: boolean
          created_at?: string
          rotated_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          key_version?: number
          encrypted_key?: string
          is_active?: boolean
          created_at?: string
          rotated_at?: string | null
        }
      }
      connections: {
        Row: {
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
          custom_options: Json | null
          created_by: string | null
          last_used_at: string | null
          last_used_by: string | null
          connection_test_status: 'untested' | 'success' | 'failed' | null
          last_test_at: string | null
          last_test_error: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          organization_id: string
          project_id?: string | null
          host: string
          port?: number
          username: string
          auth_type: 'password' | 'private_key' | 'key_with_passphrase'
          encrypted_credentials: string
          encryption_key_id: string
          proxy_jump?: string | null
          connection_timeout?: number
          keepalive_interval?: number
          strict_host_checking?: boolean
          custom_options?: Json | null
          created_by?: string | null
          last_used_at?: string | null
          last_used_by?: string | null
          connection_test_status?: 'untested' | 'success' | 'failed' | null
          last_test_at?: string | null
          last_test_error?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          organization_id?: string
          project_id?: string | null
          host?: string
          port?: number
          username?: string
          auth_type?: 'password' | 'private_key' | 'key_with_passphrase'
          encrypted_credentials?: string
          encryption_key_id?: string
          proxy_jump?: string | null
          connection_timeout?: number
          keepalive_interval?: number
          strict_host_checking?: boolean
          custom_options?: Json | null
          created_by?: string | null
          last_used_at?: string | null
          last_used_by?: string | null
          connection_test_status?: 'untested' | 'success' | 'failed' | null
          last_test_at?: string | null
          last_test_error?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      connection_sessions: {
        Row: {
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
        Insert: {
          id?: string
          connection_id: string
          user_id: string
          session_token: string
          client_ip?: string | null
          user_agent?: string | null
          status?: 'active' | 'idle' | 'disconnected' | 'terminated'
          started_at?: string
          last_activity_at?: string
          ended_at?: string | null
          termination_reason?: string | null
          bytes_uploaded?: number
          bytes_downloaded?: number
          commands_executed?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          connection_id?: string
          user_id?: string
          session_token?: string
          client_ip?: string | null
          user_agent?: string | null
          status?: 'active' | 'idle' | 'disconnected' | 'terminated'
          started_at?: string
          last_activity_at?: string
          ended_at?: string | null
          termination_reason?: string | null
          bytes_uploaded?: number
          bytes_downloaded?: number
          commands_executed?: number
          created_at?: string
          updated_at?: string
        }
      }
      connection_activity_logs: {
        Row: {
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
          details: Json | null
          ip_address: string | null
          duration_ms: number | null
          bytes_affected: number | null
          created_at: string
        }
        Insert: {
          id?: string
          connection_id: string
          session_id?: string | null
          user_id?: string | null
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
          details?: Json | null
          ip_address?: string | null
          duration_ms?: number | null
          bytes_affected?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          connection_id?: string
          session_id?: string | null
          user_id?: string | null
          activity_type?:
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
          details?: Json | null
          ip_address?: string | null
          duration_ms?: number | null
          bytes_affected?: number | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      // User & Organization Management
      get_user_organizations: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          slug: string
          owner_id: string
          created_at: string
          updated_at: string
          members_count: number
          projects_count: number
          user_role: string
        }[]
      }
      get_organization_projects: {
        Args: {
          org_id: string
        }
        Returns: {
          id: string
          organization_id: string
          name: string
          slug: string
          description: string | null
          created_by: string | null
          created_at: string
          updated_at: string
          created_by_username: string | null
          connections_count: number
        }[]
      }

      // Organization & Project Permission Functions
      is_organization_member: {
        Args: {
          org_id: string
          check_user_id: string
        }
        Returns: boolean
      }
      is_organization_owner: {
        Args: {
          org_id: string
          check_user_id: string
        }
        Returns: boolean
      }
      is_organization_admin: {
        Args: {
          org_id: string
          check_user_id: string
        }
        Returns: boolean
      }
      is_project_member: {
        Args: {
          project_id: string
          check_user_id: string
        }
        Returns: boolean
      }

      // Connection Permission Functions
      can_access_connection: {
        Args: {
          conn_id: string
          check_user_id: string
        }
        Returns: boolean
      }
      can_manage_connection: {
        Args: {
          conn_id: string
          check_user_id: string
        }
        Returns: boolean
      }

      // Encryption & Utility Functions
      get_encryption_key_id: {
        Args: {
          org_id: string
          proj_id?: string | null
        }
        Returns: string
      }
      generate_slug: {
        Args: {
          input_text: string
        }
        Returns: string
      }
    }
    Enums: {
      member_role: 'owner' | 'admin' | 'member'
      auth_type: 'password' | 'private_key' | 'key_with_passphrase'
      connection_test_status: 'untested' | 'success' | 'failed'
      session_status: 'active' | 'idle' | 'disconnected' | 'terminated'
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
    }
  }
}
