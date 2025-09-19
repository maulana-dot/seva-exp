import { logger } from './logger'

/**
 * Encryption utility for securing frontend-backend communication
 * Uses AES-256-GCM encryption with Web Crypto API
 */

// Generate a key from a password using PBKDF2
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// Get or generate encryption key
let cachedKey: CryptoKey | null = null
const ENCRYPTION_PASSWORD = 'seva_app_encryption_key_2025' // In production, this should be from env

async function getEncryptionKey(): Promise<CryptoKey> {
  if (cachedKey) {
    return cachedKey
  }

  const salt = new Uint8Array(16) // In production, this should be from env or generated
  // For demo purposes, use a fixed salt. In production, use a proper salt management
  for (let i = 0; i < salt.length; i++) {
    salt[i] = i * 17 % 256
  }

  cachedKey = await deriveKey(ENCRYPTION_PASSWORD, salt)
  return cachedKey
}

/**
 * Encrypt data using AES-256-GCM
 */
export async function encryptData(data: unknown): Promise<string> {
  try {
    const key = await getEncryptionKey()
    const encoder = new TextEncoder()

    // Convert data to JSON string then to bytes
    const jsonString = JSON.stringify(data)
    const dataBuffer = encoder.encode(jsonString)

    // Generate random IV (12 bytes for GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      dataBuffer
    )

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encryptedBuffer), iv.length)

    // Convert to base64 for transmission
    const base64 = btoa(String.fromCharCode(...combined))

    logger.debug('Data encrypted successfully', { originalSize: jsonString.length, encryptedSize: base64.length })
    return base64
  } catch (error) {
    logger.error('Encryption failed', { error })
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt data using AES-256-GCM
 */
export async function decryptData<T = unknown>(encryptedData: string): Promise<T> {
  try {
    const key = await getEncryptionKey()
    const decoder = new TextDecoder()

    // Convert from base64
    const combined = new Uint8Array(
      atob(encryptedData)
        .split('')
        .map(c => c.charCodeAt(0))
    )

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12)
    const encryptedBuffer = combined.slice(12)

    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      encryptedBuffer
    )

    // Convert back to string and parse JSON
    const jsonString = decoder.decode(decryptedBuffer)
    const data = JSON.parse(jsonString)

    logger.debug('Data decrypted successfully', { decryptedSize: jsonString.length })
    return data as T
  } catch (error) {
    logger.error('Decryption failed', { error })
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Encrypt request payload
 */
export async function encryptRequestPayload(payload: unknown): Promise<{ encrypted: string; timestamp: number }> {
  const timestampedPayload = {
    data: payload,
    timestamp: Date.now()
  }

  const encrypted = await encryptData(timestampedPayload)

  return {
    encrypted,
    timestamp: timestampedPayload.timestamp
  }
}

/**
 * Decrypt response payload
 */
export async function decryptResponsePayload<T = unknown>(encryptedResponse: { encrypted: string; timestamp: number }): Promise<T> {
  const decrypted = await decryptData<{ data: T; timestamp: number }>(encryptedResponse.encrypted)

  // Verify timestamp (optional security check)
  const now = Date.now()
  const age = now - decrypted.timestamp

  if (age > 5 * 60 * 1000) { // 5 minutes max age
    logger.warn('Decrypted response is too old', { age })
  }

  return decrypted.data
}

/**
 * Utility to check if encryption is available
 */
export function isEncryptionSupported(): boolean {
  return typeof crypto !== 'undefined' &&
         typeof crypto.subtle !== 'undefined' &&
         typeof crypto.subtle.encrypt === 'function'
}

/**
 * Wrapper for fetch with automatic encryption/decryption
 */
export async function encryptedFetch<TResponse = unknown, TRequest = unknown>(
  url: string,
  options: RequestInit & { body?: TRequest } = {}
): Promise<TResponse> {
  const { body, ...fetchOptions } = options

  try {
    // Encrypt request body if present
    if (body) {
      const encryptedPayload = await encryptRequestPayload(body)
      ;(fetchOptions as RequestInit).body = JSON.stringify(encryptedPayload)
      fetchOptions.headers = {
        'Content-Type': 'application/json',
        'X-Encrypted': 'true',
        ...fetchOptions.headers
      }
    }

    // Make the request
    const response = await fetch(url, fetchOptions)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    // Check if response is encrypted
    const isEncrypted = response.headers.get('X-Encrypted') === 'true'

    if (isEncrypted) {
      const encryptedResponse = await response.json()
      return await decryptResponsePayload<TResponse>(encryptedResponse)
    } else {
      return await response.json()
    }
  } catch (error) {
    logger.error('Encrypted fetch failed', { url, error })
    throw error
  }
}

/**
 * Generate a secure random key for testing
 */
export async function generateSecureKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )

  const exported = await crypto.subtle.exportKey('raw', key)
  const keyArray = new Uint8Array(exported)

  return btoa(String.fromCharCode(...keyArray))
}

// Test function to verify encryption/decryption works
export async function testEncryption(): Promise<boolean> {
  try {
    const testData = { message: 'Hello, World!', timestamp: Date.now() }
    const encrypted = await encryptData(testData)
    const decrypted = await decryptData(encrypted)

    return JSON.stringify(testData) === JSON.stringify(decrypted)
  } catch (error) {
    logger.error('Encryption test failed', { error })
    return false
  }
}