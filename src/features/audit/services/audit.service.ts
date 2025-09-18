import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit, where } from 'firebase/firestore'
import { db } from '@/libs/firebase'
import { logger } from '@/utils/logger'
import type { AuditLog, CreateAuditLogInput } from '@/entities/audit/audit.types'
import type { UserId } from '@/entities/user/user.types'

const AUDIT_LOGS_COLLECTION = 'audit_logs'

export class AuditService {
  static async createLog(input: CreateAuditLogInput): Promise<void> {
    try {
      const auditData = {
        action: input.action,
        userId: input.userId,
        userEmail: input.userEmail,
        resourceType: input.resourceType,
        resourceId: input.resourceId || null,
        details: input.details || {},
        metadata: {
          userAgent: input.metadata?.userAgent || navigator.userAgent,
          ipAddress: input.metadata?.ipAddress || 'unknown',
          timestamp: serverTimestamp(),
        },
        createdAt: serverTimestamp(),
      }

      await addDoc(collection(db, AUDIT_LOGS_COLLECTION), auditData)

      logger.info('Audit log created', {
        action: input.action,
        userId: input.userId,
        resourceType: input.resourceType
      })
    } catch (error) {
      logger.error('Failed to create audit log', { input, error })
      // Don't throw error - audit logging failure shouldn't break the main operation
    }
  }

