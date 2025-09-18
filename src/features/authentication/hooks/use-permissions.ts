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
  const canManageUsers = checkPermission('users:read')
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
    canManageUsers,
    isAdmin,
  }
}