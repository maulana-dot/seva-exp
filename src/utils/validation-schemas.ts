import { z } from 'zod'

// Common validation patterns
export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email format')

export const passwordSchema = z
  .string()
  .min(6, 'Password must be at least 6 characters')
  .max(100, 'Password must not exceed 100 characters')

export const displayNameSchema = z
  .string()
  .min(1, 'Display name is required')
  .max(100, 'Display name must not exceed 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Display name can only contain letters, spaces, hyphens, and apostrophes')

export const assetTagSchema = z
  .string()
  .min(1, 'Asset tag is required')
  .max(50, 'Asset tag must not exceed 50 characters')
  .regex(/^[A-Z0-9-]+$/, 'Asset tag can only contain uppercase letters, numbers, and hyphens')

export const serialNumberSchema = z
  .string()
  .min(1, 'Serial number is required')
  .max(100, 'Serial number must not exceed 100 characters')

export const manufacturerSchema = z
  .string()
  .min(1, 'Manufacturer is required')
  .max(100, 'Manufacturer must not exceed 100 characters')

export const modelSchema = z
  .string()
  .min(1, 'Model is required')
  .max(100, 'Model must not exceed 100 characters')

export const priceSchema = z
  .number()
  .min(0, 'Price cannot be negative')
  .max(1000000, 'Price cannot exceed $1,000,000')

export const orderNumberSchema = z
  .string()
  .min(1, 'Order number is required')
  .max(100, 'Order number must not exceed 100 characters')

export const ownerNameSchema = z
  .string()
  .max(100, 'Owner name must not exceed 100 characters')
  .regex(/^[a-zA-Z\s'-]*$/, 'Owner name can only contain letters, spaces, hyphens, and apostrophes')

export const departmentSchema = z
  .string()
  .max(100, 'Department must not exceed 100 characters')

export const notesSchema = z
  .string()
  .max(1000, 'Notes must not exceed 1000 characters')

export const assetStatusSchema = z.enum(['Available', 'In Use', 'Maintenance', 'Reserved', 'Retired'], {
  errorMap: () => ({ message: 'Invalid asset status' })
})

export const assetTypeSchema = z
  .string()
  .min(1, 'Asset type is required')
  .max(50, 'Asset type must not exceed 50 characters')

export const colorSchema = z
  .string()
  .min(1, 'Color is required')
  .max(30, 'Color must not exceed 30 characters')

export const userRoleSchema = z.enum(['admin', 'manager', 'user'], {
  errorMap: () => ({ message: 'Invalid user role' })
})

// File validation
export const imageFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 5 * 1024 * 1024, 'Image must be less than 5MB')
  .refine(
    (file) => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
    'Only JPEG, PNG, and WebP images are allowed'
  )

export const csvFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 10 * 1024 * 1024, 'CSV file must be less than 10MB')
  .refine(
    (file) => file.type === 'text/csv' || file.name.endsWith('.csv'),
    'Only CSV files are allowed'
  )

// Date validation
export const pastDateSchema = z
  .date()
  .max(new Date(), 'Date cannot be in the future')

export const futureDateSchema = z
  .date()
  .min(new Date(), 'Date cannot be in the past')

export const dateRangeSchema = z
  .object({
    start: z.date(),
    end: z.date(),
  })
  .refine((data) => data.end >= data.start, 'End date must be after start date')

// Asset validation schemas
export const createAssetSchema = z.object({
  devicePhoto: imageFileSchema.optional(),
  assetTag: assetTagSchema,
  status: assetStatusSchema,
  manufacturer: manufacturerSchema,
  model: modelSchema,
  assetType: assetTypeSchema,
  color: colorSchema,
  serialNumber: serialNumberSchema,
  purchaseDate: pastDateSchema,
  purchasePrice: priceSchema,
  orderNumber: orderNumberSchema,
  currentOwner: ownerNameSchema.optional(),
  dueDate: z.date().optional(),
  conditionNotes: notesSchema.optional(),
})

export const updateAssetSchema = createAssetSchema.partial().extend({
  id: z.string().min(1, 'Asset ID is required'),
})

export const assetFiltersSchema = z.object({
  status: assetStatusSchema.optional(),
  assetType: assetTypeSchema.optional(),
  manufacturer: z.string().max(100).optional(),
  currentOwner: ownerNameSchema.optional(),
  searchTerm: z.string().max(200).optional(),
})

// User validation schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
  department: departmentSchema.optional(),
})

export const updateUserSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  displayName: displayNameSchema.optional(),
  role: userRoleSchema.optional(),
  department: departmentSchema.optional(),
  isActive: z.boolean().optional(),
})

export const passwordResetSchema = z.object({
  email: emailSchema,
})

// Bulk operations validation
export const bulkUpdateSchema = z.object({
  assetIds: z.array(z.string().min(1)).min(1, 'At least one asset must be selected'),
  updates: z.object({
    status: assetStatusSchema.optional(),
    currentOwner: ownerNameSchema.optional(),
  }),
})

// CSV import validation
export const csvImportSchema = z.object({
  file: csvFileSchema,
  skipFirstRow: z.boolean().default(true),
  validateOnly: z.boolean().default(false),
})

// Search and pagination
export const searchSchema = z.object({
  query: z.string().max(200).optional(),
  filters: z.record(z.string()).optional(),
  sort: z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc']),
  }).optional(),
  pagination: z.object({
    page: z.number().min(1),
    limit: z.number().min(1).max(100),
  }).optional(),
})

// Audit log filters
export const auditLogFiltersSchema = z.object({
  action: z.string().optional(),
  userId: z.string().optional(),
  resourceType: z.string().optional(),
  resourceId: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
})

// Custom validation helpers
export function createFormSchema<T extends z.ZodRawShape>(shape: T) {
  return z.object(shape)
}

export function validateAndTransform<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string
): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      throw new Error(`${context ? context + ': ' : ''}${firstError.message}`)
    }
    throw error
  }
}

export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data)
  return result
}

// ID validation helpers
export function validateAssetId(id: string): void {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new Error('Invalid asset ID')
  }
}

export function validateUserId(id: string): void {
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    throw new Error('Invalid user ID')
  }
}