import { useAuth } from './use-auth'
import { hasPermission, canAccessAsset, type Permission } from '@/entities/auth/permissions.types'

export function usePermissions() {
  const { user } = useAuth()

  const checkPermission = (permission: Permission): boolean => {
    if (!user) return false
    return hasPermission(user.role, permission)
  }

  const checkAssetAccess = (assetOwnerId: string): boolean => {
    if (!user) return false
    return canAccessAsset(user.role, assetOwnerId, user.id)
  }

  const canCreateAssets = checkPermission('assets:create')
  const canReadAssets = checkPermission('assets:read')
  const canUpdateAssets = checkPermission('assets:update')
  const canDeleteAssets = checkPermission('assets:delete')
  const canReadAllAssets = checkPermission('assets:read:all')
  const canUpdateAllAssets = checkPermission('assets:update:all')
  const canDeleteAllAssets = checkPermission('assets:delete:all')
  const canCreateUsers = checkPermission('users:create')
  const canReadUsers = checkPermission('users:read')
  const canUpdateUsers = checkPermission('users:update')
  const canDeleteUsers = checkPermission('users:delete')
  const canManageUsers = checkPermission('users:read')
  const canManageAllUsers = checkPermission('users:read') // Alias for managing all users
  const canCreateForms = checkPermission('forms:create')
  const canReadForms = checkPermission('forms:read')
  const canUpdateForms = checkPermission('forms:update')
  const canDeleteForms = checkPermission('forms:delete')
  const canReadAllForms = checkPermission('forms:read:all')
  const canUpdateAllForms = checkPermission('forms:update:all')
  const canDeleteAllForms = checkPermission('forms:delete:all')
  const canManageForms = checkPermission('forms:read')
  const canManageAllForms = checkPermission('forms:read:all')
  const isAdmin = checkPermission('admin:access')

  return {
    checkPermission,
    checkAssetAccess,
    canCreateAssets,
    canReadAssets,
    canUpdateAssets,
    canDeleteAssets,
    canReadAllAssets,
    canUpdateAllAssets,
    canDeleteAllAssets,
    canCreateUsers,
    canReadUsers,
    canUpdateUsers,
    canDeleteUsers,
    canManageUsers,
    canManageAllUsers,
    canCreateForms,
    canReadForms,
    canUpdateForms,
    canDeleteForms,
    canReadAllForms,
    canUpdateAllForms,
    canDeleteAllForms,
    canManageForms,
    canManageAllForms,
    isAdmin,
  }
}