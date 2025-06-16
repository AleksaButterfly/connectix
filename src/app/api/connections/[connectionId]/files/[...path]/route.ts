import { NextResponse } from 'next/server'
import { SSHConnectionManager } from '@/lib/ssh/connection-manager'
import { createSSHAuthenticatedRoute } from '@/lib/api/middleware/ssh-auth'
import { successResponse } from '@/lib/api/response'

// Read file content
export const GET = createSSHAuthenticatedRoute(
  async (request, context, { sshSessionToken }) => {
    const params = await context.params
    const path = params.path as string[]
    const filePath = '/' + path.join('/')

    const content = await SSHConnectionManager.readFile(sshSessionToken, filePath)

    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  }
)

// Write/update file content
export const PUT = createSSHAuthenticatedRoute(
  async (request, context, { sshSessionToken }) => {
    const params = await context.params
    const path = params.path as string[]
    const filePath = '/' + path.join('/')
    const { content } = await request.json()

    await SSHConnectionManager.writeFile(sshSessionToken, filePath, content)

    return successResponse({ message: 'File saved successfully' })
  }
)

// Delete file or directory
export const DELETE = createSSHAuthenticatedRoute(
  async (request, context, { sshSessionToken }) => {
    const params = await context.params
    const path = params.path as string[]
    const filePath = '/' + path.join('/')

    await SSHConnectionManager.deleteFile(sshSessionToken, filePath)

    return successResponse({ message: 'File deleted successfully' })
  }
)
