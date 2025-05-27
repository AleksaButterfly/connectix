// File system types
export interface FileSystemItem {
  name: string
  path: string
  size: number
  modifiedAt: Date
  permissions: string
  owner: string
  group: string
}

export interface File extends FileSystemItem {
  type: 'file'
  extension: string
  mimeType?: string
}

export interface Directory extends FileSystemItem {
  type: 'directory'
  childCount?: number
}

export type FileSystemNode = File | Directory

// Connection types
export interface SSHCredentials {
  host: string
  port: number
  username: string
  authMethod: 'password' | 'privateKey'
  password?: string
  privateKey?: string
  passphrase?: string
}

export interface SSHConnection {
  id: string
  name: string
  credentials: SSHCredentials
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  error?: string
  lastConnected?: Date
}

// User types
export interface User {
  id: string
  email: string
  username: string
  createdAt: Date
  updatedAt: Date
}

export interface Session {
  user: User
  accessToken: string
  refreshToken: string
  expiresAt: Date
}

// Operation types
export interface UploadProgress {
  fileId: string
  fileName: string
  bytesUploaded: number
  totalBytes: number
  percentage: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

export interface DownloadRequest {
  path: string
  connectionId: string
}

// UI State types
export interface BreadcrumbItem {
  label: string
  path: string
}

export interface ContextMenuItem {
  label: string
  icon?: string
  action: () => void
  divider?: boolean
  destructive?: boolean
  disabled?: boolean
}
