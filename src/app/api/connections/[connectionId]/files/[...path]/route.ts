import { NextRequest, NextResponse } from 'next/server'
import { SSHConnectionManager } from '@/lib/ssh/connection-manager'

// Read file content
export async function GET(
  request: NextRequest,
  { params }: { params: { connectionId: string; path: string[] } }
) {
  try {
    const sessionToken = request.headers.get('x-session-token')
    const filePath = '/' + params.path.join('/')

    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token required' }, { status: 401 })
    }

    const content = await SSHConnectionManager.readFile(sessionToken, filePath)

    return new Response(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to read file' }, { status: 500 })
  }
}

// Write/update file content
export async function PUT(
  request: NextRequest,
  { params }: { params: { connectionId: string; path: string[] } }
) {
  try {
    const sessionToken = request.headers.get('x-session-token')
    const filePath = '/' + params.path.join('/')
    const { content } = await request.json()

    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token required' }, { status: 401 })
    }

    await SSHConnectionManager.writeFile(sessionToken, filePath, content)

    return NextResponse.json({ success: true, message: 'File saved successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to save file' }, { status: 500 })
  }
}

// Delete file or directory
export async function DELETE(
  request: NextRequest,
  { params }: { params: { connectionId: string; path: string[] } }
) {
  try {
    const sessionToken = request.headers.get('x-session-token')
    const filePath = '/' + params.path.join('/')

    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token required' }, { status: 401 })
    }

    await SSHConnectionManager.deleteFile(sessionToken, filePath)

    return NextResponse.json({ success: true, message: 'File deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete file' }, { status: 500 })
  }
}
