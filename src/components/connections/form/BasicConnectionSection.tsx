'use client'

import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { FormattedMessage } from '@/lib/i18n'
import { FormField, FormInput } from '@/components/ui'
import { ConnectionFormData } from './validation'

interface BasicConnectionSectionProps {
  register: UseFormRegister<ConnectionFormData>
  errors: FieldErrors<ConnectionFormData>
  isEditing?: boolean
}

export const BasicConnectionSection = ({ 
  register, 
  errors, 
  isEditing = false 
}: BasicConnectionSectionProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          <FormattedMessage id="connections.form.basicInfo" />
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label={<FormattedMessage id="connections.form.name" />}
            error={errors.name?.message}
            required
          >
            <input
              {...register('name')}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder-foreground-muted transition-all focus:border-terminal-green focus:outline-none focus:ring-2 focus:ring-terminal-green/20"
              placeholder="My Server"
            />
          </FormField>

          <FormField
            label={<FormattedMessage id="connections.form.description" />}
            error={errors.description?.message}
            optional
          >
            <input
              {...register('description')}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder-foreground-muted transition-all focus:border-terminal-green focus:outline-none focus:ring-2 focus:ring-terminal-green/20"
              placeholder="Development server"
            />
          </FormField>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          <FormattedMessage id="connections.form.serverDetails" />
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <FormField
              label={<FormattedMessage id="connections.form.host" />}
              error={errors.host?.message}
              required
            >
              <input
                {...register('host')}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder-foreground-muted transition-all focus:border-terminal-green focus:outline-none focus:ring-2 focus:ring-terminal-green/20"
                placeholder="192.168.1.100 or example.com"
              />
            </FormField>
          </div>

          <FormField
            label={<FormattedMessage id="connections.form.port" />}
            error={errors.port?.message}
            required
          >
            <input
              {...register('port', { valueAsNumber: true })}
              type="number"
              min="1"
              max="65535"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder-foreground-muted transition-all focus:border-terminal-green focus:outline-none focus:ring-2 focus:ring-terminal-green/20"
              placeholder="22"
            />
          </FormField>
        </div>

        <div className="mt-4">
          <FormField
            label={<FormattedMessage id="connections.form.username" />}
            error={errors.username?.message}
            required
          >
            <input
              {...register('username')}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder-foreground-muted transition-all focus:border-terminal-green focus:outline-none focus:ring-2 focus:ring-terminal-green/20"
              placeholder="root"
            />
          </FormField>
        </div>
      </div>
    </div>
  )
}