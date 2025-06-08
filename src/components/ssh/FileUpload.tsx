'use client'

import { useRef } from 'react'
import { FormattedMessage } from '@/lib/i18n'

interface FileUploadProps {
  onUpload: (files: FileList) => void
  disabled?: boolean
}

export function FileUpload({ onUpload, disabled = false }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.click()
    }
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      onUpload(files)
      // Reset input to allow uploading the same file again
      event.target.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
      <button
        onClick={handleClick}
        disabled={disabled}
        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background-secondary disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FormattedMessage id="fileBrowser.upload" />
      </button>
    </>
  )
}
