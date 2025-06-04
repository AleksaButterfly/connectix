// lib/connections/encryption.ts
// Proper encryption implementation using Web Crypto API

interface EncryptedData {
  data: string // base64 encoded encrypted data
  iv: string // base64 encoded initialization vector
  salt: string // base64 encoded salt
}

/**
 * Encrypt connection credentials using AES-GCM with PBKDF2 key derivation
 */
export async function encryptCredentials(
  credentials: Record<string, any>,
  password?: string
): Promise<string> {
  try {
    const jsonString = JSON.stringify(credentials)
    const encoder = new TextEncoder()
    const data = encoder.encode(jsonString)

    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(32))
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Use environment variable or fallback password
    const derivedPassword =
      password || process.env.SSH_ENCRYPTION_KEY || 'your-master-encryption-key-change-this'

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(derivedPassword),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )

    // Derive encryption key using PBKDF2
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    )

    // Encrypt data using AES-GCM
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      data
    )

    // Convert to base64 for storage
    const encryptedArray = new Uint8Array(encryptedData)
    const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray))
    const ivBase64 = btoa(String.fromCharCode(...iv))
    const saltBase64 = btoa(String.fromCharCode(...salt))

    const result: EncryptedData = {
      data: encryptedBase64,
      iv: ivBase64,
      salt: saltBase64,
    }

    return JSON.stringify(result)
  } catch (error) {
    console.error('Encryption failed:', error)
    throw new Error('Failed to encrypt credentials')
  }
}

/**
 * Decrypt connection credentials
 */
export async function decryptCredentials(
  encryptedData: string,
  password?: string
): Promise<Record<string, any>> {
  try {
    const encrypted = JSON.parse(encryptedData) as EncryptedData
    const encoder = new TextEncoder()

    // Convert from base64
    const data = new Uint8Array(
      atob(encrypted.data)
        .split('')
        .map((c) => c.charCodeAt(0))
    )
    const iv = new Uint8Array(
      atob(encrypted.iv)
        .split('')
        .map((c) => c.charCodeAt(0))
    )
    const salt = new Uint8Array(
      atob(encrypted.salt)
        .split('')
        .map((c) => c.charCodeAt(0))
    )

    // Use same password as encryption
    const derivedPassword =
      password || process.env.SSH_ENCRYPTION_KEY || 'your-master-encryption-key-change-this'

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(derivedPassword),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )

    // Derive decryption key using same parameters
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    )

    // Decrypt data
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      data
    )

    const decoder = new TextDecoder()
    const jsonString = decoder.decode(decryptedData)

    return JSON.parse(jsonString)
  } catch (error) {
    console.error('Decryption failed:', error)
    throw new Error('Failed to decrypt credentials - invalid password or corrupted data')
  }
}

/**
 * Generate a secure random encryption key (for initialization)
 */
export function generateSecureKey(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
}

/**
 * Validate if encrypted data format is correct
 */
export function validateEncryptedFormat(encryptedData: string): boolean {
  try {
    const parsed = JSON.parse(encryptedData) as EncryptedData
    return !!(parsed.data && parsed.iv && parsed.salt)
  } catch {
    return false
  }
}

/**
 * Key rotation utility - re-encrypt with new key
 */
export async function rotateEncryptionKey(
  encryptedData: string,
  oldPassword: string,
  newPassword: string
): Promise<string> {
  // Decrypt with old key
  const credentials = await decryptCredentials(encryptedData, oldPassword)

  // Re-encrypt with new key
  return await encryptCredentials(credentials, newPassword)
}
