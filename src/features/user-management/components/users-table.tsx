import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { UserForm } from './user-form'
import { useUpdateUser, useActivateUser, useDeactivateUser, useDeleteUser } from '../hooks/use-user-management'
import { usePermissions } from '@/features/authentication/hooks/use-permissions'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import { format } from 'date-fns'
import { Edit, UserCheck, UserX, Trash2, Shield, Users, Building, Calendar } from 'lucide-react'
import type { UserManagementUser, UpdateUserInput } from '../services/user-management.service'

interface UsersTableProps {
  users: UserManagementUser[]
  isLoading?: boolean
}

const columnHelper = createColumnHelper<UserManagementUser>()

export function UsersTable({ users, isLoading }: UsersTableProps) {
  const [globalFilter, setGlobalFilter] = useState('')
  const [editingUser, setEditingUser] = useState<UserManagementUser | null>(null)

  const { user: currentUser } = useAuth()
  const { canManageAllUsers } = usePermissions()
  const updateUserMutation = useUpdateUser()
  const activateUserMutation = useActivateUser()
  const deactivateUserMutation = useDeactivateUser()
  const deleteUserMutation = useDeleteUser()

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'manager': return 'bg-blue-100 text-blue-800'
      case 'user': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield
      case 'manager': return Users
      case 'user': return Building
      default: return Users
    }
  }

  const handleUpdateUser = (data: any) => {
    if (!editingUser) return

    const updateData: UpdateUserInput = {
      id: editingUser.id,
      displayName: data.displayName,
      role: data.role,
      department: data.department || undefined,
      isActive: data.isActive,
    }

    updateUserMutation.mutate(updateData, {
      onSuccess: () => {
        setEditingUser(null)
      },
    })
  }

  const handleActivateUser = (user: UserManagementUser) => {
    if (window.confirm(`Are you sure you want to activate ${user.email}?`)) {
      activateUserMutation.mutate(user.id)
    }
  }

  const handleDeactivateUser = (user: UserManagementUser) => {
    if (window.confirm(`Are you sure you want to deactivate ${user.email}? They will no longer be able to access the system.`)) {
      deactivateUserMutation.mutate(user.id)
    }
  }

  const handleDeleteUser = (user: UserManagementUser) => {
    if (window.confirm(`Are you sure you want to delete ${user.email}? This action cannot be undone. Make sure to reassign or delete any assets this user has created first.`)) {
      deleteUserMutation.mutate(user.id)
    }
  }

  const columns = [
    columnHelper.accessor('email', {
      header: 'User',
      cell: (info) => {
        const user = info.row.original
        return (
          <div>
            <div className="font-medium">{user.displayName || 'No name'}</div>
            <div className="text-sm text-gray-600">{user.email}</div>
          </div>
        )
      },
    }),
    columnHelper.accessor('role', {
      header: 'Role',
      cell: (info) => {
        const role = info.getValue()
        const Icon = getRoleIcon(role)
        return (
          <Badge className={getRoleColor(role)}>
            <Icon className="h-3 w-3 mr-1" />
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Badge>
        )
      },
    }),
    columnHelper.accessor('department', {
      header: 'Department',
      cell: (info) => info.getValue() || 'Not specified',
    }),
    columnHelper.accessor('assetsCount', {
      header: 'Assets',
      cell: (info) => (
        <div className="text-center">
          {info.getValue() || 0}
        </div>
      ),
    }),
    columnHelper.accessor('isActive', {
      header: 'Status',
      cell: (info) => (
        <Badge className={info.getValue() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
          {info.getValue() ? 'Active' : 'Inactive'}
        </Badge>
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: 'Joined',
      cell: (info) => (
        <div className="text-sm">
          <div>{format(info.getValue(), 'MMM dd, yyyy')}</div>
          <div className="text-gray-500">{format(info.getValue(), 'HH:mm')}</div>
        </div>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => {
        const user = info.row.original
        const isCurrentUser = currentUser?.id === user.id

        if (!canManageAllUsers) return null

        return (
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditingUser(user)}
              disabled={isCurrentUser}
            >
              <Edit className="h-4 w-4" />
            </Button>

            {user.isActive ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeactivateUser(user)}
                disabled={isCurrentUser}
                className="text-yellow-600 hover:text-yellow-700"
              >
                <UserX className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleActivateUser(user)}
                className="text-green-600 hover:text-green-700"
              >
                <UserCheck className="h-4 w-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteUser(user)}
              disabled={isCurrentUser || user.assetsCount! > 0}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    }),
  ]

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: 'includesString',
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading users...</div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search users..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b bg-gray-50">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-sm font-medium text-gray-900"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {table.getRowModel().rows.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No users found
          </div>
        )}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <UserForm
              user={editingUser}
              onSubmit={handleUpdateUser}
              isSubmitting={updateUserMutation.isPending}
              submitLabel="Update User"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}