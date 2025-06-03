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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
        }[]
      }
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
      generate_slug: {
        Args: {
          input_text: string
        }
        Returns: string
      }
    }
    Enums: {
      member_role: 'owner' | 'admin' | 'member'
    }
  }
}
