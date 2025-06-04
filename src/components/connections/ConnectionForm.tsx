'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useIntl, FormattedMessage } from '@/lib/i18n'
import FormInput from '@/components/ui/FormInput'
import { connectionService } from '@/lib/connections/connection.service'
import type {
  ConnectionWithDetails,
  CreateConnectionInput,
  UpdateConnectionInput,
} from '@/types/connection'

interface ConnectionFormProps {
  organizationId: string
  projectId: string // Made required
  connection?: ConnectionWithDetails
  onComplete: () => void
  onCancel: () => void
}

export default function ConnectionForm({
  organizationId,
  projectId,
  connection,
  onComplete,
  onCancel,
}: ConnectionFormProps) {
  const intl = useIntl()
  const isEditing = !!connection
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Form validation schema
  const connectionSchema = z
    .object({
      name: z
        .string()
        .min(1, intl.formatMessage({ id: 'connections.validation.nameRequired' }))
        .max(100, intl.formatMessage({ id: 'connections.validation.nameTooLong' }))
        .trim(),
      description: z.string().optional().nullable(),
      host: z
        .string()
        .min(1, intl.formatMessage({ id: 'connections.validation.hostRequired' }))
        .trim(),
      port: z
        .number()
        .min(1, intl.formatMessage({ id: 'connections.validation.portInvalid' }))
        .max(65535, intl.formatMessage({ id: 'connections.validation.portInvalid' })),
      username: z
        .string()
        .min(1, intl.formatMessage({ id: 'connections.validation.usernameRequired' }))
        .trim(),
      auth_type: z.enum(['password', 'private_key', 'key_with_passphrase']),
      password: z.string().optional(),
      privateKey: z.string().optional(),
      passphrase: z.string().optional(),
      proxy_jump: z.string().optional().nullable(),
      connection_timeout: z.number().min(1).max(300).optional(),
      keepalive_interval: z.number().min(1).max(300).optional(),
      strict_host_checking: z.boolean(),
    })
    .refine(
      (data) => {
        if (data.auth_type === 'password' && !data.password) {
          return false
        }
        if (data.auth_type === 'private_key' && !data.privateKey) {
          return false
        }
        if (data.auth_type === 'key_with_passphrase' && (!data.privateKey || !data.passphrase)) {
          return false
        }
        return true
      },
      {
        message: intl.formatMessage({ id: 'connections.validation.passwordRequired' }),
        path: ['password'],
      }
    )

  type ConnectionFormData = z.infer<typeof connectionSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<ConnectionFormData>({
    resolver: zodResolver(connectionSchema),
    defaultValues: {
      name: connection?.name || '',
      description: connection?.description || '',
      host: connection?.host || '',
      port: connection?.port || 22,
      username: connection?.username || '',
      auth_type: connection?.auth_type || 'password',
      password: '',
      privateKey: '',
      passphrase: '',
      proxy_jump: connection?.proxy_jump || '',
      connection_timeout: connection?.connection_timeout || 30,
      keepalive_interval: connection?.keepalive_interval || 60,
      strict_host_checking: connection?.strict_host_checking ?? true,
    },
  })

  const authType = watch('auth_type')

  // Convert port input to number
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'port' && typeof value.port === 'string') {
        const portNum = parseInt(value.port, 10)
        if (!isNaN(portNum)) {
          setValue('port', portNum)
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [watch, setValue])

  const onSubmit = async (data: ConnectionFormData) => {
    try {
      setIsSaving(true)

      if (isEditing) {
        const updates: UpdateConnectionInput = {
          name: data.name,
          description: data.description || null,
          host: data.host,
          port: data.port,
          username: data.username,
          auth_type: data.auth_type,
          proxy_jump: data.proxy_jump || null,
          connection_timeout: data.connection_timeout,
          keepalive_interval: data.keepalive_interval,
          strict_host_checking: data.strict_host_checking,
        }

        // Only update credentials if they were changed
        if (data.auth_type === 'password' && data.password) {
          updates.credentials = { password: data.password }
        } else if (data.auth_type === 'private_key' && data.privateKey) {
          updates.credentials = { privateKey: data.privateKey }
        } else if (data.auth_type === 'key_with_passphrase' && data.privateKey && data.passphrase) {
          updates.credentials = { privateKey: data.privateKey, passphrase: data.passphrase }
        }

        await connectionService.updateConnection(connection.id, updates)
      } else {
        const input: CreateConnectionInput = {
          name: data.name,
          description: data.description || null,
          project_id: projectId!, // Required now
          host: data.host,
          port: data.port,
          username: data.username,
          auth_type: data.auth_type,
          credentials: {},
          proxy_jump: data.proxy_jump || null,
          connection_timeout: data.connection_timeout,
          keepalive_interval: data.keepalive_interval,
          strict_host_checking: data.strict_host_checking,
        }

        if (data.auth_type === 'password') {
          input.credentials.password = data.password
        } else if (data.auth_type === 'private_key') {
          input.credentials.privateKey = data.privateKey
        } else if (data.auth_type === 'key_with_passphrase') {
          input.credentials.privateKey = data.privateKey
          input.credentials.passphrase = data.passphrase
        }

        await connectionService.createConnection(organizationId, input)
      }

      onComplete()
    } catch (error: any) {
      console.error('Failed to save connection:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    const isValid = await trigger()
    if (!isValid) return

    setIsTesting(true)
    const values = watch()

    try {
      const testInput = {
        host: values.host,
        port: values.port,
        username: values.username,
        auth_type: values.auth_type,
        credentials: {},
        proxy_jump: values.proxy_jump || null,
        connection_timeout: values.connection_timeout,
        strict_host_checking: values.strict_host_checking,
      }

      if (values.auth_type === 'password') {
        testInput.credentials = { password: values.password }
      } else if (values.auth_type === 'private_key') {
        testInput.credentials = { privateKey: values.privateKey }
      } else if (values.auth_type === 'key_with_passphrase') {
        testInput.credentials = { privateKey: values.privateKey, passphrase: values.passphrase }
      }

      const result = await connectionService.testConnection(testInput)

      if (result.success) {
        // Success is handled by the service
      }
    } catch (error) {
      // Error is handled by the service
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          {isEditing ? (
            <FormattedMessage id="connections.edit.title" />
          ) : (
            <FormattedMessage id="connections.create.title" />
          )}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* General Information */}
        <div className="mb-6 rounded-lg border border-border bg-background-secondary">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">
              <FormattedMessage id="connections.form.generalSection" />
            </h2>
          </div>
          <div className="space-y-6 p-6">
            <div>
              <FormInput
                label={intl.formatMessage({ id: 'connections.form.nameLabel' })}
                placeholder={intl.formatMessage({ id: 'connections.form.namePlaceholder' })}
                error={errors.name?.message}
                {...register('name')}
              />
              <p className="mt-2 text-sm text-foreground-muted">
                <FormattedMessage id="connections.form.nameHint" />
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                {intl.formatMessage({ id: 'connections.form.descriptionLabel' })}
              </label>
              <textarea
                className={`w-full rounded-lg border bg-background px-4 py-2.5 text-foreground placeholder-foreground-muted transition-colors focus:border-terminal-green focus:outline-none focus:ring-1 focus:ring-terminal-green ${
                  errors.description ? 'border-red-500' : 'border-border'
                }`}
                placeholder={intl.formatMessage({ id: 'connections.form.descriptionPlaceholder' })}
                rows={3}
                {...register('description')}
              />
              <p className="mt-2 text-sm text-foreground-muted">
                <FormattedMessage id="connections.form.descriptionHint" />
              </p>
            </div>
          </div>
        </div>

        {/* Connection Details */}
        <div className="mb-6 rounded-lg border border-border bg-background-secondary">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">
              <FormattedMessage id="connections.form.connectionSection" />
            </h2>
          </div>
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <FormInput
                  label={intl.formatMessage({ id: 'connections.form.hostLabel' })}
                  placeholder={intl.formatMessage({ id: 'connections.form.hostPlaceholder' })}
                  error={errors.host?.message}
                  {...register('host')}
                />
              </div>
              <div>
                <FormInput
                  type="number"
                  label={intl.formatMessage({ id: 'connections.form.portLabel' })}
                  placeholder={intl.formatMessage({ id: 'connections.form.portPlaceholder' })}
                  error={errors.port?.message}
                  {...register('port', { valueAsNumber: true })}
                />
              </div>
            </div>

            <div>
              <FormInput
                label={intl.formatMessage({ id: 'connections.form.usernameLabel' })}
                placeholder={intl.formatMessage({ id: 'connections.form.usernamePlaceholder' })}
                error={errors.username?.message}
                {...register('username')}
              />
            </div>
          </div>
        </div>

        {/* Authentication */}
        <div className="mb-6 rounded-lg border border-border bg-background-secondary">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">
              <FormattedMessage id="connections.form.authSection" />
            </h2>
          </div>
          <div className="space-y-6 p-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                {intl.formatMessage({ id: 'connections.form.authTypeLabel' })}
              </label>
              <select
                className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground transition-colors focus:border-terminal-green focus:outline-none focus:ring-1 focus:ring-terminal-green"
                {...register('auth_type')}
              >
                <option value="password">
                  {intl.formatMessage({ id: 'connections.form.authTypes.password' })}
                </option>
                <option value="private_key">
                  {intl.formatMessage({ id: 'connections.form.authTypes.private_key' })}
                </option>
                <option value="key_with_passphrase">
                  {intl.formatMessage({ id: 'connections.form.authTypes.key_with_passphrase' })}
                </option>
              </select>
            </div>

            {authType === 'password' && (
              <div>
                <FormInput
                  type="password"
                  label={intl.formatMessage({ id: 'connections.form.passwordLabel' })}
                  placeholder={intl.formatMessage({ id: 'connections.form.passwordPlaceholder' })}
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>
            )}

            {(authType === 'private_key' || authType === 'key_with_passphrase') && (
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  {intl.formatMessage({ id: 'connections.form.privateKeyLabel' })}
                </label>
                <textarea
                  className={`w-full rounded-lg border bg-background px-4 py-2.5 font-mono text-sm text-foreground placeholder-foreground-muted transition-colors focus:border-terminal-green focus:outline-none focus:ring-1 focus:ring-terminal-green ${
                    errors.privateKey ? 'border-red-500' : 'border-border'
                  }`}
                  placeholder={intl.formatMessage({ id: 'connections.form.privateKeyPlaceholder' })}
                  rows={10}
                  {...register('privateKey')}
                />
                {errors.privateKey && (
                  <p className="mt-1 text-sm text-red-500">{errors.privateKey.message}</p>
                )}
                <p className="mt-2 text-sm text-foreground-muted">
                  <FormattedMessage id="connections.form.privateKeyHint" />
                </p>
              </div>
            )}

            {authType === 'key_with_passphrase' && (
              <div>
                <FormInput
                  type="password"
                  label={intl.formatMessage({ id: 'connections.form.passphraseLabel' })}
                  placeholder={intl.formatMessage({ id: 'connections.form.passphrasePlaceholder' })}
                  error={errors.passphrase?.message}
                  {...register('passphrase')}
                />
              </div>
            )}
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showAdvanced && (
            <div className="space-y-6 border-t border-border p-6">
              <div>
                <FormInput
                  label={intl.formatMessage({ id: 'connections.form.proxyJumpLabel' })}
                  placeholder={intl.formatMessage({ id: 'connections.form.proxyJumpPlaceholder' })}
                  error={errors.proxy_jump?.message}
                  {...register('proxy_jump')}
                />
                <p className="mt-2 text-sm text-foreground-muted">
                  <FormattedMessage id="connections.form.proxyJumpHint" />
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FormInput
                    type="number"
                    label={intl.formatMessage({ id: 'connections.form.connectionTimeoutLabel' })}
                    error={errors.connection_timeout?.message}
                    {...register('connection_timeout', { valueAsNumber: true })}
                  />
                  <p className="mt-2 text-sm text-foreground-muted">
                    <FormattedMessage id="connections.form.connectionTimeoutHint" />
                  </p>
                </div>
                <div>
                  <FormInput
                    type="number"
                    label={intl.formatMessage({ id: 'connections.form.keepaliveIntervalLabel' })}
                    error={errors.keepalive_interval?.message}
                    {...register('keepalive_interval', { valueAsNumber: true })}
                  />
                  <p className="mt-2 text-sm text-foreground-muted">
                    <FormattedMessage id="connections.form.keepaliveIntervalHint" />
                  </p>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border bg-background text-terminal-green focus:ring-terminal-green"
                    {...register('strict_host_checking')}
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground">
                      {intl.formatMessage({ id: 'connections.form.strictHostCheckingLabel' })}
                    </span>
                    <p className="text-sm text-foreground-muted">
                      <FormattedMessage id="connections.form.strictHostCheckingHint" />
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-3">
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting}
            className="rounded-lg border border-border bg-background-secondary px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-background-tertiary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isTesting ? (
              <FormattedMessage id="connections.create.testing" />
            ) : (
              <FormattedMessage id="connections.create.testButton" />
            )}
          </button>

          <div className="flex gap-3">
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
        </div>
      </form>
    </div>
  )
}
