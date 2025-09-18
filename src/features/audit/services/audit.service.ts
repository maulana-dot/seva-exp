import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit, where } from 'firebase/firestore'
import { db } from '@/libs/firebase'
import { logger } from '@/utils/logger'
import type { AuditLog, CreateAuditLogInput } from '@/entities/audit/audit.types'

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
    resourceType?: 'asset' | 'user' | 'auth'
    resourceId?: string
    limitCount?: number
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

  // Convenience methods for common audit actions
  static async logAssetCreated(userId: string, userEmail: string, assetId: string, assetTag: string) {
    await this.createLog({
      action: 'asset.created',
      userId,
      userEmail,
      resourceType: 'asset',
      resourceId: assetId,
      details: { assetTag },
    })
  }

  static async logAssetUpdated(userId: string, userEmail: string, assetId: string, assetTag: string, changes: Record<string, unknown>) {
    await this.createLog({
      action: 'asset.updated',
      userId,
      userEmail,
      resourceType: 'asset',
      resourceId: assetId,
      details: { assetTag, changes },
    })
  }

  static async logAssetDeleted(userId: string, userEmail: string, assetId: string, assetTag: string) {
    await this.createLog({
      action: 'asset.deleted',
      userId,
      userEmail,
      resourceType: 'asset',
      resourceId: assetId,
      details: { assetTag },
    })
  }

  static async logAssetStatusChanged(userId: string, userEmail: string, assetId: string, assetTag: string, oldStatus: string, newStatus: string) {
    await this.createLog({
      action: 'asset.status_changed',
      userId,
      userEmail,
      resourceType: 'asset',
      resourceId: assetId,
      details: { assetTag, oldStatus, newStatus },
    })
  }

  static async logAssetOwnerChanged(userId: string, userEmail: string, assetId: string, assetTag: string, oldOwner?: string, newOwner?: string) {
    await this.createLog({
      action: 'asset.owner_changed',
      userId,
      userEmail,
      resourceType: 'asset',
      resourceId: assetId,
      details: { assetTag, oldOwner, newOwner },
    })
  }

  static async logUserLogin(userId: string, userEmail: string) {
    await this.createLog({
      action: 'auth.login',
      userId,
      userEmail,
      resourceType: 'auth',
    })
  }

  static async logUserLogout(userId: string, userEmail: string) {
    await this.createLog({
      action: 'auth.logout',
      userId,
      userEmail,
      resourceType: 'auth',
    })
  }

  static async logUserUpdated(userId: string, userEmail: string, targetUserId: string, targetUserEmail: string, changes: Record<string, unknown>) {
    await this.createLog({
      action: 'user.updated',
      userId,
      userEmail,
      resourceType: 'user',
      resourceId: targetUserId,
      details: { targetUserEmail, changes },
    })
  }
}