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
    <>
      <button
        type="button"
        onClick={onTest}
        disabled={isTesting}
        className="rounded-lg border border-border bg-background-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background-tertiary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isTesting ? (
          <FormattedMessage id="connections.create.testing" />
        ) : (
          <FormattedMessage id="connections.create.testButton" />
        )}
      </button>

      <div className="align-center flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border bg-background-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background-tertiary"
        >
          <FormattedMessage id="common.cancel" />
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-pulse">
                {isEditing ? (
                  <FormattedMessage id="connections.edit.saving" />
                ) : (
                  <FormattedMessage id="common.creating" />
                )}
              </span>
              <span className="animate-terminal-blink">_</span>
            </span>
          ) : isEditing ? (
            <FormattedMessage id="connections.edit.saveButton" />
          ) : (
            <FormattedMessage id="connections.create.saveButton" />
          )}
        </button>
      </div>
    </>
  )
}