import crypto from 'crypto'

interface EncryptedData {
  data: string // base64 encoded encrypted data
  iv: string // base64 encoded initialization vector
  salt: string // base64 encoded salt
  tag: string // base64 encoded authentication tag
}

// Get encryption key from environment or use a secure default
function getEncryptionKey(): string {
  const envKey = process.env.CONNECTIX_ENCRYPTION_KEY || process.env.SSH_ENCRYPTION_KEY

  if (!envKey) {
    return 'connectix-fallback-key-change-in-production-2024'
  }

  // Clean the key of quotes
  const cleanKey = envKey.replace(/^["']|["']$/g, '')

  return cleanKey
}

/**
 * Encrypt connection credentials using AES-256-GCM with PBKDF2 key derivation
 */
export function encryptCredentials(credentials: Record<string, any>, customKey?: string): string {
  try {
    const jsonString = JSON.stringify(credentials)
    const data = Buffer.from(jsonString, 'utf8')

    const salt = crypto.randomBytes(32)
    const iv = crypto.randomBytes(16)
    const masterKey = customKey || getEncryptionKey()
    const key = crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256')

    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    cipher.setAAD(salt)

    let encrypted = cipher.update(data)
    const final = cipher.final()
    encrypted = Buffer.concat([encrypted, final])

    const tag = cipher.getAuthTag()

    const result: EncryptedData = {
      data: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      salt: salt.toString('base64'),
      tag: tag.toString('base64'),
    }

    return JSON.stringify(result)
  } catch (error) {
    throw new Error('Failed to encrypt credentials: ' + (error as Error).message)
  }
}

/**
 * Decrypt connection credentials
 */
export function decryptCredentials(encryptedData: string, customKey?: string): Record<string, any> {
  try {
    if (!encryptedData || typeof encryptedData !== 'string') {
      throw new Error('Invalid encrypted data format - not a string')
    }

    let encrypted: EncryptedData
    try {
      encrypted = JSON.parse(encryptedData) as EncryptedData
    } catch {
      throw new Error('Corrupted encrypted data - invalid JSON format')
    }

    if (!encrypted.data || !encrypted.iv || !encrypted.salt || !encrypted.tag) {
      throw new Error('Corrupted encrypted data - missing required fields')
    }

    // Decode base64 components
    let data: Buffer, iv: Buffer, salt: Buffer, tag: Buffer
    try {
      data = Buffer.from(encrypted.data, 'base64')
      iv = Buffer.from(encrypted.iv, 'base64')
      salt = Buffer.from(encrypted.salt, 'base64')
      tag = Buffer.from(encrypted.tag, 'base64')
    } catch (base64Error) {
      throw new Error('Corrupted encrypted data - invalid base64 encoding')
    }

    const masterKey = customKey || getEncryptionKey()

    // Derive key using same parameters as encryption
    const key = crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256')

    // Set up decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAAD(salt)
    decipher.setAuthTag(tag)

    let decrypted: Buffer
    try {
      const decryptedPart = decipher.update(data)
      const final = decipher.final()
      decrypted = Buffer.concat([decryptedPart, final])
    } catch (decipherError) {
      const errorMessage = decipherError instanceof Error ? decipherError.message : String(decipherError)
      if (
        errorMessage?.includes('Unsupported state') ||
        errorMessage?.includes('Invalid tag') ||
        errorMessage?.includes('bad decrypt')
      ) {
        throw new Error('Failed to decrypt credentials - authentication failed')
      }

      throw new Error('Failed to decrypt credentials - cipher error: ' + errorMessage)
    }

    let jsonString: string
    try {
      jsonString = decrypted.toString('utf8')
    } catch {
      throw new Error('Failed to decrypt credentials - invalid character encoding')
    }

    let result: Record<string, unknown>
    try {
      result = JSON.parse(jsonString)
    } catch {
      throw new Error('Failed to decrypt credentials - decrypted data is not valid JSON')
    }

    return result
  } catch (error) {
    // Re-throw with more specific error messages
    const errorMessage = (error as Error).message

    if (error instanceof SyntaxError) {
      throw new Error('Failed to decrypt credentials - corrupted data format')
    }
    if (errorMessage?.includes('bad decrypt')) {
      throw new Error('Failed to decrypt credentials - invalid encryption key')
    }
    if (errorMessage?.includes('Unsupported state')) {
      throw new Error('Failed to decrypt credentials - authentication failed')
    }
    if (errorMessage?.includes('Invalid tag')) {
      throw new Error('Failed to decrypt credentials - authentication tag verification failed')
    }
    if (errorMessage?.includes('authentication failed')) {
      throw new Error('Failed to decrypt credentials - authentication failed')
    }

    // Re-throw the original error if it already has a good message
    if (errorMessage?.startsWith('Failed to decrypt credentials')) {
      throw error
    }

    throw new Error('Failed to decrypt credentials - ' + errorMessage)
  }
}

/**
 * Generate a secure random encryption key
 */
export function generateSecureKey(): string {
  return crypto.randomBytes(32).toString('base64')
}

/**
 * Validate if encrypted data format is correct
 */
export function validateEncryptedFormat(encryptedData: string): boolean {
  try {
    if (!encryptedData || typeof encryptedData !== 'string') {
      return false
    }

    const parsed = JSON.parse(encryptedData) as EncryptedData
    return !!(parsed.data && parsed.iv && parsed.salt && parsed.tag)
  } catch {
    return false
  }
}

/**
 * Test encryption/decryption with sample data
 */
export function testEncryption(customKey?: string): boolean {
  try {
    const testData = { username: 'test', password: 'secret123', timestamp: Date.now() }
    const encrypted = encryptCredentials(testData, customKey)
    const decrypted = decryptCredentials(encrypted, customKey)

    const originalJson = JSON.stringify(testData)
    const decryptedJson = JSON.stringify(decrypted)
    const passed = originalJson === decryptedJson

    return passed
  } catch {
    return false
  }
}

/**
 * Key rotation utility - re-encrypt with new key
 */
export function rotateEncryptionKey(encryptedData: string, oldKey: string, newKey: string): string {
  const credentials = decryptCredentials(encryptedData, oldKey)
  return encryptCredentials(credentials, newKey)
}

/**
 * Check if environment is properly configured
 */
export function checkEncryptionConfig(): {
  hasKey: boolean
  keySource: string
  keyLength: number
  testPassed: boolean
  error?: string
} {
  const hasConnectixKey = !!process.env.CONNECTIX_ENCRYPTION_KEY
  const hasSSHKey = !!process.env.SSH_ENCRYPTION_KEY

  const keySource = hasConnectixKey
    ? 'CONNECTIX_ENCRYPTION_KEY'
    : hasSSHKey
      ? 'SSH_ENCRYPTION_KEY'
      : 'fallback'

  let keyLength = 0
  let testPassed = false
  let error: string | undefined

  try {
    const key = getEncryptionKey()
    keyLength = key.length
    testPassed = testEncryption()

    if (!testPassed) {
      error = 'Encryption test failed - key may be invalid'
    }
  } catch (testError) {
    error = 'Encryption test error: ' + (testError as Error).message
  }

  const result = {
    hasKey: hasConnectixKey || hasSSHKey,
    keySource,
    keyLength,
    testPassed,
    error,
  }

  return result
}

/**
 * Emergency function to clear all encrypted credentials
 * Use this only if you need to force users to re-enter credentials
 */
export function getEmergencyCleanupSQL(): string {
  return `
-- Emergency cleanup - forces users to re-enter credentials
UPDATE connections 
SET 
  encrypted_credentials = NULL,
  connection_test_status = 'pending',
  last_test_error = 'Credentials cleared due to encryption key mismatch. Please re-enter your credentials.',
  updated_at = NOW()
WHERE 
  encrypted_credentials IS NOT NULL;

-- Check how many connections will be affected
SELECT COUNT(*) as affected_connections 
FROM connections 
WHERE encrypted_credentials IS NOT NULL;
  `.trim()
}
