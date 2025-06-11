import { SSHConnectionManager } from '@/lib/ssh/connection-manager'
import { withErrorHandler, withSession } from '@/lib/api/middleware'
import { successResponse } from '@/lib/api/response'

export const GET = withErrorHandler(
  withSession(async (request, { params: _params }: { params: { connectionId: string } }, { sessionToken }) => {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path') || '/'

    const files = await SSHConnectionManager.listFiles(sessionToken, path)

    return successResponse({ files, currentPath: path })
  })
)
