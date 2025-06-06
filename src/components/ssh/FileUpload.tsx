'use client'

import { useState } from 'react'
import { useIntl, FormattedMessage } from '@/lib/i18n'

interface FileUploadProps {
  onUpload: (files: FileList) => void
}

export function FileUpload({ onUpload }: FileUploadProps) {
  const intl = useIntl()
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files)
    }
  }

  return (
    <div
      className={`relative ${isDragging ? 'opacity-50' : ''}`}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        multiple
        onChange={handleFileInput}
        className="absolute inset-0 z-10 cursor-pointer opacity-0"
        aria-label={intl.formatMessage({ id: 'files.upload.selectFiles' })}
      />
      <button className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background-secondary">
        <FormattedMessage id="files.upload.button" />
      </button>
    </div>
  )
}
