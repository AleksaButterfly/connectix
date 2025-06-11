'use client'

import { FormattedMessage } from '@/lib/i18n'
import { Button } from '@/components/ui'

interface FormActionsProps {
  onCancel: () => void
  onTest: () => void
  isSaving: boolean
  isTesting: boolean
  isEditing: boolean
}

export const FormActions = ({ 
  onCancel, 
  onTest, 
  isSaving, 
  isTesting,
  isEditing 
}: FormActionsProps) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
      <Button
        type="button"
        variant="outline"
        onClick={onTest}
        loading={isTesting}
        disabled={isSaving}
        className="order-2 sm:order-1"
      >
        <FormattedMessage id="connections.form.testConnection" />
      </Button>

      <div className="flex gap-3 order-1 sm:order-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSaving || isTesting}
        >
          <FormattedMessage id="common.cancel" />
        </Button>
        <Button
          type="submit"
          loading={isSaving}
          disabled={isTesting}
        >
          {isEditing ? (
            <FormattedMessage id="connections.form.updateConnection" />
          ) : (
            <FormattedMessage id="connections.form.createConnection" />
          )}
        </Button>
      </div>
    </div>
  )
}