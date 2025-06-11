import { ORGANIZATION_PAGES } from './constants'

export const getOrgIdFromPath = (path: string): string | null => {
  const match = path.match(/\/dashboard\/organizations\/([a-f0-9-]{36})/)
  return match ? match[1] : null
}

export const getProjectIdFromPath = (path: string): string | null => {
  const match = path.match(/\/projects\/([a-f0-9-]{36})/)
  return match ? match[1] : null
}

export const getConnectionIdFromPath = (path: string): string | null => {
  const match = path.match(/\/connections\/([a-f0-9-]{36})/)
  return match ? match[1] : null
}

export const isOrganizationPage = (path: string): boolean => {
  const orgId = getOrgIdFromPath(path)
  if (!orgId) return false

  // Check if the path matches any of our organization page patterns
  return ORGANIZATION_PAGES.some((pattern) => {
    const regex = pattern
      .replace('[id]', orgId)
      .replace(/\[projectId\]/g, '[a-f0-9-]{36}')
      .replace(/\[connectionId\]/g, '[a-f0-9-]{36}')
    return new RegExp(`^${regex}($|/)`).test(path)
  })
}

export const isProjectPage = (path: string): boolean => {
  return path.includes('/projects/') && getProjectIdFromPath(path) !== null
}

export const isNewProjectPage = (path: string): boolean => {
  return path.endsWith('/projects/new')
}

export const isConnectionPage = (path: string): boolean => {
  return path.includes('/connections/') && getConnectionIdFromPath(path) !== null
}

export const isNewConnectionPage = (path: string): boolean => {
  return path.endsWith('/connections/new')
}