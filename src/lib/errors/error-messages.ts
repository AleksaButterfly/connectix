// src/lib/errors/error-messages.ts

// Map error messages to translation keys
export const errorMessageMap: Record<string, string> = {
  // Auth errors
  username_taken: 'auth.error.usernameTaken',
  'User already registered': 'auth.error.emailRegistered',
  'Invalid login credentials': 'auth.error.invalidCredentials',
  'Email not confirmed': 'auth.error.emailNotConfirmed',

  // Database errors that mean username is taken
  'Database error saving new user': 'auth.error.usernameTaken',
  'duplicate key value': 'auth.error.usernameTaken',
  'unique constraint': 'auth.error.usernameTaken',
  '23505': 'auth.error.usernameTaken',

  // Organization errors
  'Not authenticated': 'auth.error.notAuthenticated',

  // Common errors
  'common.error.unknown': 'common.error.unknown',
}

// Helper to get translation key from error message
export function getErrorMessageKey(error: any): string {
  if (!error) return 'common.error.unknown'

  const message = error.message || error
  const code = error.code

  // Check if it's already a translation key
  if (typeof message === 'string' && message.includes('.error.')) {
    return message
  }

  // Check for error code first
  if (code && errorMessageMap[code]) {
    return errorMessageMap[code]
  }

  // Check for organization-specific errors
  const orgError = checkOrganizationError(error)
  if (orgError) return orgError

  // Check for exact matches
  if (errorMessageMap[message]) {
    return errorMessageMap[message]
  }

  // Check for partial matches
  for (const [key, value] of Object.entries(errorMessageMap)) {
    if (typeof message === 'string' && message.includes(key)) {
      return value
    }
  }

  // Return the original message if no mapping found
  return message
}
