# Encryption Implementation for Seva

This document explains the encryption system implemented for secure frontend-backend communication.

## Overview

The encryption system provides AES-256-GCM encryption for protecting sensitive data in transit between the frontend and backend. It includes:

- **encryption.ts**: Core encryption/decryption utilities using Web Crypto API
- **secure-api-client.ts**: HTTP client with automatic encryption/decryption
- **Secure key derivation**: PBKDF2 with SHA-256 for key generation

## Features

### 1. Strong Encryption
- **Algorithm**: AES-256-GCM (Authenticated encryption)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **IV Generation**: Cryptographically secure random IVs for each encryption
- **Timestamp Protection**: Prevents replay attacks with timestamp validation

### 2. Easy Integration
- Drop-in replacement for fetch API
- Automatic encryption/decryption
- Fallback to unencrypted communication if needed
- TypeScript support with full type safety

### 3. Security Features
- **Authenticated Encryption**: Prevents tampering with encrypted data
- **Replay Protection**: Timestamp-based freshness validation
- **Key Caching**: Secure key derivation with memory caching
- **Error Handling**: Secure error handling without data leakage

## Usage Examples

### Basic Encryption/Decryption

```typescript
import { encryptData, decryptData } from '@/utils/encryption'

// Encrypt any data
const data = { userId: '123', email: 'user@example.com' }
const encrypted = await encryptData(data)

// Decrypt the data
const decrypted = await decryptData(encrypted)
console.log(decrypted) // { userId: '123', email: 'user@example.com' }
```

### Using the Secure API Client

```typescript
import { secureApiClient } from '@/utils/secure-api-client'

// Configure the client
secureApiClient.setDefaultHeaders({
  'X-API-Version': '1.0',
  'X-Client': 'Seva-Web'
})

// Make encrypted requests
const response = await secureApiClient.post('/api/users', {
  name: 'John Doe',
  email: 'john@example.com'
}, { encrypted: true })

// The request body is automatically encrypted
// The response is automatically decrypted
console.log(response.data)
```

### Custom Service Integration

```typescript
// Example: Secure User Service
export class SecureUserService {
  private apiClient = new SecureApiClient('/api')

  async createUser(userData: CreateUserInput): Promise<User> {
    const response = await this.apiClient.post<User>('/users', userData, {
      encrypted: true,
      timeout: 10000
    })
    return response.data
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const response = await this.apiClient.put<User>(`/users/${id}`, updates, {
      encrypted: true
    })
    return response.data
  }

  // Public data doesn't need encryption
  async getPublicProfile(id: string): Promise<PublicProfile> {
    const response = await this.apiClient.get<PublicProfile>(`/users/${id}/public`, {
      encrypted: false
    })
    return response.data
  }
}
```

## Integration with Firebase

Since Seva currently uses Firebase directly, the encryption system is prepared for future API integrations:

```typescript
// Example: Mixed Firebase + Custom API
export class HybridFormService {
  // Firebase operations (direct)
  async saveFormToFirebase(form: FormData): Promise<string> {
    return FormService.createForm(form, userId, userEmail)
  }

  // Custom API operations (encrypted)
  async processFormWithAI(formId: string, formData: unknown): Promise<AIProcessingResult> {
    const response = await secureApiClient.post('/api/ai/process-form', {
      formId,
      formData
    }, { encrypted: true })

    return response.data
  }

  // External webhook (encrypted)
  async sendToWebhook(webhookUrl: string, payload: unknown): Promise<void> {
    const customClient = new SecureApiClient()
    await customClient.post(webhookUrl, payload, { encrypted: true })
  }
}
```

## Backend Implementation Notes

For a backend to work with this encryption system, it needs to:

### 1. Support Encrypted Requests

```javascript
// Express.js middleware example
app.use('/api', async (req, res, next) => {
  if (req.headers['x-encrypted'] === 'true') {
    try {
      // Decrypt the request body
      const decrypted = await decryptData(req.body.encrypted)
      req.body = decrypted.data
      req.timestamp = decrypted.timestamp
    } catch (error) {
      return res.status(400).json({ error: 'Invalid encrypted payload' })
    }
  }
  next()
})
```

### 2. Send Encrypted Responses

```javascript
// Response encryption middleware
app.use('/api', (req, res, next) => {
  const originalSend = res.send
  res.send = async function(data) {
    if (req.headers['x-encrypted'] === 'true') {
      const encrypted = await encryptRequestPayload(data)
      res.setHeader('X-Encrypted', 'true')
      return originalSend.call(this, encrypted)
    }
    return originalSend.call(this, data)
  }
  next()
})
```

## Security Considerations

### Production Configuration

1. **Environment Variables**: Store encryption keys in environment variables
2. **Key Rotation**: Implement periodic key rotation
3. **HTTPS Only**: Always use HTTPS in production
4. **CSP Headers**: Configure Content Security Policy appropriately

### Key Management

```typescript
// Production configuration example
const ENCRYPTION_CONFIG = {
  password: process.env.ENCRYPTION_PASSWORD || 'fallback-key',
  salt: process.env.ENCRYPTION_SALT ?
    new Uint8Array(Buffer.from(process.env.ENCRYPTION_SALT, 'base64')) :
    generateRandomSalt(),
  iterations: parseInt(process.env.PBKDF2_ITERATIONS || '100000')
}
```

## Testing

```typescript
import { testEncryption } from '@/utils/encryption'

// Verify encryption works
const isWorking = await testEncryption()
console.log('Encryption test:', isWorking ? 'PASSED' : 'FAILED')
```

## Performance Considerations

- **Key Caching**: Keys are derived once and cached in memory
- **Selective Encryption**: Only encrypt sensitive endpoints
- **Payload Size**: Encryption adds ~30% overhead to payload size
- **CPU Usage**: AES-GCM is hardware-accelerated on modern browsers

## Browser Compatibility

- **Modern Browsers**: Full support (Chrome 37+, Firefox 34+, Safari 7+)
- **Web Crypto API**: Required for all encryption operations
- **Fallback**: Graceful degradation to unencrypted communication

## Future Enhancements

1. **Key Exchange**: Implement Diffie-Hellman key exchange
2. **Certificate Pinning**: Add certificate validation
3. **Rate Limiting**: Add request rate limiting
4. **Audit Logging**: Log all encryption/decryption events
5. **Multi-Key Support**: Support for multiple encryption keys

This encryption system provides a solid foundation for securing Seva's future API communications while maintaining ease of use and strong security practices.