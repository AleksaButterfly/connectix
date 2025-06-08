import { createClient } from '@/lib/supabase/client'
import { storableError } from '@/lib/errors'
import type {
  Project,
  ProjectWithDetails,
  CreateProjectInput,
  UpdateProjectInput,
} from '@/types/project'

export const projectService = {
  async getOrganizationProjects(organizationId: string): Promise<ProjectWithDetails[]> {
    const supabase = createClient()

    // Use the database function to get projects with creator info
    const { data, error } = await supabase.rpc('get_organization_projects', {
      org_id: organizationId,
    })

    if (error) throw new Error(storableError(error).message)
    return data || []
  },

  async getProject(projectId: string): Promise<Project | null> {
    const supabase = createClient()

    const { data, error } = await supabase.from('projects').select('*').eq('id', projectId).single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      const apiError = storableError(error)
      throw new Error(apiError.message)
    }

    return data
  },

  async createProject(organizationId: string, input: CreateProjectInput): Promise<Project> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('auth.error.notAuthenticated')

    // Generate slug from name
    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    const { data, error } = await supabase
      .from('projects')
      .insert({
        organization_id: organizationId,
        name: input.name,
        slug,
        description: input.description || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      // The error mapping will handle the duplicate slug error
      const apiError = storableError(error)
      throw new Error(apiError.message)
    }

    return data
  },

  async updateProject(projectId: string, updates: UpdateProjectInput): Promise<Project> {
    const supabase = createClient()

    const updateData: any = {}

    // If name is being updated, regenerate slug
    if (updates.name) {
      updateData.name = updates.name
      updateData.slug = updates.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
    }

    // Update description if provided
    if (updates.description !== undefined) {
      updateData.description = updates.description
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select()
      .single()

    if (error) {
      const apiError = storableError(error)
      throw new Error(apiError.message)
    }

    return data
  },

  async deleteProject(projectId: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('projects').delete().eq('id', projectId)

    if (error) throw new Error(storableError(error).message)
  },

  async checkProjectAccess(projectId: string): Promise<boolean> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase.rpc('is_project_member', {
      project_id: projectId,
      check_user_id: user.id,
    })

    if (error) return false
    return data || false
  },

  async checkProjectAdminAccess(projectId: string): Promise<boolean> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false

    // First get the project's organization
    const { data: project } = await supabase
      .from('projects')
      .select('organization_id')
      .eq('id', projectId)
      .single()

    if (!project) return false

    // Check if user is admin or owner of the organization
    const { data, error } = await supabase.rpc('is_organization_admin', {
      org_id: project.organization_id,
      check_user_id: user.id,
    })

    if (error) return false
    return data || false
  },
}
