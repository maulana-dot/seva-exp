import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import type { AssetFilters, AssetStatus, AssetType } from '@/entities/asset/asset.types'
import { Filter, X } from 'lucide-react'

const assetStatusOptions: AssetStatus[] = ['Available', 'In Use', 'Maintenance', 'Reserved', 'Retired']
const assetTypeOptions: AssetType[] = ['Laptop', 'Desktop', 'Monitor', 'Phone', 'Tablet', 'Printer', 'Other']

interface AssetFiltersProps {
  filters: AssetFilters
  onFiltersChange: (filters: AssetFilters) => void
}

export function AssetFiltersComponent({ filters, onFiltersChange }: AssetFiltersProps) {
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<AssetFilters>(filters)

  const applyFilters = () => {
    onFiltersChange(localFilters)
    setIsFilterDialogOpen(false)
  }

  const clearFilters = () => {
    const emptyFilters: AssetFilters = {}
    setLocalFilters(emptyFilters)
    onFiltersChange(emptyFilters)
    setIsFilterDialogOpen(false)
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== undefined && value !== '')

  return (
    <div className="flex items-center space-x-2">
      {/* Search Input */}
      <div className="relative">
        <Input
          placeholder="Search assets..."
          value={filters.searchTerm || ''}
          onChange={(e) => onFiltersChange({ ...filters, searchTerm: e.target.value })}
          className="w-64"
        />
      </div>

      {/* Advanced Filters Dialog */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                Active
              </span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filter Assets</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Status Filter */}
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={localFilters.status || ''}
                onChange={(e) => setLocalFilters({ ...localFilters, status: e.target.value as AssetStatus || undefined })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">All Statuses</option>
                {assetStatusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Asset Type Filter */}
            <div>
              <Label htmlFor="assetType">Asset Type</Label>
              <select
                id="assetType"
                value={localFilters.assetType || ''}
                onChange={(e) => setLocalFilters({ ...localFilters, assetType: e.target.value as AssetType || undefined })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">All Types</option>
                {assetTypeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Manufacturer Filter */}
            <div>
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                placeholder="e.g., Microsoft"
                value={localFilters.manufacturer || ''}
                onChange={(e) => setLocalFilters({ ...localFilters, manufacturer: e.target.value || undefined })}
              />
            </div>

            {/* Current Owner Filter */}
            <div>
              <Label htmlFor="currentOwner">Current Owner</Label>
              <Input
                id="currentOwner"
                placeholder="e.g., John Doe"
                value={localFilters.currentOwner || ''}
                onChange={(e) => setLocalFilters({ ...localFilters, currentOwner: e.target.value || undefined })}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-4">
              <Button onClick={applyFilters} className="flex-1">
                Apply Filters
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex items-center space-x-2">
          {filters.status && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              Status: {filters.status}
            </span>
          )}
          {filters.assetType && (
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
              Type: {filters.assetType}
            </span>
          )}
          {filters.manufacturer && (
            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
              Manufacturer: {filters.manufacturer}
            </span>
          )}
          {filters.currentOwner && (
            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
              Owner: {filters.currentOwner}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}