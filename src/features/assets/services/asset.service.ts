import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  QueryConstraint,
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { db, storage } from '@/libs/firebase'
import { logger } from '@/utils/logger'
import { AuditService } from '@/features/audit/services/audit.service'
import type {
  Asset,
  AssetId,
  CreateAssetInput,
  UpdateAssetInput,
  AssetFilters,
} from '@/entities/asset/asset.types'
import type { UserId } from '@/entities/user/user.types'

const ASSETS_COLLECTION = 'assets'

export class AssetService {
  static async createAsset(input: CreateAssetInput, createdBy: UserId, userEmail: string): Promise<AssetId> {
    try {
      logger.info('Creating asset', { assetTag: input.assetTag, createdBy })

      let devicePhotoUrl: string | undefined

      // Upload device photo if provided
      if (input.devicePhoto) {
        devicePhotoUrl = await this.uploadDevicePhoto(input.devicePhoto, input.assetTag)
      }

      const assetData = {
        devicePhoto: devicePhotoUrl,
        assetTag: input.assetTag,
        status: input.status,
        manufacturer: input.manufacturer,
        model: input.model,
        assetType: input.assetType,
        color: input.color,
        serialNumber: input.serialNumber,
        purchaseDate: input.purchaseDate,
        purchasePrice: input.purchasePrice,
        orderNumber: input.orderNumber,
        currentOwner: input.currentOwner || null,
        previousOwner: null,
        dueDate: input.dueDate || null,
        conditionNotes: input.conditionNotes || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy,
      }

      const docRef = await addDoc(collection(db, ASSETS_COLLECTION), assetData)
      logger.info('Asset created successfully', { assetId: docRef.id, assetTag: input.assetTag })

      // Log audit trail
      await AuditService.logAssetCreated(createdBy, userEmail, docRef.id, input.assetTag)

      return docRef.id as AssetId
    } catch (error) {
      logger.error('Failed to create asset', { input, error })
      throw error
    }
  }

  static async updateAsset(input: UpdateAssetInput, userId: UserId, userEmail: string): Promise<void> {
    try {
      logger.info('Updating asset', { assetId: input.id })

      const assetRef = doc(db, ASSETS_COLLECTION, input.id)
      const { id, devicePhoto, ...updateData } = input

      let devicePhotoUrl: string | undefined

      // Handle device photo update
      if (devicePhoto instanceof File) {
        // If new photo provided, upload it
        devicePhotoUrl = await this.uploadDevicePhoto(devicePhoto, input.assetTag || 'unknown')
      } else if (devicePhoto === null) {
        // If explicitly set to null, remove photo
        devicePhotoUrl = null
      }
      // If devicePhoto is undefined, don't update the photo field

      const updatePayload: Record<string, unknown> = {
        ...updateData,
        updatedAt: serverTimestamp(),
      }

      if (devicePhotoUrl !== undefined) {
        updatePayload.devicePhoto = devicePhotoUrl
      }

      // Get original asset data for audit logging
      const originalAsset = await getDoc(assetRef)
      const originalData = originalAsset.data()

      await updateDoc(assetRef, updatePayload)
      logger.info('Asset updated successfully', { assetId: input.id })

      // Log audit trail with changes
      const changes = Object.keys(updatePayload).reduce((acc, key) => {
        if (key !== 'updatedAt' && originalData && originalData[key] !== updatePayload[key]) {
          acc[key] = { from: originalData[key], to: updatePayload[key] }
        }
        return acc
      }, {} as Record<string, unknown>)

      if (Object.keys(changes).length > 0) {
        await AuditService.logAssetUpdated(userId, userEmail, input.id, input.assetTag || 'unknown', changes)

        // Log specific status and owner changes
        if (originalData && input.status && originalData.status !== input.status) {
          await AuditService.logAssetStatusChanged(userId, userEmail, input.id, input.assetTag || 'unknown', originalData.status, input.status)
        }

        if (originalData && input.currentOwner !== undefined && originalData.currentOwner !== input.currentOwner) {
          await AuditService.logAssetOwnerChanged(userId, userEmail, input.id, input.assetTag || 'unknown', originalData.currentOwner, input.currentOwner)
        }
      }
    } catch (error) {
      logger.error('Failed to update asset', { assetId: input.id, error })
      throw error
    }
  }

