export const ORGANIZATION_PAGES = [
  '/dashboard/organizations/[id]',
  '/dashboard/organizations/[id]/team',
  '/dashboard/organizations/[id]/settings',
  '/dashboard/organizations/[id]/projects/new',
  '/dashboard/organizations/[id]/projects/[projectId]',
  '/dashboard/organizations/[id]/projects/[projectId]/settings',
  '/dashboard/organizations/[id]/projects/[projectId]/connections',
  '/dashboard/organizations/[id]/projects/[projectId]/connections/[connectionId]',
  '/dashboard/organizations/[id]/projects/[projectId]/connections/[connectionId]/browse',
  '/dashboard/organizations/[id]/projects/[projectId]/connections/[connectionId]/edit',
  '/dashboard/organizations/[id]/projects/[projectId]/connections/new',
] as const;