  static async getAuditLogs(options?: {
    userId?: string
    resourceType?: 'form' | 'user' | 'auth' | 'navigation' | 'system' | 'security'
    resourceId?: string
    limitCount?: number
    startDate?: Date
    endDate?: Date
    action?: string
  }): Promise<AuditLog[]> {
    try {
      const constraints = []

      if (options?.userId) {
        constraints.push(where('userId', '==', options.userId))
      }

      if (options?.resourceType) {
        constraints.push(where('resourceType', '==', options.resourceType))
      }

      if (options?.resourceId) {
        constraints.push(where('resourceId', '==', options.resourceId))
      }

      if (options?.action) {
        constraints.push(where('action', '==', options.action))
      }

      if (options?.startDate) {
        constraints.push(where('createdAt', '>=', options.startDate))
      }

      if (options?.endDate) {
        constraints.push(where('createdAt', '<=', options.endDate))
      }

      constraints.push(orderBy('createdAt', 'desc'))

      if (options?.limitCount) {
        constraints.push(limit(options.limitCount))
      }

      const auditQuery = query(collection(db, AUDIT_LOGS_COLLECTION), ...constraints)
      const querySnapshot = await getDocs(auditQuery)

      const logs: AuditLog[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        logs.push({
          id: doc.id,
          ...data,
          metadata: {
            ...data.metadata,
            timestamp: data.metadata?.timestamp?.toDate() || new Date(),
          },
          createdAt: data.createdAt?.toDate() || new Date(),
        } as AuditLog)
      })

      return logs
    } catch (error) {
      logger.error('Failed to get audit logs', { options, error })
      throw error
    }
  }

  // Enhanced device detection
  private static getDeviceType(userAgent: string): string {
    const ua = userAgent.toLowerCase()
    if (ua.includes('mobile')) return 'mobile'
    if (ua.includes('tablet')) return 'tablet'
    return 'desktop'
  }

  // Get session ID from localStorage or generate one
  private static getSessionId(): string {
    let sessionId = localStorage.getItem('audit_session_id')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('audit_session_id', sessionId)
    }
    return sessionId
  }

  // Enhanced createLog with automatic metadata enrichment
  static async createEnhancedLog(input: CreateAuditLogInput): Promise<void> {
    const enhancedInput: CreateAuditLogInput = {
      ...input,
      metadata: {
        userAgent: navigator.userAgent,
        sessionId: this.getSessionId(),
        deviceType: this.getDeviceType(navigator.userAgent),
        location: window.location.pathname,
        ...input.metadata,
      }
    }
    await this.createLog(enhancedInput)
  }

  // Authentication audit methods
  static async logAuthRegister(userId: string, userEmail: string, method: 'email' | 'google' | 'other' = 'email') {
    await this.createEnhancedLog({
      action: 'auth.register',
      userId: userId as UserId,
      userEmail,
      resourceType: 'auth',
      details: { method, timestamp: new Date().toISOString() },
    })
  }

  static async logUserLogin(userId: string, userEmail: string, loginMethod?: string) {
    await this.createEnhancedLog({
      action: 'auth.login',
      userId: userId as UserId,
      userEmail,
      resourceType: 'auth',
      details: { loginMethod, timestamp: new Date().toISOString() },
    })
  }

  static async logUserLogout(userId: string, userEmail: string) {
    await this.createEnhancedLog({
      action: 'auth.logout',
      userId: userId as UserId,
      userEmail,
      resourceType: 'auth',
      details: { timestamp: new Date().toISOString() },
    })
  }

  static async logFailedLogin(email: string, reason: string) {
    await this.createEnhancedLog({
      action: 'auth.failed_login',
      userId: 'anonymous' as UserId,
      userEmail: email,
      resourceType: 'auth',
      details: { reason, timestamp: new Date().toISOString() },
    })
  }

  // User management audit methods
  static async logUserCreated(adminUserId: string, adminEmail: string, newUserId: string, newUserEmail: string, role: string) {
    await this.createEnhancedLog({
      action: 'user.created',
      userId: adminUserId as UserId,
      userEmail: adminEmail,
      resourceType: 'user',
      resourceId: newUserId,
      details: { newUserEmail, role, timestamp: new Date().toISOString() },
    })
  }

  static async logUserUpdated(userId: string, userEmail: string, targetUserId: string, targetUserEmail: string, changes: Record<string, unknown>) {
    await this.createEnhancedLog({
      action: 'user.updated',
      userId: userId as UserId,
      userEmail,
      resourceType: 'user',
      resourceId: targetUserId,
      details: { targetUserEmail, changes, timestamp: new Date().toISOString() },
    })
  }

  static async logUserDeleted(adminUserId: string, adminEmail: string, deletedUserId: string, deletedUserEmail: string) {
    await this.createEnhancedLog({
      action: 'user.deleted',
      userId: adminUserId as UserId,
      userEmail: adminEmail,
      resourceType: 'user',
      resourceId: deletedUserId,
      details: { deletedUserEmail, timestamp: new Date().toISOString() },
    })
  }

  static async logRoleChanged(adminUserId: string, adminEmail: string, targetUserId: string, targetUserEmail: string, oldRole: string, newRole: string) {
    await this.createEnhancedLog({
      action: 'user.role_changed',
      userId: adminUserId as UserId,
      userEmail: adminEmail,
      resourceType: 'user',
      resourceId: targetUserId,
      details: { targetUserEmail, oldRole, newRole, timestamp: new Date().toISOString() },
    })
  }

  static async logProfileViewed(viewerUserId: string, viewerEmail: string, viewedUserId: string, viewedUserEmail: string) {
    await this.createEnhancedLog({
      action: 'user.profile_viewed',
      userId: viewerUserId as UserId,
      userEmail: viewerEmail,
      resourceType: 'user',
      resourceId: viewedUserId,
      details: { viewedUserEmail, timestamp: new Date().toISOString() },
    })
  }

  // Form audit methods
  static async logFormCreated(userId: string, userEmail: string, formId: string, formTitle: string) {
    await this.createEnhancedLog({
      action: 'form.created',
      userId: userId as UserId,
      userEmail,
      resourceType: 'form',
      resourceId: formId,
      details: { formTitle, timestamp: new Date().toISOString() },
    })
  }

  static async logFormUpdated(userId: string, userEmail: string, formId: string, formTitle: string, changes: Record<string, unknown>) {
    await this.createEnhancedLog({
      action: 'form.updated',
      userId: userId as UserId,
      userEmail,
      resourceType: 'form',
      resourceId: formId,
      details: { formTitle, changes, timestamp: new Date().toISOString() },
    })
  }

  static async logFormDeleted(userId: string, userEmail: string, formId: string, formTitle: string) {
    await this.createEnhancedLog({
      action: 'form.deleted',
      userId: userId as UserId,
      userEmail,
      resourceType: 'form',
      resourceId: formId,
      details: { formTitle, timestamp: new Date().toISOString() },
    })
  }

  static async logFormViewed(userId: string, userEmail: string, formId: string, formTitle: string) {
    await this.createEnhancedLog({
      action: 'form.viewed',
      userId: userId as UserId,
      userEmail,
      resourceType: 'form',
      resourceId: formId,
      details: { formTitle, timestamp: new Date().toISOString() },
    })
  }

  static async logFormSubmitted(userId: string, userEmail: string, formId: string, formTitle: string, submissionId: string) {
    await this.createEnhancedLog({
      action: 'form.submitted',
      userId: userId as UserId,
      userEmail,
      resourceType: 'form',
      resourceId: formId,
      details: { formTitle, submissionId, timestamp: new Date().toISOString() },
    })
  }

  static async logFormPublished(userId: string, userEmail: string, formId: string, formTitle: string) {
    await this.createEnhancedLog({
      action: 'form.published',
      userId: userId as UserId,
      userEmail,
      resourceType: 'form',
      resourceId: formId,
      details: { formTitle, timestamp: new Date().toISOString() },
    })
  }

  // Navigation audit methods
  static async logPageVisited(userId: string, userEmail: string, pagePath: string, pageTitle?: string) {
    await this.createEnhancedLog({
      action: 'navigation.page_visited',
      userId: userId as UserId,
      userEmail,
      resourceType: 'navigation',
      details: { pagePath, pageTitle, timestamp: new Date().toISOString() },
    })
  }

  static async logDashboardAccessed(userId: string, userEmail: string) {
    await this.createEnhancedLog({
      action: 'navigation.dashboard_accessed',
      userId: userId as UserId,
      userEmail,
      resourceType: 'navigation',
      details: { timestamp: new Date().toISOString() },
    })
  }

  static async logAdminPanelAccessed(userId: string, userEmail: string, section?: string) {
    await this.createEnhancedLog({
      action: 'navigation.admin_panel_accessed',
      userId: userId as UserId,
      userEmail,
      resourceType: 'navigation',
      details: { section, timestamp: new Date().toISOString() },
    })
  }

  // System audit methods
  static async logDataExported(userId: string, userEmail: string, exportType: string, recordCount?: number) {
    await this.createEnhancedLog({
      action: 'system.data_exported',
      userId: userId as UserId,
      userEmail,
      resourceType: 'system',
      details: { exportType, recordCount, timestamp: new Date().toISOString() },
    })
  }

  static async logDataImported(userId: string, userEmail: string, importType: string, recordCount?: number) {
    await this.createEnhancedLog({
      action: 'system.data_imported',
      userId: userId as UserId,
      userEmail,
      resourceType: 'system',
      details: { importType, recordCount, timestamp: new Date().toISOString() },
    })
  }

  static async logSettingsChanged(userId: string, userEmail: string, settingKey: string, oldValue: unknown, newValue: unknown) {
    await this.createEnhancedLog({
      action: 'system.settings_changed',
      userId: userId as UserId,
      userEmail,
      resourceType: 'system',
      details: { settingKey, oldValue, newValue, timestamp: new Date().toISOString() },
    })
  }

  // Security audit methods
  static async logUnauthorizedAccess(userId: string, userEmail: string, attemptedResource: string, requiredRole?: string) {
    await this.createEnhancedLog({
      action: 'security.unauthorized_access_attempt',
      userId: userId as UserId,
      userEmail,
      resourceType: 'security',
      details: { attemptedResource, requiredRole, timestamp: new Date().toISOString() },
    })
  }

  static async logSuspiciousActivity(userId: string, userEmail: string, activityType: string, description: string) {
    await this.createEnhancedLog({
      action: 'security.suspicious_activity_detected',
      userId: userId as UserId,
      userEmail,
      resourceType: 'security',
      details: { activityType, description, timestamp: new Date().toISOString() },
    })
  }

  // Bulk audit log methods
  static async getActivitySummary(userId: string, days: number = 7): Promise<{ action: string, count: number }[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const logs = await this.getAuditLogs({
      userId,
      startDate,
      limitCount: 1000
    })

    const summary = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return Object.entries(summary)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
  }

  static async getSecurityEvents(days: number = 30): Promise<AuditLog[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return this.getAuditLogs({
      resourceType: 'security',
      startDate,
      limitCount: 100
    })
  }
}