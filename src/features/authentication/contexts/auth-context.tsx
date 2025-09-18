import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/libs/firebase'
import { AuditService } from '@/features/audit/services/audit.service'
import { AuthState, AuthUser } from '@/entities/auth/auth.types'
import { UserId, UserRole } from '@/entities/user/user.types'
import { logger } from '@/utils/logger'

interface AuthContextType extends AuthState {
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  })

  const logout = async (): Promise<void> => {
    try {
      const currentUser = state.user

      await signOut(auth)
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      })

      // Log logout audit trail
      if (currentUser) {
        await AuditService.logUserLogout(currentUser.id, currentUser.email)
      }

      logger.info('User logged out successfully')
    } catch (error) {
      logger.error('Logout failed', error)
      throw error
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))

          if (userDoc.exists()) {
            const userData = userDoc.data()

            const user: AuthUser = {
              id: firebaseUser.uid as UserId,
              firebaseUid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: userData.displayName || firebaseUser.displayName || undefined,
              role: userData.role || 'user',
              department: userData.department,
              createdAt: userData.createdAt?.toDate() || new Date(),
              updatedAt: userData.updatedAt?.toDate() || new Date(),
              isActive: userData.isActive ?? true,
            }

            setState({
              user,
              isLoading: false,
              isAuthenticated: true,
            })

            logger.info('User authenticated', { userId: user.id, role: user.role })
          } else {
            // User document doesn't exist, create a basic one automatically
            logger.warn('User document not found, creating basic user document')

            try {
              const isAdmin = firebaseUser.email === 'admin@admin.com'
              const userRole: UserRole = isAdmin ? 'admin' : 'user'
              const basicUserData = {
                firebaseUid: firebaseUser.uid,
                email: firebaseUser.email!,
                displayName: firebaseUser.displayName || 'User',
                role: userRole,
                department: isAdmin ? 'Administration' : null,
                isActive: true,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              }

              await setDoc(doc(db, 'users', firebaseUser.uid), basicUserData)

              const user: AuthUser = {
                id: firebaseUser.uid as UserId,
                firebaseUid: firebaseUser.uid,
                email: firebaseUser.email!,
                displayName: basicUserData.displayName,
                role: userRole,
                department: basicUserData.department || undefined,
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true,
              }

              setState({
                user,
                isLoading: false,
                isAuthenticated: true,
              })

              logger.info('User document created and authenticated', { userId: user.id, role: user.role })
            } catch (docError) {
              logger.error('Error creating user document', docError)
              setState({
                user: null,
                isLoading: false,
                isAuthenticated: false,
              })
            }
          }
        } catch (error) {
          logger.error('Error fetching user data', error)
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
          })
        }
      } else {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        })
      }
    })

    return () => unsubscribe()
  }, [])

  const value: AuthContextType = {
    ...state,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}