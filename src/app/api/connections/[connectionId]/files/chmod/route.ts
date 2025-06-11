import { NextRequest, NextResponse } from 'next/server'
import { SSHConnectionManager } from '@/lib/ssh/connection-manager'

export async function POST(request: NextRequest, { params: _params }: { params: { connectionId: string } }) {
  try {
    const sessionToken = request.headers.get('x-session-token')
    const { path, mode } = await request.json()

    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token required' }, { status: 401 })
    }

    if (!path) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    if (mode === undefined || mode === null) {
      return NextResponse.json({ error: 'File mode is required' }, { status: 400 })
    }

    // Validate mode (should be octal number like 755, 644, etc.)
    const parsedMode = typeof mode === 'string' ? parseInt(mode, 8) : mode
    if (isNaN(parsedMode) || parsedMode < 0 || parsedMode > 0o777) {
      return NextResponse.json({ error: 'Invalid file mode' }, { status: 400 })
    }

    await SSHConnectionManager.changeFilePermissions(sessionToken, path, parsedMode)

    return NextResponse.json({
      success: true,
      message: 'File permissions updated successfully',
      path,
      mode: parsedMode.toString(8),
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to change file permissions' },
      { status: 500 }
    )
  }
}
