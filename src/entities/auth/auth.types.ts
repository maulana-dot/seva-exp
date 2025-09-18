import type { User } from '@/entities/user/user.types'

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials extends LoginCredentials {
  displayName?: string
}

export interface AuthUser extends User {
  firebaseUid: string
}

export interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
}

export interface PasswordResetRequest {
  email: string
}