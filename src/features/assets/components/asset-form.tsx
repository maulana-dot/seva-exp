import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/utils/number-format'
import { formatDateForInput } from '@/utils/date-format'
import type { Asset, AssetStatus, AssetType } from '@/entities/asset/asset.types'

const assetStatusOptions: AssetStatus[] = ['Available', 'In Use', 'Maintenance', 'Reserved', 'Retired']
const assetTypeOptions: AssetType[] = ['Laptop', 'Desktop', 'Monitor', 'Phone', 'Tablet', 'Printer', 'Other']

const assetFormSchema = z.object({
  devicePhoto: z.any().optional(),
  assetTag: z.string().min(1, 'Asset tag is required'),
  status: z.enum(['Available', 'In Use', 'Maintenance', 'Reserved', 'Retired']),
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  model: z.string().min(1, 'Model is required'),
  assetType: z.enum(['Laptop', 'Desktop', 'Monitor', 'Phone', 'Tablet', 'Printer', 'Other']),
  color: z.string().min(1, 'Color is required'),
  serialNumber: z.string().min(1, 'Serial number is required'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  purchasePrice: z.string().min(1, 'Purchase price is required'),
  orderNumber: z.string().min(1, 'Order number is required'),
  currentOwner: z.string().optional(),
  dueDate: z.string().optional(),
  conditionNotes: z.string().optional(),
})

type AssetFormData = z.infer<typeof assetFormSchema>

interface AssetFormProps {
  asset?: Asset
  onSubmit: (data: AssetFormData) => void
  isSubmitting?: boolean
  submitLabel?: string
}

export function AssetForm({ asset, onSubmit, isSubmitting = false, submitLabel = 'Save Asset' }: AssetFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: asset
      ? {
          assetTag: asset.assetTag,
          status: asset.status,
          manufacturer: asset.manufacturer,
          model: asset.model,
          assetType: asset.assetType,
          color: asset.color,
          serialNumber: asset.serialNumber,
          purchaseDate: formatDateForInput(asset.purchaseDate),
          purchasePrice: formatCurrency(asset.purchasePrice),
          orderNumber: asset.orderNumber,
          currentOwner: asset.currentOwner || '',
          dueDate: asset.dueDate ? formatDateForInput(asset.dueDate) : '',
          conditionNotes: asset.conditionNotes || '',
        }
      : {
          status: 'Available',
          assetType: 'Laptop',
        },
  })

  const handleFormSubmit = (data: AssetFormData) => {
    const processedData = {
      ...data,
      devicePhoto: data.devicePhoto?.[0] || undefined,
    }
    onSubmit(processedData)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{asset ? 'Edit Asset' : 'Create New Asset'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Device Photo */}
            <div className="md:col-span-2">
              <Label htmlFor="devicePhoto">Device Photo</Label>
              <Input
                {...register('devicePhoto')}
                id="devicePhoto"
                type="file"
                accept="image/*"
                disabled={isSubmitting}
              />
              {errors.devicePhoto && (
                <p className="text-sm text-red-600 mt-1">{errors.devicePhoto?.message}</p>
              )}
            </div>

            {/* Asset Tag */}
            <div>
              <Label htmlFor="assetTag">Asset Tag</Label>
              <Input
                {...register('assetTag')}
                id="assetTag"
                placeholder="e.g., LP-2024-001"
                disabled={isSubmitting}
              />
              {errors.assetTag && (
                <p className="text-sm text-red-600 mt-1">{errors.assetTag?.message}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                {...register('status')}
                id="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting}
              >
                {assetStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              {errors.status && (
                <p className="text-sm text-red-600 mt-1">{errors.status.message}</p>
              )}
            </div>

            {/* Manufacturer */}
            <div>
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                {...register('manufacturer')}
                id="manufacturer"
                placeholder="e.g., Microsoft"
                disabled={isSubmitting}
              />
              {errors.manufacturer && (
                <p className="text-sm text-red-600 mt-1">{errors.manufacturer.message}</p>
              )}
            </div>

            {/* Model */}
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                {...register('model')}
                id="model"
                placeholder="e.g., Surface Laptop 5"
                disabled={isSubmitting}
              />
              {errors.model && (
                <p className="text-sm text-red-600 mt-1">{errors.model.message}</p>
              )}
            </div>

            {/* Asset Type */}
            <div>
              <Label htmlFor="assetType">Asset Type</Label>
              <select
                {...register('assetType')}
                id="assetType"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting}
              >
                {assetTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.assetType && (
                <p className="text-sm text-red-600 mt-1">{errors.assetType.message}</p>
              )}
            </div>

            {/* Color */}
            <div>
              <Label htmlFor="color">Color</Label>
              <Input
                {...register('color')}
                id="color"
                placeholder="e.g., Silver"
                disabled={isSubmitting}
              />
              {errors.color && (
                <p className="text-sm text-red-600 mt-1">{errors.color.message}</p>
              )}
            </div>

            {/* Serial Number */}
            <div>
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                {...register('serialNumber')}
                id="serialNumber"
                placeholder="e.g., 123ABC456DEF"
                disabled={isSubmitting}
              />
              {errors.serialNumber && (
                <p className="text-sm text-red-600 mt-1">{errors.serialNumber.message}</p>
              )}
            </div>

            {/* Purchase Date */}
            <div>
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                {...register('purchaseDate')}
                id="purchaseDate"
                type="date"
                disabled={isSubmitting}
              />
              {errors.purchaseDate && (
                <p className="text-sm text-red-600 mt-1">{errors.purchaseDate.message}</p>
              )}
            </div>

            {/* Purchase Price */}
            <div>
              <Label htmlFor="purchasePrice">Purchase Price</Label>
              <Input
                {...register('purchasePrice')}
                id="purchasePrice"
                placeholder="e.g., $1,299.99"
                disabled={isSubmitting}
              />
              {errors.purchasePrice && (
                <p className="text-sm text-red-600 mt-1">{errors.purchasePrice.message}</p>
              )}
            </div>

            {/* Order Number */}
            <div>
              <Label htmlFor="orderNumber">Order Number</Label>
              <Input
                {...register('orderNumber')}
                id="orderNumber"
                placeholder="e.g., PO-2024-001"
                disabled={isSubmitting}
              />
              {errors.orderNumber && (
                <p className="text-sm text-red-600 mt-1">{errors.orderNumber.message}</p>
              )}
            </div>

            {/* Current Owner */}
            <div>
              <Label htmlFor="currentOwner">Current Owner (Optional)</Label>
              <Input
                {...register('currentOwner')}
                id="currentOwner"
                placeholder="e.g., John Doe"
                disabled={isSubmitting}
              />
              {errors.currentOwner && (
                <p className="text-sm text-red-600 mt-1">{errors.currentOwner.message}</p>
              )}
            </div>

            {/* Due Date */}
            <div>
              <Label htmlFor="dueDate">Due Date (Optional)</Label>
              <Input
                {...register('dueDate')}
                id="dueDate"
                type="date"
                disabled={isSubmitting}
              />
              {errors.dueDate && (
                <p className="text-sm text-red-600 mt-1">{errors.dueDate.message}</p>
              )}
            </div>

            {/* Condition Notes */}
            <div className="md:col-span-2">
              <Label htmlFor="conditionNotes">Condition Notes (Optional)</Label>
              <textarea
                {...register('conditionNotes')}
                id="conditionNotes"
                placeholder="Any additional notes about the asset condition..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting}
              />
              {errors.conditionNotes && (
                <p className="text-sm text-red-600 mt-1">{errors.conditionNotes.message}</p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}