import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { auth, db } from '@/libs/firebase'
import { toast } from 'sonner'
import { Shield, CheckCircle, AlertTriangle } from 'lucide-react'

const adminSetupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  displayName: z.string().min(1, 'Display name is required'),
  department: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type AdminSetupData = z.infer<typeof adminSetupSchema>

export default function AdminSetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [createdAdmin, setCreatedAdmin] = useState<{ email: string; uid: string } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminSetupData>({
    resolver: zodResolver(adminSetupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      displayName: '',
      department: 'Administration',
    },
  })

  const createAdmin = async (data: AdminSetupData) => {
    setIsLoading(true)
    try {
      console.log('Creating admin user...')

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
      const firebaseUser = userCredential.user

      console.log('Firebase user created:', firebaseUser.uid)

      // Create user document in Firestore with admin role
      const userData = {
        firebaseUid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: data.displayName,
        role: 'admin',
        department: data.department || 'Administration',
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      await setDoc(doc(db, 'users', firebaseUser.uid), userData)

      console.log('User document created in Firestore')

      setCreatedAdmin({
        email: firebaseUser.email!,
        uid: firebaseUser.uid,
      })

      setIsSuccess(true)
      toast.success('Admin user created successfully!')

    } catch (error: any) {
      console.error('Error creating admin:', error)

      let errorMessage = 'Failed to create admin user'
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email address is already in use'
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address'
      }

      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess && createdAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-xl text-green-600">Admin Created Successfully!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <h3 className="font-medium text-green-800 mb-2">Admin Account Details:</h3>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>Email:</strong> {createdAdmin.email}</p>
                <p><strong>UID:</strong> {createdAdmin.uid}</p>
                <p><strong>Role:</strong> Admin</p>
                <p><strong>Status:</strong> Active</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">Next Steps:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>You can now log in with these credentials</li>
                    <li>Access the user management interface</li>
                    <li>Create additional users as needed</li>
                    <li>Configure asset types and categories</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              onClick={() => window.location.href = '/auth/login'}
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-16 w-16 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Create Admin Account</CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Set up the first administrator account for your asset management system
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(createAdmin)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="admin@company.com"
              />
              {errors.email && (
                <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="displayName">Display Name *</Label>
              <Input
                id="displayName"
                {...register('displayName')}
                placeholder="System Administrator"
              />
              {errors.displayName && (
                <p className="text-sm text-red-600 mt-1">{errors.displayName.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                {...register('department')}
                placeholder="Administration"
              />
              {errors.department && (
                <p className="text-sm text-red-600 mt-1">{errors.department.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                {...register('password')}
                placeholder="Enter secure password"
              />
              {errors.password && (
                <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register('confirmPassword')}
                placeholder="Confirm password"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? 'Creating Admin...' : 'Create Admin Account'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium mb-1">Important:</p>
                <p>This admin account will have full system access including user management, asset operations, and system configuration.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}