import { NextResponse } from 'next/server'
import { SSHConnectionManager } from '@/lib/ssh/connection-manager'
import { createSSHAuthenticatedRoute } from '@/lib/api/middleware/ssh-auth'
import archiver from 'archiver'

export const GET = createSSHAuthenticatedRoute(
  async (request, context, { sshSessionToken }) => {
    const searchParams = request.nextUrl.searchParams
    const path = searchParams.get('path')

    if (!path) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 })
    }

    // Single file download
    const result = await SSHConnectionManager.downloadFile(sshSessionToken, path)

    // Set appropriate headers
    const headers = new Headers()
    headers.set('Content-Disposition', `attachment; filename="${result.filename}"`)
    if (result.mimeType) {
      headers.set('Content-Type', result.mimeType)
    }

    return new NextResponse(result.buffer, { headers })
  }
)

export const POST = createSSHAuthenticatedRoute(
  async (request, context, { sshSessionToken }) => {
    const body = await request.json()
    const { paths, format } = body

    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json({ error: 'Paths array is required' }, { status: 400 })
    }

    // Multiple files download as ZIP
    if (format === 'zip' && paths.length > 1) {
      // Create a zip archive
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression
      })

      // Create arrays to collect data
      const chunks: Buffer[] = []

      // Set up promise to track when archiving is complete
      const archivePromise = new Promise<void>((resolve, reject) => {
        archive.on('data', (chunk) => {
          chunks.push(chunk)
        })

        archive.on('error', (err) => {
          reject(err)
        })

        archive.on('end', () => {
          resolve()
        })
      })

      // Download and add each file to the archive
      for (const path of paths) {
        try {
          const fileInfo = await SSHConnectionManager.getFileInfo(sshSessionToken, path)

          // Skip directories for now
          if (fileInfo.type === 'directory') {
            continue
          }

          const result = await SSHConnectionManager.downloadFile(sshSessionToken, path)

          // Add file to archive with relative path structure
          const relativePath = path.startsWith('/') ? path.substring(1) : path
          archive.append(result.buffer, { name: relativePath })
        } catch (err) {
          console.error(`Failed to download ${path}:`, err)
          // Continue with other files
        }
      }

      // Finalize the archive
      await archive.finalize()

      // Wait for archive to complete
      await archivePromise

      // Combine all chunks
      const zipBuffer = Buffer.concat(chunks)

      // Return the zip file
      const headers = new Headers()
      headers.set('Content-Type', 'application/zip')
      headers.set('Content-Disposition', `attachment; filename="files-${Date.now()}.zip"`)

      return new NextResponse(zipBuffer, { headers })
    }

    // Single file fallback
    if (paths.length === 1) {
      const result = await SSHConnectionManager.downloadFile(sshSessionToken, paths[0])

      const headers = new Headers()
      headers.set('Content-Disposition', `attachment; filename="${result.filename}"`)
      if (result.mimeType) {
        headers.set('Content-Type', result.mimeType)
      }

      return new NextResponse(result.buffer, { headers })
    }

    return Response.json({ error: 'Invalid download request' }, { status: 400 })
  }
)
