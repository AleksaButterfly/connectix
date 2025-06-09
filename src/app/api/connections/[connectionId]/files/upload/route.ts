import { NextRequest, NextResponse } from 'next/server'
import { SSHConnectionManager } from '@/lib/ssh/connection-manager'

export async function POST(request: NextRequest, { params }: { params: { connectionId: string } }) {
  try {
    const sessionToken = request.headers.get('x-session-token')

    if (!sessionToken) {
      return NextResponse.json({ error: 'Session token required' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const path = formData.get('path') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    const remotePath = path.endsWith('/') ? path + file.name : path + '/' + file.name

    // Use writeBinaryFile for all uploads (binary safe)
    await SSHConnectionManager.writeBinaryFile(sessionToken, remotePath, buffer)

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      filename: file.name,
      path: remotePath,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500 })
  }
}
