'use client'

import { UseFormRegister, FieldErrors, UseFormWatch } from 'react-hook-form'
import { FormattedMessage } from '@/lib/i18n'
import { FormField, FormInput, Select } from '@/components/ui'
import { ConnectionFormData } from './validation'

interface AuthenticationSectionProps {
  register: UseFormRegister<ConnectionFormData>
  errors: FieldErrors<ConnectionFormData>
  watch: UseFormWatch<ConnectionFormData>
}

export const AuthenticationSection = ({ 
  register, 
  errors, 
  watch 
}: AuthenticationSectionProps) => {
  const authType = watch('auth_type')

  const authTypeOptions = [
    { value: 'password', label: 'Password' },
    { value: 'private_key', label: 'Private Key' },
    { value: 'key_with_passphrase', label: 'Private Key with Passphrase' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          <FormattedMessage id="connections.form.authentication" />
        </h3>
        
        <FormField
          label={<FormattedMessage id="connections.form.authType" />}
          error={errors.auth_type?.message}
          required
        >
          <Select
            {...register('auth_type')}
            options={authTypeOptions}
            error={!!errors.auth_type}
          />
        </FormField>

        {authType === 'password' && (
          <div className="mt-4">
            <FormInput
              {...register('password')}
              type="password"
              label={<FormattedMessage id="connections.form.password" />}
              error={errors.password?.message}
              showPasswordToggle
              required
              placeholder="Enter password"
            />
          </div>
        )}

        {(authType === 'private_key' || authType === 'key_with_passphrase') && (
          <div className="mt-4 space-y-4">
            <FormField
              label={<FormattedMessage id="connections.form.privateKey" />}
              error={errors.privateKey?.message}
              required
              hint={<FormattedMessage id="connections.form.privateKeyHint" />}
            >
              <textarea
                {...register('privateKey')}
                rows={8}
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder-foreground-muted transition-all focus:border-terminal-green focus:outline-none focus:ring-2 focus:ring-terminal-green/20 font-mono"
                placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
              />
            </FormField>

            {authType === 'key_with_passphrase' && (
              <FormInput
                {...register('passphrase')}
                type="password"
                label={<FormattedMessage id="connections.form.passphrase" />}
                error={errors.passphrase?.message}
                showPasswordToggle
                required
                placeholder="Enter passphrase"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}