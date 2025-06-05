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
    console.warn('⚠️  No encryption key found in environment variables. Using fallback key.')
    console.warn('   Please set CONNECTIX_ENCRYPTION_KEY in your environment for production.')
    console.warn('   Current env check:')
    console.warn('     - CONNECTIX_ENCRYPTION_KEY:', !!process.env.CONNECTIX_ENCRYPTION_KEY)
    console.warn('     - SSH_ENCRYPTION_KEY:', !!process.env.SSH_ENCRYPTION_KEY)
    return 'connectix-fallback-key-change-in-production-2024'
  }

  // Clean the key of quotes
  const cleanKey = envKey.replace(/^["']|["']$/g, '')

  console.log('🔑 Using encryption key from environment')
  console.log(
    '   Source:',
    process.env.CONNECTIX_ENCRYPTION_KEY ? 'CONNECTIX_ENCRYPTION_KEY' : 'SSH_ENCRYPTION_KEY'
  )
  console.log('   Length:', cleanKey.length)
  console.log('   Preview:', cleanKey.substring(0, 10) + '...')

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

    console.log('🔐 ENCRYPT DEBUG')
    console.log('  Input credentials keys:', Object.keys(credentials))
    console.log('  JSON length:', jsonString.length)
    console.log('  Master key length:', masterKey.length)
    console.log('  IV length:', iv.length, 'Salt length:', salt.length)
    console.log('  Encrypted data length:', encrypted.length)
    console.log('  Auth tag length:', tag.length)
    console.log('  Final result length:', JSON.stringify(result).length)

    return JSON.stringify(result)
  } catch (error) {
    console.error('❌ Encryption failed:', error)
    console.error('  Input:', typeof credentials, Object.keys(credentials || {}))
    throw new Error('Failed to encrypt credentials: ' + (error as Error).message)
  }
}

/**
 * Decrypt connection credentials
 */
export function decryptCredentials(encryptedData: string, customKey?: string): Record<string, any> {
  try {
    console.log('🔓 DECRYPT START')
    console.log('  Input type:', typeof encryptedData)
    console.log('  Input length:', encryptedData?.length)

    if (!encryptedData || typeof encryptedData !== 'string') {
      throw new Error('Invalid encrypted data format - not a string')
    }

    let encrypted: EncryptedData
    try {
      encrypted = JSON.parse(encryptedData) as EncryptedData
    } catch (parseError) {
      console.error('❌ JSON parse failed:', parseError)
      throw new Error('Corrupted encrypted data - invalid JSON format')
    }

    console.log('  Parsed structure:')
    console.log('    - has data:', !!encrypted.data, 'length:', encrypted.data?.length)
    console.log('    - has iv:', !!encrypted.iv, 'length:', encrypted.iv?.length)
    console.log('    - has salt:', !!encrypted.salt, 'length:', encrypted.salt?.length)
    console.log('    - has tag:', !!encrypted.tag, 'length:', encrypted.tag?.length)

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
      console.error('❌ Base64 decode failed:', base64Error)
      throw new Error('Corrupted encrypted data - invalid base64 encoding')
    }

    console.log('  Decoded buffers:')
    console.log('    - data length:', data.length)
    console.log('    - iv length:', iv.length)
    console.log('    - salt length:', salt.length)
    console.log('    - tag length:', tag.length)

    const masterKey = customKey || getEncryptionKey()
    console.log('  Master key length:', masterKey.length)

    // Derive key using same parameters as encryption
    const key = crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256')
    console.log('  Derived key length:', key.length)

    // Set up decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAAD(salt)
    decipher.setAuthTag(tag)

    console.log('  Decipher configured, attempting decryption...')

    let decrypted: Buffer
    try {
      let decryptedPart = decipher.update(data)
      const final = decipher.final()
      decrypted = Buffer.concat([decryptedPart, final])
    } catch (decipherError: any) {
      console.error('❌ Decipher failed:', decipherError)
      console.error('  Error type:', decipherError.constructor.name)
      console.error('  Error code:', decipherError.code)

      if (
        decipherError.message?.includes('Unsupported state') ||
        decipherError.message?.includes('Invalid tag') ||
        decipherError.message?.includes('bad decrypt')
      ) {
        throw new Error('Failed to decrypt credentials - authentication failed')
      }

      throw new Error('Failed to decrypt credentials - cipher error: ' + decipherError.message)
    }

    console.log('  Decryption successful, buffer length:', decrypted.length)

    let jsonString: string
    try {
      jsonString = decrypted.toString('utf8')
    } catch (utf8Error) {
      console.error('❌ UTF-8 decode failed:', utf8Error)
      throw new Error('Failed to decrypt credentials - invalid character encoding')
    }

    console.log('  JSON string length:', jsonString.length)
    console.log('  JSON preview:', jsonString.substring(0, 100) + '...')

    let result: Record<string, any>
    try {
      result = JSON.parse(jsonString)
    } catch (jsonParseError) {
      console.error('❌ Final JSON parse failed:', jsonParseError)
      console.error('  JSON string:', jsonString.substring(0, 200))
      throw new Error('Failed to decrypt credentials - decrypted data is not valid JSON')
    }

    console.log('✅ DECRYPT SUCCESS')
    console.log('  Result keys:', Object.keys(result))

    return result
  } catch (error) {
    console.error('❌ DECRYPT FAILED - Full Error Details:')
    console.error('  Error message:', (error as Error).message)
    console.error('  Error name:', (error as Error).name)
    console.error('  Error stack:', (error as Error).stack)

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
    console.log('🧪 RUNNING ENCRYPTION TEST')

    const testData = { username: 'test', password: 'secret123', timestamp: Date.now() }
    console.log('  Test data:', testData)

    const encrypted = encryptCredentials(testData, customKey)
    console.log('  Encryption completed, length:', encrypted.length)

    const decrypted = decryptCredentials(encrypted, customKey)
    console.log('  Decryption completed')

    const originalJson = JSON.stringify(testData)
    const decryptedJson = JSON.stringify(decrypted)
    const passed = originalJson === decryptedJson

    console.log('  Original JSON:', originalJson)
    console.log('  Decrypted JSON:', decryptedJson)
    console.log('  Test passed:', passed)

    if (!passed) {
      console.error('❌ Test data mismatch!')
      console.error('  Original keys:', Object.keys(testData))
      console.error('  Decrypted keys:', Object.keys(decrypted))
    }

    return passed
  } catch (error) {
    console.error('❌ Encryption test failed:', error)
    return false
  }
}

/**
 * Key rotation utility - re-encrypt with new key
 */
export function rotateEncryptionKey(encryptedData: string, oldKey: string, newKey: string): string {
  console.log('🔄 Rotating encryption key')
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
  console.log('🔍 Checking encryption configuration...')

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

  console.log('  Configuration result:', result)
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
