import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table'
import { Button } from './button'
import { Input } from './input'
import { Badge } from './badge'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  Download
} from 'lucide-react'

export interface DataTableColumn<T> {
  id: string
  header: string
  accessorKey?: keyof T
  accessorFn?: (row: T) => any
  cell?: (value: any, row: T) => React.ReactNode
  sortable?: boolean
  searchable?: boolean
  width?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  title?: string
  searchPlaceholder?: string
  pageSize?: number
  onRowClick?: (row: T) => void
  onExport?: () => void
  loading?: boolean
  emptyMessage?: string
  enableSearch?: boolean
  enablePagination?: boolean
  enableSorting?: boolean
}

type SortDirection = 'asc' | 'desc' | null

export function DataTable<T>({
  data,
  columns,
  title,
  searchPlaceholder = "Search...",
  pageSize = 10,
  onRowClick,
  onExport,
  loading = false,
  emptyMessage = "No data available.",
  enableSearch = true,
  enablePagination = true,
  enableSorting = true,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  // Filter data based on search
  const filteredData = enableSearch && searchTerm
    ? data.filter(row => {
        return columns.some(column => {
          if (!column.searchable) return false

          let value: any
          if (column.accessorFn) {
            value = column.accessorFn(row)
          } else if (column.accessorKey) {
            value = row[column.accessorKey]
          }

          if (value === null || value === undefined) return false

          return String(value)
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        })
      })
    : data

  // Sort data
  const sortedData = enableSorting && sortColumn && sortDirection
    ? [...filteredData].sort((a, b) => {
        const column = columns.find(col => col.id === sortColumn)
        if (!column) return 0

        let aValue: any, bValue: any

        if (column.accessorFn) {
          aValue = column.accessorFn(a)
          bValue = column.accessorFn(b)
        } else if (column.accessorKey) {
          aValue = a[column.accessorKey]
          bValue = b[column.accessorKey]
        }

        // Handle null/undefined values
        if (aValue === null || aValue === undefined) aValue = ''
        if (bValue === null || bValue === undefined) bValue = ''

        // Handle dates
        if (aValue instanceof Date && bValue instanceof Date) {
          return sortDirection === 'asc'
            ? aValue.getTime() - bValue.getTime()
            : bValue.getTime() - aValue.getTime()
        }

        // Handle strings and numbers
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue)
        }

        // Handle numbers
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
        }

        // Fallback to string comparison
        const aStr = String(aValue)
        const bStr = String(bValue)
        return sortDirection === 'asc'
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr)
      })
    : filteredData

  // Paginate data
  const totalPages = enablePagination ? Math.ceil(sortedData.length / pageSize) : 1
  const paginatedData = enablePagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData

  const handleSort = (columnId: string) => {
    if (!enableSorting) return

    const column = columns.find(col => col.id === columnId)
    if (!column?.sortable) return

    if (sortColumn === columnId) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortColumn(null)
      } else {
        setSortDirection('asc')
      }
    } else {
      setSortColumn(columnId)
      setSortDirection('asc')
    }
  }

  const renderSortIcon = (columnId: string) => {
    if (!enableSorting || sortColumn !== columnId) {
      return <ArrowUpDown className="h-4 w-4 opacity-50" />
    }

    if (sortDirection === 'asc') {
      return <ArrowUp className="h-4 w-4" />
    } else if (sortDirection === 'desc') {
      return <ArrowDown className="h-4 w-4" />
    }

    return <ArrowUpDown className="h-4 w-4 opacity-50" />
  }

  const getCellValue = (column: DataTableColumn<T>, row: T) => {
    let value: any
    if (column.accessorFn) {
      value = column.accessorFn(row)
    } else if (column.accessorKey) {
      value = row[column.accessorKey]
    }

    if (column.cell) {
      return column.cell(value, row)
    }

    if (value === null || value === undefined) {
      return <span className="text-gray-400">-</span>
    }

    if (value instanceof Date) {
      return value.toLocaleString()
    }

    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Yes' : 'No'}
        </Badge>
      )
    }

    if (Array.isArray(value)) {
      return value.join(', ')
    }

    return String(value)
  }

  if (loading) {
    return (
      <Card>
        {title && (
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4" />
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      {(title || enableSearch || onExport) && (
        <CardHeader>
          <div className="flex items-center justify-between">
            {title && <CardTitle>{title}</CardTitle>}
            <div className="flex items-center gap-2">
              {enableSearch && (
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1) // Reset to first page when searching
                    }}
                    className="pl-10 w-64"
                  />
                </div>
              )}
              {onExport && paginatedData.length > 0 && (
                <Button variant="outline" size="sm" onClick={onExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent>
        {paginatedData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead
                      key={column.id}
                      style={{ width: column.width }}
                      className={enableSorting && column.sortable ? 'cursor-pointer select-none' : ''}
                      onClick={() => handleSort(column.id)}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{column.header}</span>
                        {enableSorting && column.sortable && renderSortIcon(column.id)}
                      </div>
                    </TableHead>
                  ))}
                  {onRowClick && (
                    <TableHead className="w-[50px]">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row, index) => (
                  <TableRow
                    key={index}
                    className={onRowClick ? 'cursor-pointer' : ''}
                    onClick={() => onRowClick?.(row)}
                  >
                    {columns.map((column) => (
                      <TableCell key={column.id}>
                        {getCellValue(column, row)}
                      </TableCell>
                    ))}
                    {onRowClick && (
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {enablePagination && totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(1)}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center space-x-1">
                    <span className="text-sm">Page</span>
                    <Badge variant="outline" className="px-2 py-1">
                      {currentPage} of {totalPages}
                    </Badge>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}