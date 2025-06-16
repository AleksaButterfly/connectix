import { SSHConnectionManager } from '@/lib/ssh/connection-manager'
import { createSSHAuthenticatedRoute } from '@/lib/api/middleware/ssh-auth'
import { successResponse } from '@/lib/api/response'

export const POST = createSSHAuthenticatedRoute(
  async (request, context, { sshSessionToken }) => {
    const { path, mode } = await request.json()

    if (!path) {
      return Response.json({ error: 'File path is required' }, { status: 400 })
    }

    if (mode === undefined || mode === null) {
      return Response.json({ error: 'File mode is required' }, { status: 400 })
    }

    // Validate mode (should be octal number like 755, 644, etc.)
    const parsedMode = typeof mode === 'string' ? parseInt(mode, 8) : mode
    if (isNaN(parsedMode) || parsedMode < 0 || parsedMode > 0o777) {
      return Response.json({ error: 'Invalid file mode' }, { status: 400 })
    }

    await SSHConnectionManager.changeFilePermissions(sshSessionToken, path, parsedMode)

    return successResponse({
      message: 'File permissions updated successfully',
      path,
      mode: parsedMode.toString(8),
    })
  }
)
