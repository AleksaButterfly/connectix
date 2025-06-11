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
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {isEditing ? (
              <FormattedMessage id="connections.form.editConnection" />
            ) : (
              <FormattedMessage id="connections.form.createConnection" />
            )}
          </h2>
          <p className="mt-1 text-sm text-foreground-muted">
            {isEditing ? (
              <FormattedMessage id="connections.form.editDescription" />
            ) : (
              <FormattedMessage id="connections.form.createDescription" />
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <BasicConnectionSection
            register={register}
            errors={errors}
            isEditing={isEditing}
          />

          <AuthenticationSection
            register={register}
            errors={errors}
            watch={watch}
          />

          <AdvancedSettingsSection
            register={register}
            errors={errors}
            showAdvanced={showAdvanced}
            onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
          />

          <div className="border-t border-border pt-6">
            <FormActions
              onCancel={onCancel}
              onTest={handleTest}
              isSaving={isSaving}
              isTesting={isTesting}
              isEditing={isEditing}
            />
          </div>
        </form>
      </div>
    </ErrorBoundary>
  )
}

export default ConnectionForm