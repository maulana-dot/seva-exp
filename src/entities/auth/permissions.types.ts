import type { UserRole } from '@/entities/user/user.types'

export type Permission =
  | 'assets:create'
  | 'assets:read'
  | 'assets:update'
  | 'assets:delete'
  | 'assets:read:all'
  | 'assets:update:all'
  | 'assets:delete:all'
  | 'users:create'
  | 'users:read'
  | 'users:update'
  | 'users:delete'
  | 'forms:create'
  | 'forms:read'
  | 'forms:update'
  | 'forms:delete'
  | 'forms:read:all'
  | 'forms:update:all'
  | 'forms:delete:all'
  | 'admin:access'

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'assets:create',
    'assets:read',
    'assets:update',
    'assets:delete',
    'assets:read:all',
    'assets:update:all',
    'assets:delete:all',
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'forms:create',
    'forms:read',
    'forms:update',
    'forms:delete',
    'forms:read:all',
    'forms:update:all',
    'forms:delete:all',
    'admin:access',
  ],
  manager: [
    'assets:create',
    'assets:read',
    'assets:update',
    'assets:delete',
    'assets:read:all',
    'assets:update:all',
    'users:read',
    'forms:create',
    'forms:read',
    'forms:update',
    'forms:delete',
  ],
  user: [
    'assets:create',
    'assets:read',
    'assets:update',
    'forms:create',
    'forms:read',
    'forms:update',
    'forms:delete',
  ],
}

export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole].includes(permission)
}

export function canAccessAsset(userRole: UserRole, assetOwnerId: string, currentUserId: string): boolean {
  if (userRole === 'admin' || userRole === 'manager') {
    return true
  }

  return assetOwnerId === currentUserId
}