// app/api/connections/[connectionId]/files/stat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { SSHConnectionManager } from '@/lib/ssh/connection-manager'

export async function GET(request: NextRequest, { params: _params }: { params: { connectionId: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')
    const sessionToken = request.headers.get('x-session-token')

    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token required' }, { status: 401 })
    }

    if (!path) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    const fileInfo = await SSHConnectionManager.getFileInfo(sessionToken, path)

    return NextResponse.json({
      success: true,
      fileInfo,
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get file information' },
      { status: 500 }
    )
  }
}
