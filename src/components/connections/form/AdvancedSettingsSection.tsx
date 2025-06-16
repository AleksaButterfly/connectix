'use client'

import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { FormattedMessage } from '@/lib/i18n'
import { FormField } from '@/components/ui'
import { ConnectionFormData } from './validation'

interface AdvancedSettingsSectionProps {
  register: UseFormRegister<ConnectionFormData>
  errors: FieldErrors<ConnectionFormData>
  showAdvanced: boolean
  onToggleAdvanced: () => void
}

export const AdvancedSettingsSection = ({ 
  register, 
  errors, 
  showAdvanced,
  onToggleAdvanced
}: AdvancedSettingsSectionProps) => {
  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={onToggleAdvanced}
          className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-terminal-green transition-colors"
        >
          <svg
            className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <FormattedMessage id="connections.form.advancedSettings" />
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4 pl-6">
            <FormField
              label={<FormattedMessage id="connections.form.proxyJump" />}
              error={errors.proxy_jump?.message}
              optional
              hint={<FormattedMessage id="connections.form.proxyJumpHint" />}
            >
              <input
                {...register('proxy_jump')}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder-foreground-muted transition-all focus:border-terminal-green focus:outline-none focus:ring-2 focus:ring-terminal-green/20"
                placeholder="user@bastion.example.com"
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                label={<FormattedMessage id="connections.form.connectionTimeout" />}
                error={errors.connection_timeout?.message}
                optional
                hint={<FormattedMessage id="connections.form.timeoutInSeconds" />}
              >
                <input
                  {...register('connection_timeout', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  max="300"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder-foreground-muted transition-all focus:border-terminal-green focus:outline-none focus:ring-2 focus:ring-terminal-green/20"
                  placeholder="30"
                />
              </FormField>

              <FormField
                label={<FormattedMessage id="connections.form.keepaliveInterval" />}
                error={errors.keepalive_interval?.message}
                optional
                hint={<FormattedMessage id="connections.form.intervalInSeconds" />}
              >
                <input
                  {...register('keepalive_interval', { valueAsNumber: true })}
                  type="number"
                  min="1"
                  max="300"
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder-foreground-muted transition-all focus:border-terminal-green focus:outline-none focus:ring-2 focus:ring-terminal-green/20"
                  placeholder="60"
                />
              </FormField>
            </div>

            <div className="flex items-center space-x-2">
              <input
                {...register('strict_host_checking')}
                type="checkbox"
                id="strictHostChecking"
                className="h-4 w-4 rounded border-border text-terminal-green focus:ring-terminal-green focus:ring-offset-0"
              />
              <label
                htmlFor="strictHostChecking"
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                <FormattedMessage id="connections.form.strictHostChecking" />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}