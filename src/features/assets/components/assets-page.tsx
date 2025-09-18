import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AssetsTable } from './assets-table'
import { AssetForm } from './asset-form'
import { CSVImportExport } from './csv-import-export'
import { AssetFiltersComponent } from './asset-filters'
import { BulkOperations } from './bulk-operations'
import { useAssets, useCreateAsset, useUpdateAsset, useDeleteAsset } from '../hooks/use-assets'
import { usePermissions } from '@/features/authentication/hooks/use-permissions'
import { Plus, Package } from 'lucide-react'
import type { Asset, CreateAssetInput, UpdateAssetInput, AssetFilters } from '@/entities/asset/asset.types'

export default function AssetsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [filters, setFilters] = useState<AssetFilters>({})
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([])

  const navigate = useNavigate()
  const { data: assets = [], isLoading, refetch } = useAssets(filters)
  const createAssetMutation = useCreateAsset()
  const updateAssetMutation = useUpdateAsset()
  const deleteAssetMutation = useDeleteAsset()
  const { canCreateAssets } = usePermissions()

  const handleCreateAsset = (data: any) => {
    const createData: CreateAssetInput = {
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

    createAssetMutation.mutate(createData, {
      onSuccess: () => {
        setIsCreateDialogOpen(false)
        refetch()
      },
    })
  }

  const handleUpdateAsset = (data: any) => {
    if (!editingAsset) return

    const updateData: UpdateAssetInput = {
      id: editingAsset.id,
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
        setEditingAsset(null)
        refetch()
      },
    })
  }

  const handleDeleteAsset = (asset: Asset) => {
    if (window.confirm(`Are you sure you want to delete asset ${asset.assetTag}?`)) {
      deleteAssetMutation.mutate(asset.id)
    }
  }

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset)
  }

  const handleViewAsset = (asset: Asset) => {
    navigate(`/assets/${asset.id}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Assets</h1>
          <p className="text-gray-600">Manage your organization's digital assets</p>
        </div>
        <div className="flex items-center space-x-2">
          <CSVImportExport />
          {canCreateAssets && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Asset
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Asset</DialogTitle>
                </DialogHeader>
                <AssetForm
                  onSubmit={handleCreateAsset}
                  isSubmitting={createAssetMutation.isPending}
                  submitLabel="Create Asset"
                />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filters */}
      <AssetFiltersComponent filters={filters} onFiltersChange={setFilters} />

      {/* Bulk Operations */}
      {assets.length > 0 && (
        <BulkOperations
          assets={assets}
          selectedAssets={selectedAssets}
          onSelectionChange={setSelectedAssets}
          onAssetUpdate={() => refetch()}
        />
      )}

      {assets.length === 0 && !isLoading ? (
        <div className="text-center py-16">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No assets found</h3>
          <p className="text-gray-600 mb-4">Get started by adding your first asset</p>
          {canCreateAssets && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Asset
            </Button>
          )}
        </div>
      ) : (
        <AssetsTable
          assets={assets}
          onEdit={handleEditAsset}
          onDelete={handleDeleteAsset}
          onView={handleViewAsset}
          isLoading={isLoading}
        />
      )}

      {/* Edit Asset Dialog */}
      <Dialog open={!!editingAsset} onOpenChange={() => setEditingAsset(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
          </DialogHeader>
          {editingAsset && (
            <AssetForm
              asset={editingAsset}
              onSubmit={handleUpdateAsset}
              isSubmitting={updateAssetMutation.isPending}
              submitLabel="Update Asset"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}