import { encryptRequestPayload, decryptResponsePayload, isEncryptionSupported } from './encryption'
import { logger } from './logger'

export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: unknown
  timeout?: number
  encrypted?: boolean // Whether to encrypt this request
}

export interface ApiResponse<T = unknown> {
  data: T
  status: number
  statusText: string
  headers: Headers
}

export class SecureApiClient {
  private baseUrl: string
  private defaultHeaders: Record<string, string>
  private encryptionEnabled: boolean

  constructor(baseUrl: string = '', defaultHeaders: Record<string, string> = {}) {
    this.baseUrl = baseUrl
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders
    }
    this.encryptionEnabled = isEncryptionSupported()

    if (!this.encryptionEnabled) {
      logger.warn('Encryption not supported in this environment')
    }
  }

  /**
   * Make a secure API request with optional encryption
   */
  async request<TResponse = unknown>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<ApiResponse<TResponse>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = 30000,
      encrypted = true // Default to encrypted
    } = config

    const url = `${this.baseUrl}${endpoint}`
    const requestHeaders = { ...this.defaultHeaders, ...headers }

    try {
      // Prepare request body
      let requestBody: string | undefined
      if (body && method !== 'GET') {
        if (encrypted && this.encryptionEnabled) {
          // Encrypt the payload
          const encryptedPayload = await encryptRequestPayload(body)
          requestBody = JSON.stringify(encryptedPayload)
          requestHeaders['X-Encrypted'] = 'true'
          logger.debug('Request payload encrypted', { endpoint, method })
        } else {
          requestBody = JSON.stringify(body)
          logger.debug('Request payload sent unencrypted', { endpoint, method, reason: encrypted ? 'encryption not supported' : 'encryption disabled' })
        }
      }

      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      // Make the request
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: requestBody,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      // Handle response
      let responseData: TResponse

      if (response.headers.get('Content-Type')?.includes('application/json')) {
        const jsonResponse = await response.json()

        // Check if response is encrypted
        const isResponseEncrypted = response.headers.get('X-Encrypted') === 'true'

        if (isResponseEncrypted && this.encryptionEnabled) {
          responseData = await decryptResponsePayload<TResponse>(jsonResponse)
          logger.debug('Response payload decrypted', { endpoint, method })
        } else {
          responseData = jsonResponse
          logger.debug('Response payload received unencrypted', { endpoint, method })
        }
      } else {
        // Non-JSON response
        responseData = (await response.text()) as unknown as TResponse
      }

      return {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        logger.error('Request timeout', { endpoint, method, timeout })
        throw new Error(`Request timeout after ${timeout}ms`)
      }

      logger.error('API request failed', { endpoint, method, error })
      throw error
    }
  }

  /**
   * Convenience methods for common HTTP verbs
   */
  async get<TResponse = unknown>(
    endpoint: string,
    config: Omit<ApiRequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(endpoint, { ...config, method: 'GET' })
  }

  async post<TResponse = unknown>(
    endpoint: string,
    body?: unknown,
    config: Omit<ApiRequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(endpoint, { ...config, method: 'POST', body })
  }

  async put<TResponse = unknown>(
    endpoint: string,
    body?: unknown,
    config: Omit<ApiRequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(endpoint, { ...config, method: 'PUT', body })
  }

  async patch<TResponse = unknown>(
    endpoint: string,
    body?: unknown,
    config: Omit<ApiRequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(endpoint, { ...config, method: 'PATCH', body })
  }

  async delete<TResponse = unknown>(
    endpoint: string,
    config: Omit<ApiRequestConfig, 'method' | 'body'> = {}
  ): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(endpoint, { ...config, method: 'DELETE' })
  }

  /**
   * Enable or disable encryption for all requests
   */
  setEncryptionEnabled(enabled: boolean): void {
    if (enabled && !isEncryptionSupported()) {
      logger.warn('Cannot enable encryption: not supported in this environment')
      return
    }
    this.encryptionEnabled = enabled
    logger.info('Encryption setting changed', { enabled })
  }

  /**
   * Get current encryption status
   */
  isEncryptionEnabled(): boolean {
    return this.encryptionEnabled
  }

  /**
   * Update default headers
   */
  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers }
  }

  /**
   * Set authorization header
   */
  setAuthToken(token: string): void {
    this.setDefaultHeaders({ 'Authorization': `Bearer ${token}` })
  }

  /**
   * Clear authorization header
   */
  clearAuthToken(): void {
    const { Authorization, ...otherHeaders } = this.defaultHeaders
    this.defaultHeaders = otherHeaders
  }
}

// Create a default instance
export const secureApiClient = new SecureApiClient()

// Export utility functions for manual encryption/decryption
export { encryptRequestPayload, decryptResponsePayload } from './encryption'