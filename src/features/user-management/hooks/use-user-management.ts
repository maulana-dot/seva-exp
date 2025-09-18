import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { UserManagementService, UpdateUserInput } from '../services/user-management.service'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import type { UserId } from '@/entities/user/user.types'

const QUERY_KEYS = {
  users: ['user-management', 'users'] as const,
  user: (id: UserId) => ['user-management', 'users', id] as const,
}

export function useUsers() {
  return useQuery({
    queryKey: QUERY_KEYS.users,
    queryFn: () => UserManagementService.getUsers(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useUser(userId: UserId) {
  return useQuery({
    queryKey: QUERY_KEYS.user(userId),
    queryFn: () => UserManagementService.getUser(userId),
    enabled: !!userId,
  })
}

export function useUpdateUser() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateUserInput) => {
      if (!user) throw new Error('User not authenticated')
      return UserManagementService.updateUser(input, user.id, user.email)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.user(variables.id) })
      toast.success('User updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user')
    },
  })
}

export function useDeactivateUser() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: UserId) => {
      if (!user) throw new Error('User not authenticated')
      return UserManagementService.deactivateUser(userId, user.id, user.email)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users })
      toast.success('User deactivated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to deactivate user')
    },
  })
}

export function useActivateUser() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: UserId) => {
      if (!user) throw new Error('User not authenticated')
      return UserManagementService.activateUser(userId, user.id, user.email)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users })
      toast.success('User activated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to activate user')
    },
  })
}

export function useDeleteUser() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: UserId) => {
      if (!user) throw new Error('User not authenticated')
      return UserManagementService.deleteUser(userId, user.id, user.email)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.users })
      toast.success('User deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete user')
    },
  })
}