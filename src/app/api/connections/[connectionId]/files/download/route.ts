import { NextRequest, NextResponse } from 'next/server'
import { SSHConnectionManager } from '@/lib/ssh/connection-manager'

export async function GET(request: NextRequest, { params }: { params: { connectionId: string } }) {
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

    const { buffer, filename, mimeType } = await SSHConnectionManager.downloadFile(
      sessionToken,
      path
    )

    return new Response(buffer, {
      headers: {
        'Content-Type': mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to download file' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { connectionId: string } }) {
  try {
    const sessionToken = request.headers.get('x-session-token')
    const { paths } = await request.json() // Array of file paths for bulk download

    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token required' }, { status: 401 })
    }

    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json({ error: 'File paths array is required' }, { status: 400 })
    }

    // Create a zip file for multiple files
    const zipBuffer = await SSHConnectionManager.downloadMultipleFiles(sessionToken, paths)

    return new Response(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="files.zip"',
        'Content-Length': zipBuffer.length.toString(),
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to download files' },
      { status: 500 }
    )
  }
}
