export interface FileWithPreview {
  file: File
  id: string
  preview?: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

export interface FileUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (files: File[]) => Promise<{ file: File; success: boolean; error?: string }[]>
  onComplete?: () => void
  currentPath: string
}

export interface UploadResult {
  file: File
  success: boolean
  error?: string
}