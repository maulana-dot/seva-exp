import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/libs/firebase'
import { logger } from '@/utils/logger'

interface CreateAdminInput {
  email: string
  password: string
  displayName: string
  department?: string
}

export async function createAdminUser(input: CreateAdminInput): Promise<void> {
  try {
    logger.info('Creating admin user', { email: input.email })

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, input.email, input.password)
    const firebaseUser = userCredential.user

    // Create user document in Firestore with admin role
    const userData = {
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email!,
      displayName: input.displayName,
      role: 'admin',
      department: input.department || 'Administration',
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }

    await setDoc(doc(db, 'users', firebaseUser.uid), userData)

    logger.info('Admin user created successfully', {
      uid: firebaseUser.uid,
      email: firebaseUser.email
    })

    console.log('✅ Admin user created successfully!')
    console.log(`Email: ${firebaseUser.email}`)
    console.log(`UID: ${firebaseUser.uid}`)
    console.log(`Role: admin`)

  } catch (error) {
    logger.error('Failed to create admin user', { error })
    console.error('❌ Failed to create admin user:', error)
    throw error
  }
}

// Command line interface
if (typeof window === 'undefined') {
  // This script is being run in Node.js environment
  const args = process.argv.slice(2)

  if (args.length < 3) {
    console.log('Usage: bun run create-admin <email> <password> <displayName> [department]')
    console.log('Example: bun run create-admin admin@company.com securepass123 "System Administrator" "IT Department"')
    process.exit(1)
  }

  const [email, password, displayName, department] = args

  createAdminUser({
    email,
    password,
    displayName,
    department,
  }).then(() => {
    console.log('Admin user creation completed!')
    process.exit(0)
  }).catch((error) => {
    console.error('Admin user creation failed:', error.message)
    process.exit(1)
  })
}