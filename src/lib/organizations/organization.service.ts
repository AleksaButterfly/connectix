import { createClient } from '@/lib/supabase/client'
import type { Organization, OrganizationWithDetails } from '@/types/organization'
import type { Database } from '@/types/database'

export const organizationService = {
  async getOrganizations(): Promise<OrganizationWithDetails[]> {
    const supabase = createClient()

    // Use the new database function to get organizations with counts
    const { data, error } = await supabase.rpc('get_user_organizations')

    if (error) throw error
    if (!data) return []

    // Map the function results to our OrganizationWithDetails type
    return data.map(
      (org: Database['public']['Functions']['get_user_organizations']['Returns'][0]) => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        owner_id: org.owner_id,
        created_at: org.created_at,
        updated_at: org.updated_at,
        membersCount: Number(org.members_count),
        projectsCount: Number(org.projects_count),
      })
    )
  },

  async createOrganization(name: string): Promise<Organization> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Generate slug from name (not unique anymore, just for display/SEO)
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name,
        slug, // Slug doesn't need to be unique now
        owner_id: user.id,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getOrganization(id: string): Promise<Organization | null> {
    const supabase = createClient()
    const { data, error } = await supabase.from('organizations').select('*').eq('id', id).single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw error
    }

    return data
  },

  async updateOrganization(
    id: string,
    updates: { name?: string; slug?: string }
  ): Promise<Organization> {
    const supabase = createClient()

    // If name is being updated, regenerate slug
    if (updates.name && !updates.slug) {
      updates.slug = updates.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
    }

    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteOrganization(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from('organizations').delete().eq('id', id)

    if (error) throw error
  },

  async isOrganizationOwner(organizationId: string): Promise<boolean> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase.rpc('is_organization_owner', {
      org_id: organizationId,
      check_user_id: user.id,
    })

    if (error) return false
    return data || false
  },

  async isOrganizationAdmin(organizationId: string): Promise<boolean> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase.rpc('is_organization_admin', {
      org_id: organizationId,
      check_user_id: user.id,
    })

    if (error) return false
    return data || false
  },
}
