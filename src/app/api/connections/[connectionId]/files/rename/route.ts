import { SSHConnectionManager } from '@/lib/ssh/connection-manager'
import { createSSHAuthenticatedRoute } from '@/lib/api/middleware/ssh-auth'
import { successResponse } from '@/lib/api/response'

export const POST = createSSHAuthenticatedRoute(
  async (request, context, { sshSessionToken }) => {
    const { oldPath, newPath } = await request.json()

    if (!oldPath || !newPath) {
      return Response.json({ error: 'Both oldPath and newPath are required' }, { status: 400 })
    }

    await SSHConnectionManager.renameFile(sshSessionToken, oldPath, newPath)

    return successResponse({ message: 'File renamed successfully' })
  }
)
