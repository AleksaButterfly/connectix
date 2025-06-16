import { SSHConnectionManager } from '@/lib/ssh/connection-manager'
import { createSSHAuthenticatedRoute } from '@/lib/api/middleware/ssh-auth'
import { successResponse } from '@/lib/api/response'

export const POST = createSSHAuthenticatedRoute(
  async (request, context, { sshSessionToken }) => {
    const { path } = await request.json()

    if (!path) {
      return Response.json({ error: 'Path is required' }, { status: 400 })
    }

    await SSHConnectionManager.createDirectory(sshSessionToken, path)

    return successResponse({ message: 'Directory created successfully' })
  }
)
