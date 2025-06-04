import { NextRequest, NextResponse } from 'next/server'
import { SSHConnectionManager } from '@/lib/ssh/connection-manager'

export async function GET(request: NextRequest, { params }: { params: { connectionId: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path') || '/'
    const sessionToken = request.headers.get('x-session-token')

    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token required' }, { status: 401 })
    }

    const diskUsage = await SSHConnectionManager.getDiskUsage(sessionToken, path)

    return NextResponse.json({
      success: true,
      diskUsage,
      path,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to get disk usage' },
      { status: 500 }
    )
  }
}
