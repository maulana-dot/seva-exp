import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AuthService } from '../services/auth.service'
import { AuditService } from '@/features/audit/services/audit.service'
import { LoginCredentials, RegisterCredentials, PasswordResetRequest } from '@/entities/auth/auth.types'
import { UserRole } from '@/entities/user/user.types'
import { useAuth as useAuthContext } from '../contexts/auth-context'

export function useAuth() {
  return useAuthContext()
}

export function useLogin() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => AuthService.login(credentials),
    onSuccess: async (result) => {
      toast.success('Login successful')

      // Log successful login
      await AuditService.logUserLogin(result.user.uid, result.user.email || 'unknown')

      navigate('/')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Login failed')
    },
  })
}

export function useRegister() {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: ({ credentials, role = 'user' }: { credentials: RegisterCredentials; role?: UserRole }) =>
      AuthService.register(credentials, role),
    onSuccess: () => {
      toast.success('Registration successful')
      navigate('/')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Registration failed')
    },
  })
}

export function usePasswordReset() {
  return useMutation({
    mutationFn: (request: PasswordResetRequest) => AuthService.resetPassword(request),
    onSuccess: () => {
      toast.success('Password reset email sent')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send password reset email')
    },
  })
}