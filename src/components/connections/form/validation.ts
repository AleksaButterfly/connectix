import { z } from 'zod'

export const createConnectionSchema = (intl: any) => z
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

export type ConnectionFormData = z.infer<ReturnType<typeof createConnectionSchema>>