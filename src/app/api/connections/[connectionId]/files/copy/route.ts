import { NextRequest, NextResponse } from 'next/server'
import { SSHConnectionManager } from '@/lib/ssh/connection-manager'

export async function POST(request: NextRequest, { params: _params }: { params: { connectionId: string } }) {
  try {
    const sessionToken = request.headers.get('x-session-token')
    const { sourcePath, destinationPath, overwrite = false } = await request.json()

    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token required' }, { status: 401 })
    }

    if (!sourcePath || !destinationPath) {
      return NextResponse.json(
        {
          error: 'Both sourcePath and destinationPath are required',
        },
        { status: 400 }
      )
    }

    await SSHConnectionManager.copyFile(sessionToken, sourcePath, destinationPath, overwrite)

    return NextResponse.json({
      success: true,
      message: 'File copied successfully',
      sourcePath,
      destinationPath,
    })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to copy file' }, { status: 500 })
  }
}
