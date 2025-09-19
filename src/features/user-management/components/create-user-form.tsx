import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { CreateUserInput } from '../services/user-management.service'
import type { UserRole } from '@/entities/user/user.types'
import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'

const createUserFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long'),
  role: z.enum(['admin', 'manager', 'user'] as const),
  department: z.enum(['ACC', 'SEVA', 'TAF', 'FIF'] as const).optional(),
  isActive: z.boolean(),
})

type CreateUserFormData = z.infer<typeof createUserFormSchema>

interface CreateUserFormProps {
  onSubmit: (data: CreateUserInput) => void
  isSubmitting?: boolean
  onCancel?: () => void
}

const roleOptions: { value: UserRole; label: string; description: string }[] = [
  {
    value: 'user',
    label: 'User',
    description: 'Can manage own assets only',
  },
  {
    value: 'manager',
    label: 'Manager',
    description: 'Can manage assets and view reports',
  },
  {
    value: 'admin',
    label: 'Administrator',
    description: 'Full system access including user management',
  },
]

const departmentOptions = [
  { value: 'ACC', label: 'ACC - Accounting' },
  { value: 'SEVA', label: 'SEVA - Service A' },
  { value: 'TAF', label: 'TAF - Technical Affairs' },
  { value: 'FIF', label: 'FIF - Finance' },
]

export function CreateUserForm({ onSubmit, isSubmitting = false, onCancel }: CreateUserFormProps) {
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: {
      email: '',
      password: '',
      displayName: '',
      role: 'user',
      department: undefined,
      isActive: true,
    },
  })

  const watchedRole = watch('role')
  const watchedIsActive = watch('isActive')

  const handleFormSubmit = (data: CreateUserFormData) => {
    onSubmit({
      email: data.email,
      password: data.password,
      displayName: data.displayName,
      role: data.role,
      department: data.department || undefined,
      isActive: data.isActive,
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="Enter email address"
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="password">Password *</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              {...register('password')}
              placeholder="Enter password"
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isSubmitting}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="displayName">Display Name *</Label>
          <Input
            id="displayName"
            {...register('displayName')}
            placeholder="Enter display name"
            disabled={isSubmitting}
          />
          {errors.displayName && (
            <p className="text-sm text-red-600 mt-1">{errors.displayName.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="role">Role *</Label>
          <div className="mt-2 space-y-3">
            {roleOptions.map((option) => (
              <label
                key={option.value}
                className={`relative flex cursor-pointer rounded-lg border p-4 ${
                  watchedRole === option.value
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 bg-white hover:bg-gray-50'
                } transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input
                  type="radio"
                  {...register('role')}
                  value={option.value}
                  className="sr-only"
                  disabled={isSubmitting}
                />
                <div className="flex flex-1">
                  <div className="flex items-center">
                    <div
                      className={`h-4 w-4 rounded-full border-2 ${
                        watchedRole === option.value
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {watchedRole === option.value && (
                        <div className="h-full w-full rounded-full bg-white scale-50" />
                      )}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>
          {errors.role && (
            <p className="text-sm text-red-600 mt-1">{errors.role.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="department">Department</Label>
          <select
            id="department"
            {...register('department')}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select department (optional)</option>
            {departmentOptions.map((dept) => (
              <option key={dept.value} value={dept.value}>
                {dept.label}
              </option>
            ))}
          </select>
          {errors.department && (
            <p className="text-sm text-red-600 mt-1">{errors.department.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <Label htmlFor="isActive" className="text-base font-medium">
              Account Status
            </Label>
            <p className="text-sm text-gray-600 mt-1">
              {watchedIsActive ? 'User can access the system' : 'User is blocked from accessing the system'}
            </p>
          </div>
          <Switch
            id="isActive"
            checked={watchedIsActive}
            onCheckedChange={(checked) => setValue('isActive', checked)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="flex space-x-3 pt-4 border-t">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Creating User...' : 'Create User'}
        </Button>
      </div>
    </form>
  )
}