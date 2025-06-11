'use client'

import { useIntl, FormattedMessage } from '@/lib/i18n'
import { Button } from './Button'
import { Modal } from './Modal'
import { Icon } from './Icon'

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger',
  isLoading = false,
}: ConfirmationModalProps) => {
  const intl = useIntl()

  // Use provided text or default translations
  const confirmButtonText = confirmText || intl.formatMessage({ id: 'common.confirm' })
  const cancelButtonText = cancelText || intl.formatMessage({ id: 'common.cancel' })

  const variantConfig = {
    danger: {
      icon: 'exclamation' as const,
      iconColor: 'danger' as const,
      iconBg: 'bg-red-500/10',
      confirmVariant: 'danger' as const,
    },
    warning: {
      icon: 'exclamation' as const,
      iconColor: 'warning' as const,
      iconBg: 'bg-terminal-yellow/10',
      confirmVariant: 'secondary' as const, // We'll style this manually
    },
    info: {
      icon: 'info' as const,
      iconColor: 'primary' as const,
      iconBg: 'bg-terminal-green/10',
      confirmVariant: 'primary' as const,
    },
  }

  const config = variantConfig[variant]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
      size="sm"
    >
      <div className="flex items-start gap-4 mb-6">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${config.iconBg}`}>
          <Icon name={config.icon} size="lg" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="mt-2 text-sm text-foreground-muted">{message}</p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelButtonText}
        </Button>
        <Button
          variant={config.confirmVariant}
          onClick={onConfirm}
          disabled={isLoading}
          loading={isLoading}
        >
          {confirmButtonText}
        </Button>
      </div>
    </Modal>
  )
}

export { ConfirmationModal }
export default ConfirmationModal

