import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { AssetForm } from './asset-form'
import { AssetStatusWorkflow } from './asset-status-workflow'
import { useAsset, useUpdateAsset, useDeleteAsset } from '../hooks/use-assets'
import { usePermissions } from '@/features/authentication/hooks/use-permissions'
import { ArrowLeft, Edit, Trash2, Calendar, DollarSign, User, Package, Building } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'
import type { AssetId, UpdateAssetInput } from '@/entities/asset/asset.types'

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const { data: asset, isLoading, refetch } = useAsset(id as AssetId)
  const updateAssetMutation = useUpdateAsset()
  const deleteAssetMutation = useDeleteAsset()
  const { canUpdateAllAssets, canDeleteAllAssets, checkAssetAccess } = usePermissions()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading asset...</div>
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="text-center py-16">
        <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Asset not found</h3>
        <p className="text-gray-600 mb-4">The asset you're looking for doesn't exist</p>
        <Button onClick={() => navigate('/assets')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assets
        </Button>
      </div>
    )
  }

  const canUpdateAsset = canUpdateAllAssets || checkAssetAccess(asset.createdBy)
  const canDeleteAsset = canDeleteAllAssets || checkAssetAccess(asset.createdBy)

  const handleUpdateAsset = (data: any) => {
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
        refetch()
      },
    })
  }

  const handleDeleteAsset = () => {
    if (window.confirm(`Are you sure you want to delete asset ${asset.assetTag}? This action cannot be undone.`)) {
      deleteAssetMutation.mutate(asset.id, {
        onSuccess: () => {
          navigate('/assets')
        },
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800'
      case 'In Use': return 'bg-blue-100 text-blue-800'
      case 'Maintenance': return 'bg-yellow-100 text-yellow-800'
      case 'Reserved': return 'bg-purple-100 text-purple-800'
      case 'Retired': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
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
          <Badge className={getStatusColor(asset.status)}>
            {asset.status}
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          {canUpdateAsset && (
            <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canDeleteAsset && (
            <Button variant="destructive" onClick={handleDeleteAsset}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Asset Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {asset.devicePhoto && (
                <div>
                  <img
                    src={asset.devicePhoto}
                    alt={`${asset.assetTag} device photo`}
                    className="w-full max-w-md h-48 object-cover rounded-lg border"
                  />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Asset Tag</label>
                  <p className="mt-1 font-medium">{asset.assetTag}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Type</label>
                  <p className="mt-1">{asset.assetType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Manufacturer</label>
                  <p className="mt-1">{asset.manufacturer}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Model</label>
                  <p className="mt-1">{asset.model}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Serial Number</label>
                  <p className="mt-1">{asset.serialNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Color</label>
                  <p className="mt-1">{asset.color}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Purchase Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Purchase Date</label>
                  <p className="mt-1 flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{format(asset.purchaseDate, 'PPP')}</span>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Purchase Price</label>
                  <p className="mt-1">${asset.purchasePrice.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Order Number</label>
                  <p className="mt-1">{asset.orderNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Assignment Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Current Owner</label>
                  <p className="mt-1">{asset.currentOwner || 'Unassigned'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Previous Owner</label>
                  <p className="mt-1">{asset.previousOwner || 'None'}</p>
                </div>
                {asset.dueDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Due Date</label>
                    <p className="mt-1 flex items-center space-x-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(asset.dueDate, 'PPP')}</span>
                    </p>
                  </div>
                )}
              </div>
              {asset.conditionNotes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Condition Notes</label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg">{asset.conditionNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status Workflow Sidebar */}
        <div className="space-y-6">
          <AssetStatusWorkflow asset={asset} onStatusUpdate={() => refetch()} />

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <label className="font-medium text-gray-500">Created</label>
                <p>{format(asset.createdAt, 'PPP')}</p>
              </div>
              <div>
                <label className="font-medium text-gray-500">Last Updated</label>
                <p>{format(asset.updatedAt, 'PPP')}</p>
              </div>
              <div>
                <label className="font-medium text-gray-500">Asset ID</label>
                <p className="font-mono text-xs bg-gray-100 p-1 rounded">{asset.id}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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