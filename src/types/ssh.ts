export interface FileInfo {
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

export interface SSHSession {
  id: string
  connectionId: string
  userId: string
  isConnected: boolean
  lastActivity: Date
}

export interface SSHConnectionConfig {
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
