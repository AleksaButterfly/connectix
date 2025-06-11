// Security constants
export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
export const MAX_TOTAL_SIZE = 500 * 1024 * 1024 // 500MB total

// Dangerous file extensions to block
export const BLOCKED_EXTENSIONS = [
  'exe',
  'bat',
  'cmd',
  'com',
  'scr',
  'vbs',
  'vbe',
  'js',
  'jse',
  'wsf',
  'wsh',
  'msi',
  'jar',
  'app',
  'dmg',
  'deb',
  'rpm',
] as const

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// File extension check
export const isFileAllowed = (filename: string): boolean => {
  const extension = filename.split('.').pop()?.toLowerCase()
  return !extension || !BLOCKED_EXTENSIONS.includes(extension as any)
}

// Image file check
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/')
}