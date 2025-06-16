import { SSHConnectionManager } from '@/lib/ssh/connection-manager'
import { createSSHAuthenticatedRoute } from '@/lib/api/middleware/ssh-auth'
import { successResponse } from '@/lib/api/response'

export const POST = createSSHAuthenticatedRoute(
  async (request, context, { sshSessionToken }) => {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const path = formData.get('path') as string

    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    const remotePath = path.endsWith('/') ? path + file.name : path + '/' + file.name

    // Use writeBinaryFile for all uploads (binary safe)
    await SSHConnectionManager.writeBinaryFile(sshSessionToken, remotePath, buffer)

    return successResponse({
      message: 'File uploaded successfully',
      filename: file.name,
      path: remotePath,
    })
  }
)
