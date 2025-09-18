import type { AssetId } from '@/entities/asset/asset.types'
import type { UserId } from '@/entities/user/user.types'

export type AuditAction =
  | 'asset.created'
  | 'asset.updated'
  | 'asset.deleted'
  | 'asset.status_changed'
  | 'asset.owner_changed'
  | 'user.created'
  | 'user.updated'
  | 'user.role_changed'
  | 'auth.login'
  | 'auth.logout'
  | 'auth.failed_login'

export interface AuditLog {
  id: string
  action: AuditAction
  userId: UserId
  userEmail: string
  resourceType: 'asset' | 'user' | 'auth'
  resourceId?: AssetId | UserId
  details: Record<string, unknown>
  metadata: {
    userAgent?: string
    ipAddress?: string
    timestamp: Date
  }
  createdAt: Date
}

export interface CreateAuditLogInput {
  action: AuditAction
  userId: UserId
  userEmail: string
  resourceType: 'asset' | 'user' | 'auth'
  resourceId?: AssetId | UserId
  details?: Record<string, unknown>
  metadata?: {
    userAgent?: string
    ipAddress?: string
  }
}