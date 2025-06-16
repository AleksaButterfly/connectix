export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  metadata?: {
    requestId?: string
    timestamp?: string
    [key: string]: unknown
  }
}

export class ApiClientError extends Error {
  code: string
  details?: unknown

  constructor(code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiClientError'
    this.code = code
    this.details = details
  }
}

export async function apiCall<T = unknown>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  let data: unknown
  const contentType = response.headers.get('content-type')

  if (contentType?.includes('application/json')) {
    data = await response.json()
  } else if (response.ok) {
    // For non-JSON responses (like file downloads), return the response directly
    return response as T
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
