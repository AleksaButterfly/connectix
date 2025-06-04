import type { FileInfo } from '@/types/ssh'

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// FIXED: Handle both Date objects and date strings
export function formatDate(date: Date | string | undefined): string {
  if (!date) return 'Unknown'

  try {
    // Convert to Date object if it's a string
    const dateObj = typeof date === 'string' ? new Date(date) : date

    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid date'
    }

    const now = new Date()
    const diffMs = now.getTime() - dateObj.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return dateObj.toLocaleDateString()
    }
  } catch (error) {
    console.warn('Error formatting date:', date, error)
    return 'Unknown'
  }
}

// FIXED: Make more flexible to handle any object structure
export function getFileIcon(file: any): string {
  // Safety check
  if (!file) return '📄'

  if (file.type === 'directory') return '📁'
  if (file.type === 'symlink') return '🔗'

  const ext = file.name?.split('.').pop()?.toLowerCase()
  const iconMap: Record<string, string> = {
    // Code files
    js: '🟨',
    jsx: '🟨',
    ts: '🔷',
    tsx: '🔷',
    py: '🐍',
    php: '🟣',
    java: '☕',
    cpp: '⚡',
    c: '⚡',
    go: '🔵',
    rs: '🦀',
    rb: '💎',
    swift: '🦢',

    // Web files
    html: '🌐',
    css: '🎨',
    scss: '🎨',
    sass: '🎨',

    // Data files
    json: '📋',
    xml: '📄',
    yaml: '📄',
    yml: '📄',
    csv: '📊',
    sql: '🗃️',

    // Documents
    md: '📝',
    txt: '📄',
    pdf: '📕',
    doc: '📘',
    docx: '📘',

    // Images
    png: '🖼️',
    jpg: '🖼️',
    jpeg: '🖼️',
    gif: '🖼️',
    svg: '🖼️',

    // Archives
    zip: '📦',
    tar: '📦',
    gz: '📦',
    rar: '📦',

    // Config
    conf: '⚙️',
    config: '⚙️',
    ini: '⚙️',
    env: '⚙️',
    dockerfile: '🐳',
    'docker-compose': '🐳',

    // Scripts
    sh: '🔧',
    bash: '🔧',
    zsh: '🔧',
    fish: '🔧',
  }

  return iconMap[ext || ''] || '📄'
}

export function validatePath(path: string): boolean {
  // Prevent directory traversal
  if (path.includes('..') || path.includes('~')) {
    return false
  }

  // Ensure absolute path
  if (!path.startsWith('/')) {
    return false
  }

  return true
}

export function getLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const langMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    php: 'php',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    go: 'go',
    rs: 'rust',
    rb: 'ruby',
    swift: 'swift',
    kt: 'kotlin',
    scala: 'scala',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    fish: 'bash',
    sql: 'sql',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    toml: 'toml',
    ini: 'ini',
    conf: 'ini',
    config: 'ini',
    md: 'markdown',
    markdown: 'markdown',
    dockerfile: 'dockerfile',
  }
  return langMap[ext || ''] || 'text'
}
