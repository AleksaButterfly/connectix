'use client'

import { FormattedMessage } from '@/lib/i18n'
import { ErrorBoundary } from '@/components/ui'
import { BasicConnectionSection } from './BasicConnectionSection'
import { AuthenticationSection } from './AuthenticationSection'
import { AdvancedSettingsSection } from './AdvancedSettingsSection'
import { FormActions } from './FormActions'
import { useConnectionForm } from './useConnectionForm'
import type { ConnectionWithDetails } from '@/types/connection'

interface ConnectionFormProps {
  organizationId: string
  projectId: string
  connection?: ConnectionWithDetails
  onComplete: (connectionId?: string) => void
  onCancel: () => void
}

export const ConnectionForm = ({
  organizationId,
  projectId,
  connection,
  onComplete,
  onCancel,
}: ConnectionFormProps) => {
  const {
    form,
    isSaving,
    isTesting,
    showAdvanced,
    setShowAdvanced,
    isEditing,
    handleSubmit,
    handleTest,
  } = useConnectionForm({
    organizationId,
    projectId,
    connection,
    onComplete,
  })

  const { register, formState: { errors }, watch } = form

  return (
    <ErrorBoundary>
      <form onSubmit={handleSubmit}>
        {/* General Information */}
        <div className="mb-6 rounded-lg border border-border bg-background-secondary">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">
              <FormattedMessage id="connections.form.generalSection" />
            </h2>
          </div>
          <div className="p-6">
            <BasicConnectionSection
              register={register}
              errors={errors}
              isEditing={isEditing}
            />
          </div>
        </div>

        {/* Authentication */}
        <div className="mb-6 rounded-lg border border-border bg-background-secondary">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">
              <FormattedMessage id="connections.form.authSection" />
            </h2>
          </div>
          <div className="p-6">
            <AuthenticationSection
              register={register}
              errors={errors}
              watch={watch}
            />
          </div>
        </div>

        {/* Advanced Options */}
        <div className="mb-6 rounded-lg border border-border bg-background-secondary">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex w-full items-center justify-between px-6 py-4 text-left transition-colors hover:bg-background-tertiary"
          >
            <h2 className="text-lg font-semibold text-foreground">
              <FormattedMessage id="connections.form.advancedSection" />
            </h2>
            <svg
              className={`h-5 w-5 text-foreground-muted transition-transform ${
                showAdvanced ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showAdvanced && (
            <div className="overflow-hidden border-t border-border p-6">
              <AdvancedSettingsSection
                register={register}
                errors={errors}
                showAdvanced={showAdvanced}
                onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-3">
          <FormActions
            onCancel={onCancel}
            onTest={handleTest}
            isSaving={isSaving}
            isTesting={isTesting}
            isEditing={isEditing}
          />
        </div>
      </form>
    </ErrorBoundary>
  )
}

export default ConnectionForm