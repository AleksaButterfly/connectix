import { NextRequest, NextResponse } from 'next/server'
import { SSHConnectionManager } from '@/lib/ssh/connection-manager'

export async function GET(request: NextRequest, { params: _params }: { params: { connectionId: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const path = searchParams.get('path') || '/'
    const type = searchParams.get('type') // 'file', 'directory', or 'all'
    const sessionToken = request.headers.get('x-session-token')

    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token required' }, { status: 401 })
    }

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    const results = await SSHConnectionManager.searchFiles(sessionToken, {
      query,
      path,
      type: (type as 'file' | 'directory' | 'all') || 'all',
      maxResults: 100,
    })

    return NextResponse.json({
      success: true,
      results,
      query,
      searchPath: path,
    })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to search files' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params: _params }: { params: { connectionId: string } }) {
  try {
    const sessionToken = request.headers.get('x-session-token')
    const {
      query,
      path = '/',
      type = 'all',
      content = false,
      caseSensitive = false,
      regex = false,
      maxResults = 100,
    } = await request.json()

    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token required' }, { status: 401 })
    }

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    const results = await SSHConnectionManager.searchFiles(sessionToken, {
      query,
      path,
      type,
      content,
      caseSensitive,
      regex,
      maxResults,
    })

    return NextResponse.json({
      success: true,
      results,
      searchOptions: {
        query,
        path,
        type,
        content,
        caseSensitive,
        regex,
        maxResults,
      },
    })
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to search files' }, { status: 500 })
  }
}
