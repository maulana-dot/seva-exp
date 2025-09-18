import { toast } from 'sonner'
import { logger } from './logger'

export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly isOperational: boolean

  constructor(message: string, code: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.isOperational = isOperational

    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends AppError {
  public readonly field: string

  constructor(message: string, field: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
    this.field = field
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Permission denied') {
    super(message, 'AUTHORIZATION_ERROR', 403)
    this.name = 'AuthorizationError'
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network error occurred') {
    super(message, 'NETWORK_ERROR', 503)
    this.name = 'NetworkError'
  }
}

export class FirebaseError extends AppError {
  public readonly firebaseCode: string

  constructor(firebaseError: any) {
    const message = getFirebaseErrorMessage(firebaseError.code) || firebaseError.message || 'Firebase operation failed'
    super(message, 'FIREBASE_ERROR', 500)
    this.name = 'FirebaseError'
    this.firebaseCode = firebaseError.code
  }
}

function getFirebaseErrorMessage(code: string): string {
  switch (code) {
    case 'auth/user-not-found':
      return 'No user found with this email address'
    case 'auth/wrong-password':
      return 'Invalid password'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters'
    case 'auth/invalid-email':
      return 'Invalid email address'
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later'
    case 'permission-denied':
      return 'You do not have permission to perform this action'
    case 'not-found':
      return 'The requested resource was not found'
    case 'already-exists':
      return 'A resource with this identifier already exists'
    case 'failed-precondition':
      return 'The operation was rejected due to current system state'
    case 'aborted':
      return 'The operation was aborted due to a conflict'
    case 'unavailable':
      return 'The service is currently unavailable. Please try again later'
    case 'quota-exceeded':
      return 'Quota exceeded. Please contact support'
    default:
      return ''
  }
}

export function handleError(error: unknown, context?: string): void {
  let appError: AppError

  if (error instanceof AppError) {
    appError = error
  } else if (error instanceof Error) {
    if (error.message.includes('Firebase') || error.message.includes('firestore')) {
      appError = new FirebaseError(error)
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      appError = new NetworkError(error.message)
    } else {
      appError = new AppError(error.message, 'UNKNOWN_ERROR')
    }
  } else {
    appError = new AppError('An unexpected error occurred', 'UNKNOWN_ERROR')
  }

  // Log the error
  logger.error('Error handled', {
    error: appError,
    context,
    stack: appError.stack,
  })

  // Show user-friendly toast
  if (appError.isOperational) {
    toast.error(appError.message)
  } else {
    toast.error('An unexpected error occurred. Please try again.')
  }
}

export function createAsyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) {
  return async (...args: T): Promise<R | undefined> => {
    try {
      return await fn(...args)
    } catch (error) {
      handleError(error, context)
      throw error
    }
  }
}

export function validateRequired(value: any, fieldName: string): void {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName)
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format', 'email')
  }
}

export function validateLength(value: string, min: number, max: number, fieldName: string): void {
  if (value.length < min || value.length > max) {
    throw new ValidationError(
      `${fieldName} must be between ${min} and ${max} characters`,
      fieldName
    )
  }
}

export function validatePositiveNumber(value: number, fieldName: string): void {
  if (value <= 0) {
    throw new ValidationError(`${fieldName} must be a positive number`, fieldName)
  }
}

export function validateDate(date: Date, fieldName: string): void {
  if (isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} must be a valid date`, fieldName)
  }
}

export function validateEnum<T extends string>(
  value: string,
  allowedValues: readonly T[],
  fieldName: string
): void {
  if (!allowedValues.includes(value as T)) {
    throw new ValidationError(
      `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      fieldName
    )
  }
}

export function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    let lastError: Error

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn()
        resolve(result)
        return
      } catch (error) {
        lastError = error as Error

        if (attempt === maxRetries) {
          break
        }

        // Don't retry on authentication/authorization errors
        if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
          break
        }

        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)))
      }
    }

    reject(lastError!)
  })
}