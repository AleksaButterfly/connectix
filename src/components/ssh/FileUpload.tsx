'use client'

import { useState } from 'react'
import { FileUploadModal } from './upload/FileUploadModal'
import { useIntl, FormattedMessage } from '@/lib/i18n'

interface FileUploadProps {
  onUpload: (files: FileList) => Promise<void>
  onComplete?: () => void // Add callback for when modal closes after successful uploads
  disabled?: boolean
  currentPath?: string
}

export function FileUpload({
  onUpload,
  onComplete,
  disabled = false,
  currentPath = '/',
}: FileUploadProps) {
  const intl = useIntl()
  const [showModal, setShowModal] = useState(false)

  const handleUpload = async (files: File[]) => {
    const results: { file: File; success: boolean; error?: string }[] = []

    for (const file of files) {
      try {
        // Create a FileList-like object for compatibility
        const fileList = {
          0: file,
          length: 1,
          item: (index: number) => (index === 0 ? file : null),
          [Symbol.iterator]: function* () {
            yield file
          },
        } as unknown as FileList

        await onUpload(fileList)
        results.push({ file, success: true })
      } catch (error: any) {
        results.push({
          file,
          success: false,
          error: error.message || intl.formatMessage({ id: 'fileUpload.error.unknown' }),
        })
      }
    }

    return results
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={disabled}
        className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-background-secondary disabled:cursor-not-allowed disabled:opacity-50"
      >
        <FormattedMessage id="fileBrowser.upload" />
      </button>

      <FileUploadModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onUpload={handleUpload}
        onComplete={onComplete}
        currentPath={currentPath}
      />
    </>
  )
}
