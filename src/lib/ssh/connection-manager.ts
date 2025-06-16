import { Client, ConnectConfig, SFTPWrapper } from 'ssh2'
import { createClient } from '@/lib/supabase/server'
import { randomBytes } from 'crypto'

interface SSHSession {
  id: string
  connectionId: string
  userId: string
  client: Client
  sftp: SFTPWrapper | null
  isConnected: boolean
  lastActivity: Date
  config: SSHConnectionConfig
}

interface SSHConnectionConfig {
  host: string
  port: number
  username: string
  auth_type: 'password' | 'private_key' | 'key_with_passphrase'
  credentials: {
    password?: string
    privateKey?: string
    passphrase?: string
  }
  proxy_jump?: string | null
  connection_timeout?: number
  strict_host_checking?: boolean
}

interface SessionInfo {
  id: string
  connectionId: string
  userId: string
  isConnected: boolean
  lastActivity: Date
  uptime: number
}

interface DiskUsageInfo {
  total: number
  used: number
  available: number
  percentage: number
}

interface FileInfo {
  name: string
  path: string
  type: 'file' | 'directory' | 'symlink'
  size: number
  mode: number
  mtime: Date
  permissions: string
  owner: string
  group: string
}

// Use global to persist sessions across module reloads in development
const globalForSessions = globalThis as unknown as {
  sshSessions: Map<string, SSHSession> | undefined
}

class SSHConnectionManager {
  private static get sessions(): Map<string, SSHSession> {
    if (!globalForSessions.sshSessions) {
      globalForSessions.sshSessions = new Map<string, SSHSession>()
    }
    return globalForSessions.sshSessions
  }
  
  private static cleanupInterval: NodeJS.Timeout | null = null
  private static initialized = false

  static {
    if (!this.initialized) {
      // Start cleanup interval
      this.startCleanup()
      this.initialized = true
    }
  }

  static async createSession(
    connectionId: string,
    userId: string,
    config: SSHConnectionConfig
  ): Promise<string> {
    const sessionToken = randomBytes(32).toString('hex')

    const client = new Client()

    return new Promise((resolve, reject) => {
      const connectConfig: ConnectConfig = {
        host: config.host,
        port: config.port,
        username: config.username,
        readyTimeout: (config.connection_timeout || 30) * 1000,
        keepaliveInterval: 30000,
        keepaliveCountMax: 3,
      }

      // Configure authentication
      if (config.auth_type === 'password') {
        connectConfig.password = config.credentials.password
      } else if (config.auth_type === 'private_key') {
        connectConfig.privateKey = config.credentials.privateKey
      } else if (config.auth_type === 'key_with_passphrase') {
        connectConfig.privateKey = config.credentials.privateKey
        connectConfig.passphrase = config.credentials.passphrase
      }

      client.on('ready', async () => {
        try {
          // Initialize SFTP
          client.sftp((err, sftp) => {
            if (err) {
              client.end()
              reject(new Error(`SFTP initialization failed: ${err.message}`))
              return
            }

            const session: SSHSession = {
              id: sessionToken,
              connectionId,
              userId,
              client,
              sftp,
              isConnected: true,
              lastActivity: new Date(),
              config,
            }

            this.sessions.set(sessionToken, session)
            
            console.log('Session created successfully:', sessionToken)
            console.log('Total active sessions:', this.sessions.size)

            // Log session start
            this.logActivity(sessionToken, 'session.started', {
              host: config.host,
              username: config.username,
            })

            resolve(sessionToken)
          })
        } catch (error: unknown) {
          client.end()
          reject(error)
        }
      })

      client.on('error', (err) => {
        reject(new Error(`SSH connection failed: ${err.message}`))
      })

      client.on('close', () => {
        this.sessions.delete(sessionToken)
        this.logActivity(sessionToken, 'session.ended', {
          termination_reason: 'Connection closed',
        })
      })

      client.connect(connectConfig)
    })
  }

