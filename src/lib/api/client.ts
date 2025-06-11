export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  metadata?: {
    requestId?: string
    timestamp?: string
    [key: string]: any
  }
}

export class ApiClientError extends Error {
  code: string
  details?: any

  constructor(code: string, message: string, details?: any) {
    super(message)
    this.name = 'ApiClientError'
    this.code = code
    this.details = details
  }
}

export async function apiCall<T = any>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  let data: any
  const contentType = response.headers.get('content-type')

  if (contentType?.includes('application/json')) {
    data = await response.json()
  } else if (response.ok) {
    // For non-JSON responses (like file downloads), return the response directly
    return response as any
  } else {
    throw new ApiClientError('INVALID_RESPONSE', `Expected JSON response but got ${contentType}`)
  }

  // Check if this is the new standardized format
  if ('success' in data && typeof data.success === 'boolean') {
    // New standardized format
    if (!response.ok || !data.success) {
      // Handle new error format
      if (data.error) {
        throw new ApiClientError(
          data.error,
          data.message || 'An error occurred',
          data.details
        )
      }
      throw new ApiClientError('API_ERROR', `Request failed with status ${response.status}`)
    }
    // Return the data directly
    return data.data as T
  } else {
    // Legacy format - direct response
    if (!response.ok) {
      // Handle legacy error format
      if (data.error) {
        throw new ApiClientError(
          'API_ERROR',
          typeof data.error === 'string' ? data.error : data.error.message || 'An error occurred',
          data.error.details
        )
      }
      throw new ApiClientError('API_ERROR', `Request failed with status ${response.status}`)
    }
    // Return the data directly for legacy format
    return data as T
  }
}
