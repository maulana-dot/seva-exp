export type AssetId = string & { readonly brand: unique symbol }
export type UserId = string & { readonly brand: unique symbol }

export type AssetStatus =
  | 'Available'
  | 'In Use'
  | 'Maintenance'
  | 'Reserved'
  | 'Retired'

export type AssetType =
  | 'Laptop'
  | 'Desktop'
  | 'Monitor'
  | 'Phone'
  | 'Tablet'
  | 'Printer'
  | 'Other'

export interface Asset {
  id: AssetId
  devicePhoto?: string
  assetTag: string
  status: AssetStatus
  manufacturer: string
  model: string
  assetType: AssetType
  color: string
  serialNumber: string
  purchaseDate: Date
  purchasePrice: number
  orderNumber: string
  currentOwner?: string
  previousOwner?: string
  dueDate?: Date
  conditionNotes?: string
  createdAt: Date
  updatedAt: Date
  createdBy: UserId
}

export interface CreateAssetInput {
  devicePhoto?: File
  assetTag: string
  status: AssetStatus
  manufacturer: string
  model: string
  assetType: AssetType
  color: string
  serialNumber: string
  purchaseDate: Date
  purchasePrice: number
  orderNumber: string
  currentOwner?: string
  dueDate?: Date
  conditionNotes?: string
}

export interface UpdateAssetInput extends Partial<CreateAssetInput> {
  id: AssetId
}

export interface AssetFilters {
  status?: AssetStatus
  assetType?: AssetType
  manufacturer?: string
  currentOwner?: string
  searchTerm?: string
}

export interface AssetTableRow {
  id: AssetId
  devicePhoto?: string
  assetTag: string
  status: AssetStatus
  manufacturer: string
  model: string
  assetType: AssetType
  color: string
  serialNumber: string
  purchaseDate: string
  purchasePrice: string
  orderNumber: string
  currentOwner?: string
  dueDate?: string
}