  static async listFiles(sessionToken: string, path: string): Promise<FileInfo[]> {
    const session = this.getSession(sessionToken)
    if (!session.sftp) throw new Error('SFTP not available')

    return new Promise((resolve, reject) => {
      session.sftp!.readdir(path, (err, list) => {
        if (err) {
          reject(new Error(`Failed to list directory: ${err.message}`))
          return
        }

        const files: FileInfo[] = list.map((item) => ({
          name: item.filename,
          path: path.endsWith('/') ? path + item.filename : path + '/' + item.filename,
          type: this.getFileType(item.attrs.mode),
          size: item.attrs.size,
          mode: item.attrs.mode,
          mtime: new Date(item.attrs.mtime * 1000),
          permissions: this.formatPermissions(item.attrs.mode),
          owner: item.attrs.uid?.toString() || 'unknown',
          group: item.attrs.gid?.toString() || 'unknown',
        }))

        session.lastActivity = new Date()
        this.logActivity(sessionToken, 'directory.list', { path, fileCount: files.length })

        resolve(
          files.sort((a, b) => {
            // Directories first, then files, both alphabetically
            if (a.type === 'directory' && b.type !== 'directory') return -1
            if (a.type !== 'directory' && b.type === 'directory') return 1
            return a.name.localeCompare(b.name)
          })
        )
      })
    })
  }

  static async readFile(sessionToken: string, path: string): Promise<string> {
    const session = this.getSession(sessionToken)
    if (!session.sftp) throw new Error('SFTP not available')

    return new Promise((resolve, reject) => {
      session.sftp!.readFile(path, 'utf8', (err, data) => {
        if (err) {
          reject(new Error(`Failed to read file: ${err.message}`))
          return
        }

        session.lastActivity = new Date()
        this.logActivity(sessionToken, 'file.read', {
          path,
          bytes_affected: Buffer.byteLength(data, 'utf8'),
        })

        resolve(data)
      })
    })
  }

  static async writeFile(sessionToken: string, path: string, content: string): Promise<void> {
    const session = this.getSession(sessionToken)
    if (!session.sftp) throw new Error('SFTP not available')

    return new Promise((resolve, reject) => {
      session.sftp!.writeFile(path, content, 'utf8', (err) => {
        if (err) {
          reject(new Error(`Failed to write file: ${err.message}`))
          return
        }

        session.lastActivity = new Date()
        this.logActivity(sessionToken, 'file.write', {
          path,
          bytes_affected: Buffer.byteLength(content, 'utf8'),
        })

        resolve()
      })
    })
  }

  static async readBinaryFile(sessionToken: string, path: string): Promise<Buffer> {
    const session = this.getSession(sessionToken)
    if (!session.sftp) throw new Error('SFTP not available')

    return new Promise((resolve, reject) => {
      session.sftp!.readFile(path, (err, data) => {
        if (err) {
          reject(new Error(`Failed to read file: ${err.message}`))
          return
        }

        session.lastActivity = new Date()
        this.logActivity(sessionToken, 'file.read', {
          path,
          bytes_affected: data.length,
        })

        resolve(data)
      })
    })
  }

  static async writeBinaryFile(sessionToken: string, path: string, buffer: Buffer): Promise<void> {
    const session = this.getSession(sessionToken)
    if (!session.sftp) throw new Error('SFTP not available')

    return new Promise((resolve, reject) => {
      const stream = session.sftp!.createWriteStream(path)

      stream.on('error', (err) => {
        reject(new Error(`Failed to write file: ${err.message}`))
      })

      stream.on('close', () => {
        session.lastActivity = new Date()
        this.logActivity(sessionToken, 'file.write', {
          path,
          bytes_affected: buffer.length,
        })
        resolve()
      })

      stream.end(buffer)
    })
  }

