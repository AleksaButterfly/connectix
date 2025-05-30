export interface Organization {
  id: string
  name: string
  slug: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface OrganizationMember {
  id: string
  organization_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  joined_at: string
}

export interface Project {
  id: string
  organization_id: string
  name: string
  slug: string
  description?: string
  created_at: string
  updated_at: string
}

// For displaying organizations with additional info
export interface OrganizationWithDetails extends Organization {
  membersCount: number
  projectsCount: number
}
