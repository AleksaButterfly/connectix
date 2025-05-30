import { createClient } from '@/lib/supabase/client'
import type { Organization, OrganizationWithDetails } from '@/types/organization'

export const organizationService = {
  async getOrganizations(): Promise<OrganizationWithDetails[]> {
    const supabase = createClient()

    // Get organizations without any joins to avoid policy recursion
    const { data: organizations, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    if (!organizations) return []

    // For now, return organizations with default counts to avoid the policy issue
    return organizations.map((org) => ({
      ...org,
      membersCount: 1, // Default to 1 (the owner)
      projectsCount: 0, // Default to 0
    }))
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
}
