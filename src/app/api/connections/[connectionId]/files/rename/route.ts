import { NextRequest, NextResponse } from 'next/server'
import { SSHConnectionManager } from '@/lib/ssh/connection-manager'

export async function POST(request: NextRequest, { params: _params }: { params: { connectionId: string } }) {
  try {
    const sessionToken = request.headers.get('x-session-token')
    const { oldPath, newPath } = await request.json()

    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token required' }, { status: 401 })
    }

    if (!oldPath || !newPath) {
      return NextResponse.json({ error: 'Both oldPath and newPath are required' }, { status: 400 })
    }

    await SSHConnectionManager.renameFile(sessionToken, oldPath, newPath)

    return NextResponse.json({ success: true, message: 'File renamed successfully' })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to rename file' }, { status: 500 })
  }
}
