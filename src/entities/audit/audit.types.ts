import type { UserId } from '@/entities/user/user.types'

export type AuditAction =
  // Authentication actions
  | 'auth.login'
  | 'auth.logout'
  | 'auth.failed_login'
  | 'auth.register'
  | 'auth.password_reset_requested'
  | 'auth.password_reset_completed'
  | 'auth.session_expired'

  // User management actions
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.role_changed'
  | 'user.activated'
  | 'user.deactivated'
  | 'user.profile_viewed'
  | 'user.permissions_changed'

  // Form actions
  | 'form.created'
  | 'form.updated'
  | 'form.deleted'
  | 'form.published'
  | 'form.unpublished'
  | 'form.viewed'
  | 'form.submitted'
  | 'form.submission_viewed'
  | 'form.submission_updated'
  | 'form.submission_deleted'
  | 'form.exported'

  // Navigation actions
  | 'navigation.page_visited'
  | 'navigation.dashboard_accessed'
  | 'navigation.admin_panel_accessed'

  // System actions
  | 'system.data_exported'
  | 'system.data_imported'
  | 'system.settings_changed'
  | 'system.maintenance_performed'
  | 'system.backup_created'
  | 'system.backup_restored'

  // Security actions
  | 'security.unauthorized_access_attempt'
  | 'security.suspicious_activity_detected'
  | 'security.account_locked'
  | 'security.account_unlocked'
  | 'security.two_factor_enabled'
  | 'security.two_factor_disabled'

export interface AuditLog {
  id: string
  action: AuditAction
  userId: UserId
  userEmail: string
  resourceType: 'form' | 'user' | 'auth' | 'navigation' | 'system' | 'security'
  resourceId?: string
  details: Record<string, unknown>
  metadata: {
    userAgent?: string
    ipAddress?: string
    sessionId?: string
    location?: string
    deviceType?: string
    timestamp: Date
  }
  createdAt: Date
}

export interface CreateAuditLogInput {
  action: AuditAction
  userId: UserId
  userEmail: string
  resourceType: 'form' | 'user' | 'auth' | 'navigation' | 'system' | 'security'
  resourceId?: string
  details?: Record<string, unknown>
  metadata?: {
    userAgent?: string
    ipAddress?: string
    sessionId?: string
    location?: string
    deviceType?: string
  }
}