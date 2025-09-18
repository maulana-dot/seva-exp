import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { UserManagementUser } from '../services/user-management.service'
import type { UserRole } from '@/entities/user/user.types'

const userFormSchema = z.object({
  displayName: z.string().min(1, 'Display name is required').max(100, 'Display name too long'),
  role: z.enum(['admin', 'manager', 'user'] as const),
  department: z.string().optional(),
  isActive: z.boolean(),
})

type UserFormData = z.infer<typeof userFormSchema>

interface UserFormProps {
  user?: UserManagementUser
  onSubmit: (data: UserFormData) => void
  isSubmitting?: boolean
  submitLabel?: string
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

export function UserForm({ user, onSubmit, isSubmitting = false, submitLabel = 'Save User' }: UserFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: user ? {
      displayName: user.displayName || '',
      role: user.role,
      department: user.department || '',
      isActive: user.isActive,
    } : {
      displayName: '',
      role: 'user',
      department: '',
      isActive: true,
    },
  })

  const watchedRole = watch('role')
  const watchedIsActive = watch('isActive')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {user && (
        <div className="border-b pb-4">
          <h3 className="text-lg font-medium">User Information</h3>
          <p className="text-sm text-gray-600 mt-1">{user.email}</p>
          <p className="text-xs text-gray-500">User ID: {user.id}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="displayName">Display Name *</Label>
          <Input
            id="displayName"
            {...register('displayName')}
            placeholder="Enter display name"
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
                } transition-colors`}
              >
                <input
                  type="radio"
                  {...register('role')}
                  value={option.value}
                  className="sr-only"
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
          <Input
            id="department"
            {...register('department')}
            placeholder="Enter department (optional)"
          />
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
          />
        </div>
      </div>

      <div className="flex space-x-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}