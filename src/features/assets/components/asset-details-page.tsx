import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AssetForm } from './asset-form'
import { useAsset, useUpdateAsset, useDeleteAsset } from '../hooks/use-assets'
import { usePermissions } from '@/features/authentication/hooks/use-permissions'
import { formatDate, formatDateTime } from '@/utils/date-format'
import { formatCurrency } from '@/utils/number-format'
import { ArrowLeft, Edit, Trash2, Calendar, DollarSign, Package, User } from 'lucide-react'
import type { Asset, UpdateAssetInput, AssetId } from '@/entities/asset/asset.types'

export default function AssetDetailsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const { data: asset, isLoading, error } = useAsset(id as AssetId)
  const updateAssetMutation = useUpdateAsset()
  const deleteAssetMutation = useDeleteAsset()
  const { canUpdateAssets, canDeleteAssets, checkAssetAccess } = usePermissions()

  const canEdit = asset && canUpdateAssets && checkAssetAccess(asset.createdBy)
  const canDelete = asset && canDeleteAssets && checkAssetAccess(asset.createdBy)

  const handleUpdateAsset = (data: any) => {
    if (!asset) return

    const updateData: UpdateAssetInput = {
      id: asset.id,
      devicePhoto: data.devicePhoto,
      assetTag: data.assetTag,
      status: data.status,
      manufacturer: data.manufacturer,
      model: data.model,
      assetType: data.assetType,
      color: data.color,
      serialNumber: data.serialNumber,
      purchaseDate: data.purchaseDate,
      purchasePrice: data.purchasePrice,
      orderNumber: data.orderNumber,
      currentOwner: data.currentOwner || undefined,
      dueDate: data.dueDate || undefined,
      conditionNotes: data.conditionNotes || undefined,
    }

    updateAssetMutation.mutate(updateData, {
      onSuccess: () => {
        setIsEditDialogOpen(false)
      },
    })
  }

  const handleDeleteAsset = () => {
    if (!asset) return

    if (window.confirm(`Are you sure you want to delete asset ${asset.assetTag}?`)) {
      deleteAssetMutation.mutate(asset.id, {
        onSuccess: () => {
          navigate('/assets')
        },
      })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/assets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assets
          </Button>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      </div>
    )
  }

  if (error || !asset) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/assets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assets
          </Button>
        </div>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold mb-2">Asset Not Found</h2>
          <p className="text-gray-600 mb-4">The asset you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link to="/assets">
            <Button>Return to Assets</Button>
          </Link>
        </div>
      </div>
    )
  }

  const statusVariant = asset.status === 'Available' ? 'default' :
                       asset.status === 'In Use' ? 'secondary' :
                       asset.status === 'Maintenance' ? 'destructive' :
                       asset.status === 'Reserved' ? 'outline' : 'destructive'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/assets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assets
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{asset.assetTag}</h1>
            <p className="text-gray-600">{asset.manufacturer} {asset.model}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {canEdit && (
            <Button onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Asset
            </Button>
          )}
          {canDelete && (
            <Button
              variant="destructive"
              onClick={handleDeleteAsset}
              disabled={deleteAssetMutation.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteAssetMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Photo */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Device Photo</CardTitle>
          </CardHeader>
          <CardContent>
            {asset.devicePhoto ? (
              <img
                src={asset.devicePhoto}
                alt={`${asset.assetTag} photo`}
                className="w-full h-64 object-cover rounded-md"
              />
            ) : (
              <div className="w-full h-64 bg-gray-100 rounded-md flex items-center justify-center">
                <Package className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Asset Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Asset Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    <Badge variant={statusVariant}>{asset.status}</Badge>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Asset Type</label>
                  <p className="mt-1 font-medium">{asset.assetType}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Color</label>
                  <p className="mt-1">{asset.color}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Serial Number</label>
                  <p className="mt-1 font-mono text-sm">{asset.serialNumber}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Current Owner</label>
                  <p className="mt-1">{asset.currentOwner || 'Unassigned'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Previous Owner</label>
                  <p className="mt-1">{asset.previousOwner || 'None'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Due Date</label>
                  <p className="mt-1">{asset.dueDate ? formatDate(asset.dueDate) : 'Not set'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Order Number</label>
                  <p className="mt-1">{asset.orderNumber}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Financial Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Purchase Price</label>
              <p className="mt-1 text-2xl font-bold text-green-600">{formatCurrency(asset.purchasePrice)}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Purchase Date</label>
              <p className="mt-1 flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{formatDate(asset.purchaseDate)}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      {asset.conditionNotes && (
        <Card>
          <CardHeader>
            <CardTitle>Condition Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 whitespace-pre-wrap">{asset.conditionNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <label className="font-medium text-gray-500">Created</label>
              <p className="mt-1">{formatDateTime(asset.createdAt)}</p>
            </div>
            <div>
              <label className="font-medium text-gray-500">Last Updated</label>
              <p className="mt-1">{formatDateTime(asset.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Asset Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
          </DialogHeader>
          <AssetForm
            asset={asset}
            onSubmit={handleUpdateAsset}
            isSubmitting={updateAssetMutation.isPending}
            submitLabel="Update Asset"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}