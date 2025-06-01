'use client'

import { useState } from 'react'
import ConfirmationModal from '@/components/ui/ConfirmationModal'

interface UseConfirmationOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  onConfirm: () => void | Promise<void>
}

export function useConfirmation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [options, setOptions] = useState<UseConfirmationOptions | null>(null)

  const confirm = (confirmOptions: UseConfirmationOptions) => {
    setOptions(confirmOptions)
    setIsOpen(true)
  }

  const handleConfirm = async () => {
    if (!options) return

    try {
      setIsLoading(true)
      await options.onConfirm()
      setIsOpen(false)
    } catch (error) {
      // Error handling can be done in the onConfirm callback
      console.error('Confirmation action failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setIsOpen(false)
    }
  }

  const ConfirmationModalComponent = () => {
    if (!options) return null

    return (
      <ConfirmationModal
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        variant={options.variant}
        isLoading={isLoading}
      />
    )
  }

  return {
    confirm,
    ConfirmationModal: ConfirmationModalComponent,
  }
}
