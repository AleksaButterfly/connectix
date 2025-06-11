export interface FileInfo {
  path: string
  name: string
  type: 'file' | 'directory' | 'symlink' | 'unknown'
  size: number
  permissions: string
  mtime: Date | string
  owner?: string
  group?: string
  isHidden?: boolean
  extension?: string
}

export interface FileOperation {
  type: 'create' | 'rename' | 'delete' | 'move' | 'copy' | 'chmod'
  source: string
  destination?: string
  mode?: number
  timestamp: Date
}

export interface FileSearchOptions {
  query: string
  path: string
  type?: 'all' | 'file' | 'directory'
  caseSensitive?: boolean
  regex?: boolean
  maxResults?: number
  includeHidden?: boolean
}

export interface FileSearchResult {
  path: string
  name: string
  type: 'file' | 'directory'
  size?: number
  mtime?: string
  matches?: Array<{
    line: number
    column: number
    text: string
  }>
}

export interface FileUploadProgress {
  file: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export interface ApiError {
  error: string
  message: string
  code?: string
  statusCode: number
}

// Type guards
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    'message' in error &&
    typeof (error as ApiError).error === 'string' &&
    typeof (error as ApiError).message === 'string'
  )
}

export function isFileInfo(obj: unknown): obj is FileInfo {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'path' in obj &&
    'name' in obj &&
    'type' in obj &&
    'size' in obj &&
    'permissions' in obj &&
    typeof (obj as FileInfo).path === 'string' &&
    typeof (obj as FileInfo).name === 'string' &&
    ['file', 'directory', 'symlink', 'unknown'].includes((obj as FileInfo).type) &&
    typeof (obj as FileInfo).size === 'number' &&
    typeof (obj as FileInfo).permissions === 'string'
  )
}

// API Response types
export interface FileListResponse {
  files: FileInfo[]
  path: string
  totalCount: number
  hasMore?: boolean
}

export interface FileOperationResponse {
  success: boolean
  operation: FileOperation
  affectedFiles: string[]
  error?: string
}

export interface FileContentResponse {
  content: string
  encoding: string
  size: number
}

export interface FileUploadResponse {
  uploaded: string[]
  failed: Array<{
    file: string
    error: string
  }>
}

// Custom Error classes
export class ApiResponseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message)
    this.name = 'ApiResponseError'
  }
}

export class FileOperationError extends Error {
  constructor(
    message: string,
    public operation: FileOperation,
    public code?: string
  ) {
    super(message)
    this.name = 'FileOperationError'
  }
}

// Constants
export const FILE_ACTIONS = {
  OPEN: 'open',
  RENAME: 'rename',
  DELETE: 'delete',
  PERMISSIONS: 'permissions',
  DOWNLOAD: 'download',
  COPY: 'copy',
  MOVE: 'move',
} as const

export type FileAction = (typeof FILE_ACTIONS)[keyof typeof FILE_ACTIONS]

export const PERMISSION_PRESETS = {
  OWNER_ALL: '700',
  OWNER_READ_WRITE: '600',
  PUBLIC_FILE: '644',
  PUBLIC_DIR: '755',
  RESTRICTED: '600',
  ALL_ACCESS: '777',
} as const

export type PermissionPreset = (typeof PERMISSION_PRESETS)[keyof typeof PERMISSION_PRESETS]

// Helper type for file filters
export interface FileFilter {
  showHidden?: boolean
  fileTypes?: Array<'file' | 'directory' | 'symlink'>
  extensions?: string[]
  sizeRange?: {
    min?: number
    max?: number
  }
  modifiedRange?: {
    after?: Date
    before?: Date
  }
}

// Connection types
export interface SSHConnection {
  id: string
  name: string
  host: string
  port: number
  username: string
  authType: 'password' | 'key'
  createdAt: Date
  lastUsed?: Date
  status: 'connected' | 'disconnected' | 'error'
}

export interface ConnectionSession {
  connectionId: string
  sessionToken: string
  expiresAt: Date
}

// Component Props types for better reusability
export interface FileManagerProps {
  connectionId: string
  sessionToken: string
  initialPath?: string
  onDisconnect?: () => void
  onError?: (error: Error) => void
}

export interface FileActionHandler {
  onFileSelect?: (file: FileInfo) => void
  onFileOpen?: (file: FileInfo) => void
  onFileDelete?: (files: FileInfo[]) => Promise<void>
  onFileRename?: (file: FileInfo, newName: string) => Promise<void>
  onFileMove?: (files: FileInfo[], destination: string) => Promise<void>
  onFileCopy?: (files: FileInfo[], destination: string) => Promise<void>
  onFileDownload?: (files: FileInfo[]) => Promise<void>
  onFileUpload?: (files: File[], destination: string) => Promise<void>
}

// Utility function for API calls with proper typing
export async function apiCall<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    let error: ApiError
    try {
      error = await response.json()
    } catch {
      error = {
        error: 'Network Error',
        message: response.statusText || 'Request failed',
        statusCode: response.status,
      }
    }
    throw new ApiResponseError(error.message, error.code, error.statusCode)
  }

  return response.json() as Promise<T>
}
