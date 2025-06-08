interface APIError {
  code?: string
  detail?: string
  status?: string
  title?: string
  [key: string]: any // In case there are additional fields
}

interface ErrorWithAPI extends Partial<Error> {
  status?: number
  statusText?: string
  data?: {
    errors?: APIError[]
    [key: string]: any
  }
  [key: string]: any
}

/**
 * Return apiErrors from error response
 */
const responseAPIErrors = (error: ErrorWithAPI): APIError[] => {
  return error?.data?.errors ?? []
}

export const storableError = (err?: ErrorWithAPI) => {
  const error = err || {}
  const { name, message, status, statusText } = error
  const apiErrors = responseAPIErrors(error)

  return {
    type: 'error' as const,
    name,
    message,
    status,
    statusText,
    apiErrors,
  }
}
