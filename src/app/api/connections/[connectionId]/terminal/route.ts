import { NextRequest, NextResponse } from 'next/server'
import { SSHConnectionManager } from '@/lib/ssh/connection-manager'

export async function GET(request: NextRequest, { params: _params }: { params: { connectionId: string } }) {
  // WebSocket upgrade for terminal access
  const upgrade = request.headers.get('upgrade')

  if (upgrade !== 'websocket') {
    return NextResponse.json({ error: 'WebSocket upgrade required' }, { status: 400 })
  }

  // This would typically be handled by a WebSocket server
  // For Next.js, you might need a separate WebSocket server or use Socket.IO
  return NextResponse.json({
    error: 'WebSocket endpoint - implement with Socket.IO',
    message: 'Terminal access requires WebSocket implementation',
  })
}

export async function POST(request: NextRequest, { params: _params }: { params: { connectionId: string } }) {
  try {
    const sessionToken = request.headers.get('x-session-token')
    const { command } = await request.json()

    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token required' }, { status: 401 })
    }

    if (!command) {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 })
    }

    const result = await SSHConnectionManager.executeCommand(sessionToken, command)

    return NextResponse.json({
      success: true,
      output: result.stdout,
      error: result.stderr,
      exitCode: result.code,
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute command' },
      { status: 500 }
    )
  }
}
