import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  createColumnHelper,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/utils/date-format'
import { formatCurrency } from '@/utils/number-format'
import { usePermissions } from '@/features/authentication/hooks/use-permissions'
import type { Asset } from '@/entities/asset/asset.types'
import { Edit, Trash2, Eye, Search } from 'lucide-react'

const columnHelper = createColumnHelper<Asset>()

interface AssetsTableProps {
  assets: Asset[]
  onEdit?: (asset: Asset) => void
  onDelete?: (asset: Asset) => void
  onView?: (asset: Asset) => void
  isLoading?: boolean
}

export function AssetsTable({ assets, onEdit, onDelete, onView, isLoading = false }: AssetsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const { canUpdateAssets, canDeleteAssets, checkAssetAccess } = usePermissions()

  const columns = [
    columnHelper.display({
      id: 'devicePhoto',
      header: 'Photo',
      cell: ({ row }) => (
        <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
          {row.original.devicePhoto ? (
            <img
              src={row.original.devicePhoto}
              alt={`${row.original.assetTag} photo`}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs text-gray-400">No photo</span>
          )}
        </div>
      ),
    }),
    columnHelper.accessor('assetTag', {
      header: 'Asset Tag',
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue()}</span>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue()
        const variant = status === 'Available' ? 'default' :
                      status === 'In Use' ? 'secondary' :
                      status === 'Maintenance' ? 'destructive' :
                      status === 'Reserved' ? 'outline' : 'destructive'
        return <Badge variant={variant}>{status}</Badge>
      },
    }),
    columnHelper.accessor('manufacturer', {
      header: 'Manufacturer',
    }),
    columnHelper.accessor('model', {
      header: 'Model',
    }),
    columnHelper.accessor('assetType', {
      header: 'Type',
    }),
    columnHelper.accessor('serialNumber', {
      header: 'Serial Number',
      cell: ({ getValue }) => (
        <span className="font-mono text-sm">{getValue()}</span>
      ),
    }),
    columnHelper.accessor('purchasePrice', {
      header: 'Price',
      cell: ({ getValue }) => formatCurrency(getValue()),
    }),
    columnHelper.accessor('currentOwner', {
      header: 'Current Owner',
      cell: ({ getValue }) => getValue() || '-',
    }),
    columnHelper.accessor('purchaseDate', {
      header: 'Purchase Date',
      cell: ({ getValue }) => formatDate(getValue()),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const asset = row.original
        const canEdit = canUpdateAssets && checkAssetAccess(asset.createdBy)
        const canRemove = canDeleteAssets && checkAssetAccess(asset.createdBy)

        return (
          <div className="flex items-center space-x-2">
            {onView && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onView(asset)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            {canEdit && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(asset)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {canRemove && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(asset)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    }),
  ]

  const table = useReactTable({
    data: assets,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Assets ({assets.length})</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search assets..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No assets found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}