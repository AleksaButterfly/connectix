import { SSHConnectionManager } from '@/lib/ssh/connection-manager'
import { createSSHAuthenticatedRoute } from '@/lib/api/middleware/ssh-auth'
import { successResponse } from '@/lib/api/response'

export const GET = createSSHAuthenticatedRoute(
  async (request, context, { sshSessionToken }) => {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path') || '/'

    const files = await SSHConnectionManager.listFiles(sshSessionToken, path)

    return successResponse({ files, currentPath: path })
  }
)
