import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { deleteUser as deleteAuthUser } from 'firebase/auth'
import { db } from '@/libs/firebase'
import { logger } from '@/utils/logger'
import { AuditService } from '@/features/audit/services/audit.service'
import type { AuthUser } from '@/entities/auth/auth.types'
import type { UserId, UserRole } from '@/entities/user/user.types'

const USERS_COLLECTION = 'users'

export interface UserManagementUser extends AuthUser {
  lastLoginAt?: Date
  assetsCount?: number
}

export interface UpdateUserInput {
  id: UserId
  displayName?: string
  role?: UserRole
  department?: string
  isActive?: boolean
}

export class UserManagementService {
  static async getUsers(): Promise<UserManagementUser[]> {
    try {
      logger.info('Fetching all users for management')

      const usersQuery = query(
        collection(db, USERS_COLLECTION),
        orderBy('createdAt', 'desc')
      )
      const querySnapshot = await getDocs(usersQuery)

      const users: UserManagementUser[] = []

      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data()
        const user: UserManagementUser = {
          id: docSnap.id as UserId,
          firebaseUid: data.firebaseUid,
          email: data.email,
          displayName: data.displayName,
          role: data.role || 'user',
          department: data.department,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          isActive: data.isActive ?? true,
          lastLoginAt: data.lastLoginAt?.toDate(),
        }

        // Get assets count for this user
        try {
          const assetsQuery = query(
            collection(db, 'assets'),
            where('createdBy', '==', user.id)
          )
          const assetsSnapshot = await getDocs(assetsQuery)
          user.assetsCount = assetsSnapshot.size
        } catch (error) {
          logger.warn('Failed to get assets count for user', { userId: user.id, error })
          user.assetsCount = 0
        }

        users.push(user)
      }

      logger.info('Users fetched successfully for management', { count: users.length })
      return users
    } catch (error) {
      logger.error('Failed to fetch users for management', { error })
      throw error
    }
  }

  static async getUser(userId: UserId): Promise<UserManagementUser | null> {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId))

      if (!userDoc.exists()) {
        return null
      }

      const data = userDoc.data()
      const user: UserManagementUser = {
        id: userDoc.id as UserId,
        firebaseUid: data.firebaseUid,
        email: data.email,
        displayName: data.displayName,
        role: data.role || 'user',
        department: data.department,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        isActive: data.isActive ?? true,
        lastLoginAt: data.lastLoginAt?.toDate(),
      }

      // Get assets count for this user
      try {
        const assetsQuery = query(
          collection(db, 'assets'),
          where('createdBy', '==', user.id)
        )
        const assetsSnapshot = await getDocs(assetsQuery)
        user.assetsCount = assetsSnapshot.size
      } catch (error) {
        logger.warn('Failed to get assets count for user', { userId: user.id, error })
        user.assetsCount = 0
      }

      return user
    } catch (error) {
      logger.error('Failed to get user', { userId, error })
      throw error
    }
  }

  static async updateUser(
    input: UpdateUserInput,
    updatedBy: UserId,
    updatedByEmail: string
  ): Promise<void> {
    try {
      logger.info('Updating user', { userId: input.id, updatedBy })

      const userRef = doc(db, USERS_COLLECTION, input.id)
      const { id, ...updateData } = input

      // Get original user data for audit logging
      const originalUser = await getDoc(userRef)
      const originalData = originalUser.data()

      const updatePayload = {
        ...updateData,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(userRef, updatePayload)
      logger.info('User updated successfully', { userId: input.id })

      // Log audit trail with changes
      const changes = Object.keys(updatePayload).reduce((acc, key) => {
        if (key !== 'updatedAt' && originalData && originalData[key] !== updatePayload[key]) {
          acc[key] = { from: originalData[key], to: updatePayload[key] }
        }
        return acc
      }, {} as Record<string, unknown>)

      if (Object.keys(changes).length > 0) {
        await AuditService.logUserUpdated(
          updatedBy,
          updatedByEmail,
          input.id,
          originalData?.email || 'unknown',
          changes
        )

        // Log specific role changes
        if (originalData && input.role && originalData.role !== input.role) {
          await AuditService.createLog({
            action: 'user.role.changed',
            userId: updatedBy,
            userEmail: updatedByEmail,
            resourceType: 'user',
            resourceId: input.id,
            details: {
              userEmail: originalData.email,
              fromRole: originalData.role,
              toRole: input.role,
            },
            ipAddress: undefined,
            userAgent: undefined,
          })
        }

        // Log account activation/deactivation
        if (originalData && input.isActive !== undefined && originalData.isActive !== input.isActive) {
          await AuditService.createLog({
            action: input.isActive ? 'user.activated' : 'user.deactivated',
            userId: updatedBy,
            userEmail: updatedByEmail,
            resourceType: 'user',
            resourceId: input.id,
            details: {
              userEmail: originalData.email,
            },
            ipAddress: undefined,
            userAgent: undefined,
          })
        }
      }
    } catch (error) {
      logger.error('Failed to update user', { userId: input.id, error })
      throw error
    }
  }

  static async deactivateUser(
    userId: UserId,
    deactivatedBy: UserId,
    deactivatedByEmail: string
  ): Promise<void> {
    try {
      logger.info('Deactivating user', { userId, deactivatedBy })

      const userRef = doc(db, USERS_COLLECTION, userId)
      const userDoc = await getDoc(userRef)
      const userData = userDoc.data()

      await updateDoc(userRef, {
        isActive: false,
        updatedAt: serverTimestamp(),
      })

      logger.info('User deactivated successfully', { userId })

      // Log audit trail
      if (userData) {
        await AuditService.createLog({
          action: 'user.deactivated',
          userId: deactivatedBy,
          userEmail: deactivatedByEmail,
          resourceType: 'user',
          resourceId: userId,
          details: {
            userEmail: userData.email,
          },
          ipAddress: undefined,
          userAgent: undefined,
        })
      }
    } catch (error) {
      logger.error('Failed to deactivate user', { userId, error })
      throw error
    }
  }

  static async activateUser(
    userId: UserId,
    activatedBy: UserId,
    activatedByEmail: string
  ): Promise<void> {
    try {
      logger.info('Activating user', { userId, activatedBy })

      const userRef = doc(db, USERS_COLLECTION, userId)
      const userDoc = await getDoc(userRef)
      const userData = userDoc.data()

      await updateDoc(userRef, {
        isActive: true,
        updatedAt: serverTimestamp(),
      })

      logger.info('User activated successfully', { userId })

      // Log audit trail
      if (userData) {
        await AuditService.createLog({
          action: 'user.activated',
          userId: activatedBy,
          userEmail: activatedByEmail,
          resourceType: 'user',
          resourceId: userId,
          details: {
            userEmail: userData.email,
          },
          ipAddress: undefined,
          userAgent: undefined,
        })
      }
    } catch (error) {
      logger.error('Failed to activate user', { userId, error })
      throw error
    }
  }

  static async deleteUser(
    userId: UserId,
    deletedBy: UserId,
    deletedByEmail: string
  ): Promise<void> {
    try {
      logger.info('Deleting user', { userId, deletedBy })

      // Get user data for audit logging before deletion
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId))
      const userData = userDoc.data()

      // Check if user has any assets
      const assetsQuery = query(
        collection(db, 'assets'),
        where('createdBy', '==', userId)
      )
      const assetsSnapshot = await getDocs(assetsQuery)

      if (assetsSnapshot.size > 0) {
        throw new Error(
          `Cannot delete user ${userData?.email || userId}. User has ${assetsSnapshot.size} assets assigned. Please reassign or delete these assets first.`
        )
      }

      // Delete from Firestore
      await deleteDoc(doc(db, USERS_COLLECTION, userId))

      // Note: We don't delete the Firebase Auth user as that requires admin SDK
      // In a production app, this would typically be handled by a cloud function
      logger.warn('User document deleted from Firestore, but Firebase Auth user remains', { userId })

      logger.info('User deleted successfully', { userId })

      // Log audit trail
      if (userData) {
        await AuditService.createLog({
          action: 'user.deleted',
          userId: deletedBy,
          userEmail: deletedByEmail,
          resourceType: 'user',
          resourceId: userId,
          details: {
            userEmail: userData.email,
            userRole: userData.role,
          },
          ipAddress: undefined,
          userAgent: undefined,
        })
      }
    } catch (error) {
      logger.error('Failed to delete user', { userId, error })
      throw error
    }
  }
}