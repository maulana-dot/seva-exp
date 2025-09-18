import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/libs/firebase'
import { LoginCredentials, RegisterCredentials, PasswordResetRequest } from '@/entities/auth/auth.types'
import { UserRole } from '@/entities/user/user.types'
import { logger } from '@/utils/logger'

export class AuthService {
  static async login(credentials: LoginCredentials) {
    try {
      logger.info('Attempting user login', { email: credentials.email })
      const result = await signInWithEmailAndPassword(auth, credentials.email, credentials.password)
      logger.info('Login successful', { userId: result.user.uid })
      return result
    } catch (error) {
      logger.error('Login failed', { email: credentials.email, error })
      throw error
    }
  }

  static async register(credentials: RegisterCredentials, role: UserRole = 'user') {
    try {
      logger.info('Attempting user registration', { email: credentials.email })

      // Create Firebase user
      const result = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      )

      // Update profile if displayName provided
      if (credentials.displayName) {
        await updateProfile(result.user, {
          displayName: credentials.displayName,
        })
      }

      // Create user document in Firestore
      await setDoc(doc(db, 'users', result.user.uid), {
        email: credentials.email,
        displayName: credentials.displayName || null,
        role,
        department: null,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      logger.info('Registration successful', { userId: result.user.uid, role })
      return result
    } catch (error) {
      logger.error('Registration failed', { email: credentials.email, error })
      throw error
    }
  }

  static async resetPassword(request: PasswordResetRequest) {
    try {
      logger.info('Sending password reset email', { email: request.email })
      await sendPasswordResetEmail(auth, request.email)
      logger.info('Password reset email sent', { email: request.email })
    } catch (error) {
      logger.error('Password reset failed', { email: request.email, error })
      throw error
    }
  }
}