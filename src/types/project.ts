export interface Project {
  id: string
  organization_id: string
  name: string
  slug: string
  description: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

// For displaying projects with additional info
export interface ProjectWithDetails extends Project {
  created_by_username: string | null
}

// For creating a new project
export interface CreateProjectInput {
  name: string
  description?: string | null
}

// For updating an existing project
export interface UpdateProjectInput {
  name?: string
  description?: string | null
}
