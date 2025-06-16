'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { projectService } from '@/lib/projects/project.service'
import { organizationService } from '@/lib/organizations/organization.service'
import { useIntl } from '@/lib/i18n'
import type { ProjectWithDetails } from '@/types/project'
import type { Organization } from '@/types/organization'

interface UseProjectDataOptions {
  orgId: string
  projectId: string
}

interface UseProjectDataReturn {
  project: ProjectWithDetails | null
  organization: Organization | null
  isLoading: boolean
  error: string
  isAdmin: boolean
  refetch: () => Promise<void>
}

export const useProjectData = ({ 
  orgId, 
  projectId 
}: UseProjectDataOptions): UseProjectDataReturn => {
  const intl = useIntl()
  const router = useRouter()
  
  const [project, setProject] = useState<ProjectWithDetails | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError('')

      // Check access first
      const hasAccess = await projectService.checkProjectAccess(projectId)
      if (!hasAccess) {
        router.push(`/dashboard/organizations/${orgId}`)
        return
      }

      // Check admin access
      const adminAccess = await projectService.checkProjectAdminAccess(projectId)
      setIsAdmin(adminAccess)

      // Fetch project details
      const [proj, org] = await Promise.all([
        projectService.getProject(projectId),
        organizationService.getOrganization(orgId),
      ])

      if (!proj || !org) {
        router.push(`/dashboard/organizations/${orgId}`)
        return
      }

      // Get project with details (including creator username)
      const projects = await projectService.getOrganizationProjects(orgId)
      const projectWithDetails = projects.find((p) => p.id === projectId)

      // If we have projectWithDetails, use it; otherwise create a ProjectWithDetails object
      if (projectWithDetails) {
        setProject(projectWithDetails)
      } else {
        // Convert Project to ProjectWithDetails
        const enhancedProject: ProjectWithDetails = {
          ...proj,
          created_by_username: null,
        }
        setProject(enhancedProject)
      }

      setOrganization(org)
    } catch (err: unknown) {
      console.error('Failed to fetch project:', err)
      const errorMessage = err instanceof Error 
        ? err.message 
        : intl.formatMessage({ id: 'projects.error.loadFailed' })
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [orgId, projectId, router])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    project,
    organization,
    isLoading,
    error,
    isAdmin,
    refetch: fetchData
  }
}