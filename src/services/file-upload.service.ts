import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/libs/firebase'
import { logger } from '@/utils/logger'

export interface UploadResult {
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
}

export class FileUploadService {
  /**
   * Upload a file to Firebase Storage
   */
  static async uploadFile(
    file: File,
    folder: string = 'uploads',
    userId?: string
  ): Promise<UploadResult> {
    try {
      logger.info('Starting file upload', {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        folder,
        userId
      })

      // Create a unique filename
      const timestamp = Date.now()
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fullPath = userId
        ? `${folder}/${userId}/${timestamp}_${cleanFileName}`
        : `${folder}/${timestamp}_${cleanFileName}`

      // Create storage reference
      const storageRef = ref(storage, fullPath)

      // Upload file
      const snapshot = await uploadBytes(storageRef, file)

      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref)

      const result: UploadResult = {
        fileName: file.name,
        fileUrl: downloadURL,
        fileSize: file.size,
        mimeType: file.type
      }

      logger.info('File uploaded successfully', {
        fileName: file.name,
        fileUrl: downloadURL,
        fullPath
      })

      return result
    } catch (error) {
      logger.error('File upload failed', {
        fileName: file.name,
        error
      })
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete a file from Firebase Storage
   */
  static async deleteFile(fileUrl: string): Promise<void> {
    try {
      logger.info('Deleting file', { fileUrl })

      // Create reference from URL
      const storageRef = ref(storage, fileUrl)

      // Delete the file
      await deleteObject(storageRef)

      logger.info('File deleted successfully', { fileUrl })
    } catch (error) {
      logger.error('File deletion failed', { fileUrl, error })
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Validate file before upload
   */
  static validateFile(
    file: File,
    maxSizeBytes: number = 10 * 1024 * 1024, // 10MB default
    allowedTypes: string[] = ['image/*', 'application/pdf', 'text/*', '.doc', '.docx', '.xls', '.xlsx']
  ): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > maxSizeBytes) {
      return {
        isValid: false,
        error: `File size must be less than ${Math.round(maxSizeBytes / 1024 / 1024)}MB`
      }
    }

    // Check file type
    const isAllowed = allowedTypes.some(type => {
      if (type.includes('*')) {
        const baseType = type.split('/')[0]
        return file.type.startsWith(baseType)
      } else if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase())
      } else {
        return file.type === type
      }
    })

    if (!isAllowed) {
      return {
        isValid: false,
        error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
      }
    }

    return { isValid: true }
  }

  /**
   * Get file info from URL
   */
  static getFileInfoFromUrl(url: string): { fileName: string; folder: string } | null {
    try {
      const urlParts = url.split('/')
      const fileName = urlParts[urlParts.length - 1].split('?')[0] // Remove query parameters
      const folder = urlParts[urlParts.length - 2] || 'uploads'

      return { fileName, folder }
    } catch (error) {
      logger.error('Failed to parse file URL', { url, error })
      return null
    }
  }
}