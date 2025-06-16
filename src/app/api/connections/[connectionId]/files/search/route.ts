import { SSHConnectionManager } from '@/lib/ssh/connection-manager'
import { createSSHAuthenticatedRoute } from '@/lib/api/middleware/ssh-auth'
import { successResponse } from '@/lib/api/response'

export const GET = createSSHAuthenticatedRoute(
  async (request, context, { sshSessionToken }) => {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const path = searchParams.get('path') || '/'
    const type = searchParams.get('type') // 'file', 'directory', or 'all'

    if (!query) {
      return Response.json({ error: 'Search query is required' }, { status: 400 })
    }

    const results = await SSHConnectionManager.searchFiles(sshSessionToken, {
      query,
      path,
      type: (type as 'file' | 'directory' | 'all') || 'all',
      maxResults: 100,
    })

    return successResponse({
      results,
      query,
      searchPath: path,
    })
  }
)

export const POST = createSSHAuthenticatedRoute(
  async (request, context, { sshSessionToken }) => {
    const {
      query,
      path = '/',
      type = 'all',
      content = false,
      caseSensitive = false,
      regex = false,
      maxResults = 100,
    } = await request.json()

    if (!query) {
      return Response.json({ error: 'Search query is required' }, { status: 400 })
    }

    const results = await SSHConnectionManager.searchFiles(sshSessionToken, {
      query,
      path,
      type,
      content,
      caseSensitive,
      regex,
      maxResults,
    })

    return successResponse({
      results,
      searchOptions: {
        query,
        path,
        type,
        content,
        caseSensitive,
        regex,
        maxResults,
      },
    })
  }
)
