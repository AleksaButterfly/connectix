'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useIntl } from '@/lib/i18n'
import { useToast } from '@/components/ui'
import { connectionService } from '@/lib/connections/connection.service'
import { createConnectionSchema, ConnectionFormData } from './validation'
import type { ConnectionWithDetails, CreateConnectionInput, UpdateConnectionInput } from '@/types/connection'

interface UseConnectionFormOptions {
  organizationId: string
  projectId: string
  connection?: ConnectionWithDetails
  onComplete: (connectionId?: string) => void
}

export const useConnectionForm = ({
  organizationId,
  projectId,
  connection,
  onComplete
}: UseConnectionFormOptions) => {
  const intl = useIntl()
  const { toast } = useToast()
  const isEditing = !!connection

  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const connectionSchema = createConnectionSchema(intl)

  const form = useForm<ConnectionFormData>({
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

  const handleSubmit = async (data: ConnectionFormData) => {
    setIsSaving(true)
    try {
      if (isEditing && connection) {
        const updateData: UpdateConnectionInput = {
          ...data,
          credentials: {
            password: data.password,
            privateKey: data.privateKey,
            passphrase: data.passphrase,
          },
        }
        await connectionService.updateConnection(connection.id, updateData)
        toast.success(intl.formatMessage({ id: 'connections.form.updateSuccess' }))
        onComplete(connection.id)
      } else {
        const createData: CreateConnectionInput = {
          ...data,
          project_id: projectId,
          credentials: {
            password: data.password,
            privateKey: data.privateKey,
            passphrase: data.passphrase,
          },
        }
        const newConnection = await connectionService.createConnection(organizationId, createData)
        toast.success(intl.formatMessage({ id: 'connections.form.createSuccess' }))
        onComplete(newConnection.id)
      }
    } catch (error) {
      console.error('Failed to save connection:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : intl.formatMessage({ id: 'connections.form.saveError' })
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    // Trigger validation first
    const isValid = await form.trigger()
    if (!isValid) {
      toast.error(intl.formatMessage({ id: 'connections.form.validationError' }))
      return
    }

    setIsTesting(true)
    try {
      const formData = form.getValues()
      const testData = {
        host: formData.host,
        port: formData.port,
        username: formData.username,
        auth_type: formData.auth_type,
        credentials: {
          password: formData.password,
          privateKey: formData.privateKey,
          passphrase: formData.passphrase,
        },
        proxy_jump: formData.proxy_jump,
        connection_timeout: formData.connection_timeout,
        strict_host_checking: formData.strict_host_checking,
      }

      await connectionService.testConnection(testData)
      toast.success(intl.formatMessage({ id: 'connections.form.testSuccess' }))
    } catch (error) {
      console.error('Connection test failed:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : intl.formatMessage({ id: 'connections.form.testError' })
      toast.error(errorMessage)
    } finally {
      setIsTesting(false)
    }
  }

  return {
    form,
    isSaving,
    isTesting,
    showAdvanced,
    setShowAdvanced,
    isEditing,
    handleSubmit: form.handleSubmit(handleSubmit),
    handleTest,
  }
}