  static async deleteFile(sessionToken: string, path: string): Promise<void> {
    const session = this.getSession(sessionToken)
    if (!session.sftp) throw new Error('SFTP not available')

    return new Promise((resolve, reject) => {
      // First check if it's a directory or file
      session.sftp!.stat(path, (err, stats) => {
        if (err) {
          reject(new Error(`Failed to stat file: ${err.message}`))
          return
        }

        const isDirectory = (stats.mode & 0o170000) === 0o040000

        if (isDirectory) {
          session.sftp!.rmdir(path, (err) => {
            if (err) {
              reject(new Error(`Failed to remove directory: ${err.message}`))
              return
            }

            session.lastActivity = new Date()
            this.logActivity(sessionToken, 'directory.delete', { path })
            resolve()
          })
        } else {
          session.sftp!.unlink(path, (err) => {
            if (err) {
              reject(new Error(`Failed to delete file: ${err.message}`))
              return
            }

            session.lastActivity = new Date()
            this.logActivity(sessionToken, 'file.delete', { path })
            resolve()
          })
        }
      })
    })
  }

  static async createDirectory(sessionToken: string, path: string): Promise<void> {
    const session = this.getSession(sessionToken)
    if (!session.sftp) throw new Error('SFTP not available')

    return new Promise((resolve, reject) => {
      session.sftp!.mkdir(path, (err) => {
        if (err) {
          reject(new Error(`Failed to create directory: ${err.message}`))
          return
        }

        session.lastActivity = new Date()
        this.logActivity(sessionToken, 'directory.create', { path })
        resolve()
      })
    })
  }

  static async renameFile(sessionToken: string, oldPath: string, newPath: string): Promise<void> {
    const session = this.getSession(sessionToken)
    if (!session.sftp) throw new Error('SFTP not available')

    return new Promise((resolve, reject) => {
      session.sftp!.rename(oldPath, newPath, (err) => {
        if (err) {
          reject(new Error(`Failed to rename file: ${err.message}`))
          return
        }

        session.lastActivity = new Date()
        this.logActivity(sessionToken, 'file.rename', {
          old_path: oldPath,
          new_path: newPath,
        })
        resolve()
      })
    })
  }

  static async closeSession(sessionToken: string): Promise<void> {
    const session = this.sessions.get(sessionToken)
    if (session) {
      session.client.end()
      this.sessions.delete(sessionToken)
    }
    
    // Also mark as disconnected in database
    try {
      const supabase = await createClient()
      await supabase
        .from('connection_sessions')
        .update({ 
          status: 'disconnected',
          ended_at: new Date().toISOString(),
          termination_reason: 'Manual disconnect'
        })
        .eq('session_token', sessionToken)
    } catch (error) {
      console.error('Error updating session status in database:', error)
    }
  }

  private static getSession(sessionToken: string): SSHSession {
    const session = this.sessions.get(sessionToken)
    if (!session) {
      throw new Error('SSH session not found. Please refresh the page to reconnect.')
    }
    if (!session.isConnected) {
      throw new Error('SSH session is not connected. Please refresh the page to reconnect.')
    }
    return session
  }
  
  static async validateSession(sessionToken: string): Promise<boolean> {
    if (!sessionToken) {
      return false
    }
    
    // Check in-memory first
    const memorySession = this.sessions.get(sessionToken)
    if (memorySession && memorySession.isConnected) {
      // Update last activity for in-memory session
      memorySession.lastActivity = new Date()
      return true
    }
    
    // If not in memory, session is invalid (sessions are in-memory only for security)
    return false
  }

  private static getFileType(mode: number): 'file' | 'directory' | 'symlink' {
    if ((mode & 0o170000) === 0o040000) return 'directory'
    if ((mode & 0o170000) === 0o120000) return 'symlink'
    return 'file'
  }

  private static formatPermissions(mode: number): string {
    const perms = mode & parseInt('777', 8)
    const owner = (perms >> 6) & 7
    const group = (perms >> 3) & 7
    const other = perms & 7

    const formatOctet = (octet: number) =>
      (octet & 4 ? 'r' : '-') + (octet & 2 ? 'w' : '-') + (octet & 1 ? 'x' : '-')

    return formatOctet(owner) + formatOctet(group) + formatOctet(other)
  }