  static async deleteAsset(assetId: AssetId, userId: UserId, userEmail: string): Promise<void> {
    try {
      logger.info('Deleting asset', { assetId })

      // Get asset data to clean up photo and for audit logging
      const assetDoc = await getDoc(doc(db, ASSETS_COLLECTION, assetId))
      const assetData = assetDoc.data()

      if (assetDoc.exists() && assetData?.devicePhoto) {
        await this.deleteDevicePhoto(assetData.devicePhoto)
      }

      await deleteDoc(doc(db, ASSETS_COLLECTION, assetId))
      logger.info('Asset deleted successfully', { assetId })

      // Log audit trail
      if (assetData) {
        await AuditService.logAssetDeleted(userId, userEmail, assetId, assetData.assetTag || 'unknown')
      }
    } catch (error) {
      logger.error('Failed to delete asset', { assetId, error })
      throw error
    }
  }

  static async getAsset(assetId: AssetId): Promise<Asset | null> {
    try {
      const assetDoc = await getDoc(doc(db, ASSETS_COLLECTION, assetId))

      if (!assetDoc.exists()) {
        return null
      }

      const data = assetDoc.data()
      return {
        id: assetDoc.id as AssetId,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        purchaseDate: data.purchaseDate?.toDate() || new Date(),
        dueDate: data.dueDate?.toDate() || null,
      } as Asset
    } catch (error) {
      logger.error('Failed to get asset', { assetId, error })
      throw error
    }
  }

  static async getAssets(filters?: AssetFilters, userId?: UserId, canReadAll = false): Promise<Asset[]> {
    try {
      logger.info('Fetching assets', { filters, userId, canReadAll })

      const constraints: QueryConstraint[] = []

      // Apply RBAC: if user can't read all assets, filter by created by user
      if (!canReadAll && userId) {
        constraints.push(where('createdBy', '==', userId))
      }

      // Apply filters
      if (filters?.status) {
        constraints.push(where('status', '==', filters.status))
      }
      if (filters?.assetType) {
        constraints.push(where('assetType', '==', filters.assetType))
      }
      if (filters?.manufacturer) {
        constraints.push(where('manufacturer', '==', filters.manufacturer))
      }
      if (filters?.currentOwner) {
        constraints.push(where('currentOwner', '==', filters.currentOwner))
      }

      // Default ordering
      constraints.push(orderBy('createdAt', 'desc'))

      const assetsQuery = query(collection(db, ASSETS_COLLECTION), ...constraints)
      const querySnapshot = await getDocs(assetsQuery)

      const assets: Asset[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data()
        assets.push({
          id: doc.id as AssetId,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          purchaseDate: data.purchaseDate?.toDate() || new Date(),
          dueDate: data.dueDate?.toDate() || null,
        } as Asset)
      })

      // Apply text search filter (client-side for simplicity)
      if (filters?.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase()
        return assets.filter(
          (asset) =>
            asset.assetTag.toLowerCase().includes(searchTerm) ||
            asset.manufacturer.toLowerCase().includes(searchTerm) ||
            asset.model.toLowerCase().includes(searchTerm) ||
            asset.serialNumber.toLowerCase().includes(searchTerm)
        )
      }

      logger.info('Assets fetched successfully', { count: assets.length })
      return assets
    } catch (error) {
      logger.error('Failed to get assets', { filters, error })
      throw error
    }
  }

  private static async uploadDevicePhoto(file: File, assetTag: string): Promise<string> {
    try {
      const fileExtension = file.name.split('.').pop()
      const fileName = `${assetTag}-${Date.now()}.${fileExtension}`
      const storageRef = ref(storage, `device-photos/${fileName}`)

      logger.info('Uploading device photo', { fileName, assetTag })

      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)

      logger.info('Device photo uploaded successfully', { downloadURL, assetTag })
      return downloadURL
    } catch (error) {
      logger.error('Failed to upload device photo', { assetTag, error })
      throw error
    }
  }

  private static async deleteDevicePhoto(photoUrl: string): Promise<void> {
    try {
      const photoRef = ref(storage, photoUrl)
      await deleteObject(photoRef)
      logger.info('Device photo deleted successfully', { photoUrl })
    } catch (error) {
      logger.warn('Failed to delete device photo', { photoUrl, error })
      // Don't throw error for photo deletion failure
    }
  }
}