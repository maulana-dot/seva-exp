import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useUpdateAsset, useDeleteAsset } from '../hooks/use-assets'
import { usePermissions } from '@/features/authentication/hooks/use-permissions'
import { toast } from 'sonner'
import { Trash2, Edit, Users, Package } from 'lucide-react'
import type { Asset, AssetStatus } from '@/entities/asset/asset.types'

interface BulkOperationsProps {
  assets: Asset[]
  selectedAssets: Asset[]
  onSelectionChange: (assets: Asset[]) => void
  onAssetUpdate: () => void
}

const assetStatusOptions: AssetStatus[] = ['Available', 'In Use', 'Maintenance', 'Reserved', 'Retired']

export function BulkOperations({ assets, selectedAssets, onSelectionChange, onAssetUpdate }: BulkOperationsProps) {
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false)
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<AssetStatus>('Available')
  const [bulkOwner, setBulkOwner] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const updateAssetMutation = useUpdateAsset()
  const deleteAssetMutation = useDeleteAsset()
  const { canUpdateAllAssets, canDeleteAllAssets, checkAssetAccess } = usePermissions()

  const selectableAssets = assets.filter(asset =>
    canUpdateAllAssets || checkAssetAccess(asset.createdBy)
  )

  const deletableAssets = selectedAssets.filter(asset =>
    canDeleteAllAssets || checkAssetAccess(asset.createdBy)
  )

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(selectableAssets)
    } else {
      onSelectionChange([])
    }
  }

  const handleAssetSelection = (asset: Asset, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedAssets, asset])
    } else {
      onSelectionChange(selectedAssets.filter(a => a.id !== asset.id))
    }
  }

  const handleBulkStatusUpdate = async () => {
    if (selectedAssets.length === 0) {
      toast.error('No assets selected')
      return
    }

    setIsProcessing(true)
    let successCount = 0
    let errorCount = 0

    for (const asset of selectedAssets) {
      try {
        await updateAssetMutation.mutateAsync({
          id: asset.id,
          status: bulkStatus,
        })
        successCount++
      } catch (error) {
        errorCount++
        console.error('Failed to update asset:', asset.assetTag, error)
      }
    }

    if (successCount > 0) {
      toast.success(`Updated ${successCount} assets to ${bulkStatus}`)
      onAssetUpdate()
      onSelectionChange([])
    }

    if (errorCount > 0) {
      toast.error(`Failed to update ${errorCount} assets`)
    }

    setIsProcessing(false)
    setIsBulkUpdateOpen(false)
  }

  const handleBulkOwnerUpdate = async () => {
    if (selectedAssets.length === 0) {
      toast.error('No assets selected')
      return
    }

    setIsProcessing(true)
    let successCount = 0
    let errorCount = 0

    for (const asset of selectedAssets) {
      try {
        await updateAssetMutation.mutateAsync({
          id: asset.id,
          currentOwner: bulkOwner || undefined,
        })
        successCount++
      } catch (error) {
        errorCount++
        console.error('Failed to update asset owner:', asset.assetTag, error)
      }
    }

    if (successCount > 0) {
      toast.success(`Updated owner for ${successCount} assets`)
      onAssetUpdate()
      onSelectionChange([])
    }

    if (errorCount > 0) {
      toast.error(`Failed to update ${errorCount} assets`)
    }

    setIsProcessing(false)
    setBulkOwner('')
  }

  const handleBulkDelete = async () => {
    if (deletableAssets.length === 0) {
      toast.error('No assets selected for deletion')
      return
    }

    const confirmMessage = `Are you sure you want to delete ${deletableAssets.length} asset(s)? This action cannot be undone.`

    if (!window.confirm(confirmMessage)) {
      return
    }

    setIsProcessing(true)
    let successCount = 0
    let errorCount = 0

    for (const asset of deletableAssets) {
      try {
        await deleteAssetMutation.mutateAsync(asset.id)
        successCount++
      } catch (error) {
        errorCount++
        console.error('Failed to delete asset:', asset.assetTag, error)
      }
    }

    if (successCount > 0) {
      toast.success(`Deleted ${successCount} assets`)
      onAssetUpdate()
      onSelectionChange([])
    }

    if (errorCount > 0) {
      toast.error(`Failed to delete ${errorCount} assets`)
    }

    setIsProcessing(false)
    setIsBulkDeleteOpen(false)
  }

  const allSelected = selectableAssets.length > 0 && selectedAssets.length === selectableAssets.length
  const someSelected = selectedAssets.length > 0 && selectedAssets.length < selectableAssets.length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Bulk Operations</span>
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={allSelected}
              ref={(el) => {
                if (el && 'indeterminate' in el) {
                  (el as HTMLInputElement).indeterminate = someSelected
                }
              }}
              onCheckedChange={handleSelectAll}
            />
            <Label className="text-sm">
              Select All ({selectedAssets.length}/{selectableAssets.length})
            </Label>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Asset Selection List */}
          {selectableAssets.length > 0 && (
            <div className="max-h-48 overflow-y-auto space-y-2">
              {selectableAssets.map((asset) => (
                <div key={asset.id} className="flex items-center space-x-2 p-2 border rounded">
                  <Checkbox
                    checked={selectedAssets.some(a => a.id === asset.id)}
                    onCheckedChange={(checked) => handleAssetSelection(asset, checked as boolean)}
                  />
                  <div className="flex-1">
                    <span className="font-medium">{asset.assetTag}</span>
                    <span className="text-sm text-gray-600 ml-2">
                      {asset.manufacturer} {asset.model}
                    </span>
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                    {asset.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Bulk Action Buttons */}
          {selectedAssets.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {/* Bulk Status Update */}
              <Dialog open={isBulkUpdateOpen} onOpenChange={setIsBulkUpdateOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Update Status ({selectedAssets.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Bulk Status Update</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="bulkStatus">New Status</Label>
                      <select
                        id="bulkStatus"
                        value={bulkStatus}
                        onChange={(e) => setBulkStatus(e.target.value as AssetStatus)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {assetStatusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleBulkStatusUpdate}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        {isProcessing ? 'Updating...' : `Update ${selectedAssets.length} Assets`}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              {/* Bulk Owner Update */}
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="New owner..."
                  value={bulkOwner}
                  onChange={(e) => setBulkOwner(e.target.value)}
                  className="w-32"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkOwnerUpdate}
                  disabled={isProcessing}
                >
                  <Users className="h-4 w-4 mr-2" />
                  {isProcessing ? 'Updating...' : 'Set Owner'}
                </Button>
              </div>

              {/* Bulk Delete */}
              {deletableAssets.length > 0 && (
                <Dialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete ({deletableAssets.length})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Bulk Delete Assets</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600">
                        This will permanently delete {deletableAssets.length} asset(s). This action cannot be undone.
                      </p>
                      <div className="flex space-x-2">
                        <Button
                          variant="destructive"
                          onClick={handleBulkDelete}
                          disabled={isProcessing}
                          className="flex-1"
                        >
                          {isProcessing ? 'Deleting...' : `Delete ${deletableAssets.length} Assets`}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsBulkDeleteOpen(false)}
                          disabled={isProcessing}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}

          {selectedAssets.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">Select assets to perform bulk operations</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}