  private static async logActivity(
    sessionToken: string,
    activityType: string,
    details: Record<string, unknown>
  ): Promise<void> {
    try {
      const session = this.sessions.get(sessionToken)
      if (!session) return

      const supabase = await createClient()
      await supabase.from('connection_activity_logs').insert({
        connection_id: session.connectionId,
        user_id: session.userId,
        activity_type: activityType,
        details,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Failed to log activity:', error)
    }
  }

  private static startCleanup(): void {
    if (this.cleanupInterval) return

    this.cleanupInterval = setInterval(
      () => {
        const now = new Date()
        const timeout = 30 * 60 * 1000 // 30 minutes

        for (const [token, session] of this.sessions.entries()) {
          if (now.getTime() - session.lastActivity.getTime() > timeout) {
            console.log(`Cleaning up expired session: ${token}`)
            session.client.end()
            this.sessions.delete(token)
          }
        }
      },
      5 * 60 * 1000
    ) // Check every 5 minutes
  }

  static async executeCommand(
    sessionToken: string,
    command: string
  ): Promise<{
    stdout: string
    stderr: string
    code: number
  }> {
    const session = this.getSession(sessionToken)

    return new Promise((resolve, reject) => {
      session.client.exec(command, (err, stream) => {
        if (err) {
          reject(new Error(`Failed to execute command: ${err.message}`))
          return
        }

        let stdout = ''
        let stderr = ''

        stream.on('close', (code: number) => {
          session.lastActivity = new Date()
          this.logActivity(sessionToken, 'command.execute', {
            command,
            exitCode: code,
            stdout: stdout.substring(0, 1000), // Limit log size
            stderr: stderr.substring(0, 1000),
          })

          resolve({ stdout, stderr, code })
        })

        stream.on('data', (data: Buffer) => {
          stdout += data.toString()
        })

        stream.stderr.on('data', (data: Buffer) => {
          stderr += data.toString()
        })
      })
    })
  }

  static async downloadFile(
    sessionToken: string,
    path: string
  ): Promise<{
    buffer: Buffer
    filename: string
    mimeType: string | null
  }> {
    const session = this.getSession(sessionToken)
    if (!session.sftp) throw new Error('SFTP not available')

    return new Promise((resolve, reject) => {
      session.sftp!.readFile(path, (err, data) => {
        if (err) {
          reject(new Error(`Failed to download file: ${err.message}`))
          return
        }

        const filename = path.split('/').pop() || 'download'
        const mimeType = this.getMimeType(filename)

        session.lastActivity = new Date()
        this.logActivity(sessionToken, 'file.read', {
          path,
          bytes_affected: data.length,
          operation: 'download',
        })

        resolve({ buffer: data, filename, mimeType })
      })
    })
  }

  static async downloadMultipleFiles(): Promise<Buffer> {
    // This would require a zip library like 'archiver'
    // For now, throw an error indicating it needs implementation
    throw new Error('Multiple file download requires zip implementation - install archiver package')
  }

  static async changeFilePermissions(
    sessionToken: string,
    path: string,
    mode: number
  ): Promise<void> {
    const session = this.getSession(sessionToken)
    if (!session.sftp) throw new Error('SFTP not available')

    return new Promise((resolve, reject) => {
      session.sftp!.chmod(path, mode, (err) => {
        if (err) {
          reject(new Error(`Failed to change permissions: ${err.message}`))
          return
        }

        session.lastActivity = new Date()
        this.logActivity(sessionToken, 'file.chmod', {
          path,
          mode: mode.toString(8),
        })

        resolve()
      })
    })
  }

  static async getFileInfo(sessionToken: string, path: string): Promise<FileInfo> {
    const session = this.getSession(sessionToken)
    if (!session.sftp) throw new Error('SFTP not available')

    return new Promise((resolve, reject) => {
      session.sftp!.stat(path, (err, stats) => {
        if (err) {
          reject(new Error(`Failed to get file info: ${err.message}`))
          return
        }

        const fileInfo = {
          size: stats.size,
          mode: stats.mode,
          mtime: new Date(stats.mtime * 1000),
          atime: new Date(stats.atime * 1000),
          uid: stats.uid,
          gid: stats.gid,
          type: this.getFileType(stats.mode),
          permissions: this.formatPermissions(stats.mode),
        }

        session.lastActivity = new Date()
        resolve(fileInfo)
      })
    })
  }

  static async copyFile(
    sessionToken: string,
    sourcePath: string,
    destinationPath: string,
    overwrite: boolean = false
  ): Promise<void> {
    const session = this.getSession(sessionToken)
    if (!session.sftp) throw new Error('SFTP not available')

    // Check if destination exists
    if (!overwrite) {
      try {
        await this.getFileInfo(sessionToken, destinationPath)
        throw new Error('Destination file already exists')
      } catch (err: unknown) {
        if (err instanceof Error && !err.message.includes('Failed to get file info')) {
          throw err
        }
        // File doesn't exist, continue with copy
      }
    }

    // Read source file
    const sourceData = await new Promise<Buffer>((resolve, reject) => {
      session.sftp!.readFile(sourcePath, (err, data) => {
        if (err) reject(new Error(`Failed to read source file: ${err.message}`))
        else resolve(data)
      })
    })

    // Write to destination
    await new Promise<void>((resolve, reject) => {
      session.sftp!.writeFile(destinationPath, sourceData, (err) => {
        if (err) reject(new Error(`Failed to write destination file: ${err.message}`))
        else resolve()
      })
    })

    session.lastActivity = new Date()
    this.logActivity(sessionToken, 'file.copy', {
      sourcePath,
      destinationPath,
      bytes_affected: sourceData.length,
    })
  }

  static async moveFile(
    sessionToken: string,
    sourcePath: string,
    destinationPath: string,
    overwrite: boolean = false
  ): Promise<void> {
    // First copy the file
    await this.copyFile(sessionToken, sourcePath, destinationPath, overwrite)

    // Then delete the source
    await this.deleteFile(sessionToken, sourcePath)

    this.getSession(sessionToken)
    this.logActivity(sessionToken, 'file.move', {
      sourcePath,
      destinationPath,
    })
  }

  static async searchFiles(
    sessionToken: string,
    options: {
      query: string
      path: string
      type: 'file' | 'directory' | 'all'
      content?: boolean
      caseSensitive?: boolean
      regex?: boolean
      maxResults?: number
    }
  ): Promise<FileInfo[]> {
    const session = this.getSession(sessionToken)

    // This is a basic implementation using find command
    const findType =
      options.type === 'file' ? '-type f' : options.type === 'directory' ? '-type d' : ''

    // Escape special characters in query to prevent command injection
    const escapedQuery = options.query.replace(/["'\\]/g, '\\$&')
    
    // Fixed: Use -iname for case-insensitive search
    const namePattern = options.regex
      ? `-regex ".*${escapedQuery}.*"`
      : options.caseSensitive
        ? `-name "*${escapedQuery}*"`
        : `-iname "*${escapedQuery}*"`

    // Construct command parts
    const commandParts = ['find', `"${options.path}"`]
    if (findType) commandParts.push(findType)
    commandParts.push(namePattern)
    commandParts.push('2>/dev/null')
    commandParts.push('|', 'head', `-${options.maxResults || 100}`)
    
    const command = commandParts.join(' ')
    
    const result = await this.executeCommand(sessionToken, command)

    let files = result.stdout
      .split('\n')
      .filter((line) => line.trim())
      .map((path) => ({
        path: path.trim(),
        name: path.split('/').pop() || '',
        type: 'unknown', // Would need additional stat calls to determine
      }))

    // If no results with find, try a simpler ls-based approach as fallback
    if (files.length === 0 && !options.regex) {
      try {
        const lsCommand = `ls -la "${options.path}" | grep -i "${escapedQuery}"`
        const lsResult = await this.executeCommand(sessionToken, lsCommand)
        
        const lsFiles = lsResult.stdout
          .split('\n')
          .filter((line) => line.trim() && !line.startsWith('total'))
          .map((line) => {
            const parts = line.trim().split(/\s+/)
            if (parts.length >= 9) {
              const name = parts.slice(8).join(' ')
              const fullPath = options.path.endsWith('/') ? `${options.path}${name}` : `${options.path}/${name}`
              return {
                path: fullPath,
                name,
                type: line.startsWith('d') ? 'directory' : 'file',
              }
            }
            return null
          })
          .filter((file): file is NonNullable<typeof file> => file !== null)
        
        files = lsFiles
      } catch (error) {
        // Fallback failed, keep original empty results
      }
    }

    // Optionally, get file types for better display
    // This adds extra calls but improves UX
    const filesWithTypes = await Promise.all(
      files.map(async (file) => {
        try {
          const info = await this.getFileInfo(sessionToken, file.path)
          return {
            ...file,
            type: info.type,
          }
        } catch {
          // If stat fails, keep as unknown
          return file
        }
      })
    )

    session.lastActivity = new Date()
    this.logActivity(sessionToken, 'file.search', {
      query: options.query,
      path: options.path,
      resultCount: filesWithTypes.length,
    })

    return filesWithTypes
  }

  static async getSessionInfo(sessionToken: string): Promise<SessionInfo> {
    const session = this.sessions.get(sessionToken)
    if (!session) {
      throw new Error('Session not found')
    }

    const startTime = new Date(session.lastActivity.getTime() - 30 * 60 * 1000) // Approximate
    const uptime = Date.now() - startTime.getTime()

    return {
      id: session.id,
      connectionId: session.connectionId,
      userId: session.userId,
      isConnected: session.isConnected,
      lastActivity: session.lastActivity,
      uptime,
    }
  }

  static async keepSessionAlive(sessionToken: string): Promise<void> {
    const session = this.getSession(sessionToken)
    session.lastActivity = new Date()

    // Send a simple command to keep the connection alive
    try {
      await this.executeCommand(sessionToken, 'echo "keepalive"')
    } catch {
      // Ignore errors for keepalive
    }
  }

  static async getDiskUsage(sessionToken: string, path: string): Promise<DiskUsageInfo> {
    this.getSession(sessionToken)

    try {
      const result = await this.executeCommand(sessionToken, `df -h "${path}"`)
      const lines = result.stdout.split('\n').filter((line) => line.trim())

      if (lines.length < 2) {
        throw new Error('Unable to parse disk usage output')
      }

      const data = lines[1].split(/\s+/)
      
      // Parse sizes to bytes for consistency
      const sizeStr = data[1]
      const usedStr = data[2]
      const availableStr = data[3]
      const percentStr = data[4].replace('%', '')

      return {
        total: this.parseSize(sizeStr),
        used: this.parseSize(usedStr),
        available: this.parseSize(availableStr),
        percentage: parseInt(percentStr, 10),
      }
    } catch (error: unknown) {
      // Fallback to du command for directory size
      const result = await this.executeCommand(sessionToken, `du -sh "${path}"`)
      const size = result.stdout.split('\t')[0]

      return {
        total: this.parseSize(size),
        used: this.parseSize(size),
        available: 0,
        percentage: 100,
      }
    }
  }

  private static parseSize(sizeStr: string): number {
    const units = { B: 1, K: 1024, M: 1024 ** 2, G: 1024 ** 3, T: 1024 ** 4 }
    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([BKMGT]?)/)
    if (!match) return 0
    
    const value = parseFloat(match[1])
    const unit = match[2] || 'B'
    return Math.round(value * (units[unit as keyof typeof units] || 1))
  }

  private static getMimeType(filename: string): string | null {
    const ext = filename.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      txt: 'text/plain',
      html: 'text/html',
      css: 'text/css',
      js: 'application/javascript',
      json: 'application/json',
      pdf: 'application/pdf',
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      zip: 'application/zip',
      tar: 'application/x-tar',
      gz: 'application/gzip',
    }

    return mimeTypes[ext || ''] || null
  }
}

export { SSHConnectionManager }
