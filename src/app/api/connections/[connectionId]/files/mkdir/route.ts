import { NextRequest, NextResponse } from 'next/server'
import { SSHConnectionManager } from '@/lib/ssh/connection-manager'

export async function POST(request: NextRequest, { params: _params }: { params: { connectionId: string } }) {
  try {
    const sessionToken = request.headers.get('x-session-token')
    const { path } = await request.json()

    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token required' }, { status: 401 })
    }

    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 })
    }

    await SSHConnectionManager.createDirectory(sessionToken, path)

    return NextResponse.json({ success: true, message: 'Directory created successfully' })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create directory' },
      { status: 500 }
    )
  }
}
