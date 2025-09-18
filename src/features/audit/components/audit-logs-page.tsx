import { useState } from 'react'
import { useRecentAuditLogs, useAuthAuditLogs } from '../hooks/use-audit-logs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { formatDateTime } from '@/utils/date-format'
import {
  Activity,
  Shield,
  Users,
  Package,
  Search,
  Filter,
  Eye,
  LogIn,
  LogOut,
  UserPlus,
  Edit,
  Trash2,
  RefreshCw
} from 'lucide-react'
import type { AuditLog, AuditAction } from '@/entities/audit/audit.types'

const ACTION_ICONS: Record<AuditAction, typeof Activity> = {
  'asset.created': Package,
  'asset.updated': Edit,
  'asset.deleted': Trash2,
  'asset.status_changed': RefreshCw,
  'asset.owner_changed': Users,
  'user.created': UserPlus,
  'user.updated': Edit,
  'user.role_changed': Shield,
  'auth.login': LogIn,
  'auth.logout': LogOut,
  'auth.failed_login': Shield,
}

const ACTION_COLORS: Record<AuditAction, string> = {
  'asset.created': 'bg-green-100 text-green-800',
  'asset.updated': 'bg-blue-100 text-blue-800',
  'asset.deleted': 'bg-red-100 text-red-800',
  'asset.status_changed': 'bg-yellow-100 text-yellow-800',
  'asset.owner_changed': 'bg-purple-100 text-purple-800',
  'user.created': 'bg-green-100 text-green-800',
  'user.updated': 'bg-blue-100 text-blue-800',
  'user.role_changed': 'bg-orange-100 text-orange-800',
  'auth.login': 'bg-green-100 text-green-800',
  'auth.logout': 'bg-gray-100 text-gray-800',
  'auth.failed_login': 'bg-red-100 text-red-800',
}

function getActionDisplayName(action: AuditAction): string {
  const names: Record<AuditAction, string> = {
    'asset.created': 'Asset Created',
    'asset.updated': 'Asset Updated',
    'asset.deleted': 'Asset Deleted',
    'asset.status_changed': 'Status Changed',
    'asset.owner_changed': 'Owner Changed',
    'user.created': 'User Created',
    'user.updated': 'User Updated',
    'user.role_changed': 'Role Changed',
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.failed_login': 'Failed Login',
  }
  return names[action]
}

function getActionDescription(log: AuditLog): string {
  switch (log.action) {
    case 'asset.created':
      return `Created asset ${log.details.assetTag || 'Unknown'}`
    case 'asset.updated':
      return `Updated asset ${log.details.assetTag || 'Unknown'}`
    case 'asset.deleted':
      return `Deleted asset ${log.details.assetTag || 'Unknown'}`
    case 'asset.status_changed':
      return `Changed asset ${log.details.assetTag} status from ${log.details.oldStatus} to ${log.details.newStatus}`
    case 'asset.owner_changed':
      return `Changed asset ${log.details.assetTag} owner from ${log.details.oldOwner || 'None'} to ${log.details.newOwner || 'None'}`
    case 'user.created':
      return `Created user account`
    case 'user.updated':
      return `Updated user ${log.details.targetUserEmail || 'Unknown'}`
    case 'user.role_changed':
      return `Changed user role`
    case 'auth.login':
      return `Logged in to the system`
    case 'auth.logout':
      return `Logged out of the system`
    case 'auth.failed_login':
      return `Failed login attempt`
    default:
      return `Performed ${log.action}`
  }
}

export default function AuditLogsPage() {
  const [filter, setFilter] = useState<'all' | 'auth' | 'assets' | 'users'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const { data: allLogs = [], isLoading: allLoading, refetch: refetchAll } = useRecentAuditLogs(200)
  const { data: authLogs = [], isLoading: authLoading, refetch: refetchAuth } = useAuthAuditLogs(100)

  const isLoading = allLoading || authLoading

  const displayLogs = filter === 'auth' ? authLogs : allLogs

  const filteredLogs = displayLogs.filter(log => {
    if (filter === 'assets' && !log.action.startsWith('asset.')) return false
    if (filter === 'users' && !log.action.startsWith('user.')) return false

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        log.userEmail.toLowerCase().includes(searchLower) ||
        getActionDescription(log).toLowerCase().includes(searchLower) ||
        getActionDisplayName(log.action).toLowerCase().includes(searchLower)
      )
    }

    return true
  })

  const handleRefresh = () => {
    refetchAll()
    refetchAuth()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-gray-600">System activity and security logs</p>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-gray-600">System activity and security logs</p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs by user, action, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                <Activity className="h-4 w-4 mr-2" />
                All Logs
              </Button>
              <Button
                variant={filter === 'auth' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('auth')}
              >
                <Shield className="h-4 w-4 mr-2" />
                Authentication
              </Button>
              <Button
                variant={filter === 'assets' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('assets')}
              >
                <Package className="h-4 w-4 mr-2" />
                Assets
              </Button>
              <Button
                variant={filter === 'users' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('users')}
              >
                <Users className="h-4 w-4 mr-2" />
                Users
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Logs</p>
                <p className="text-2xl font-bold">{allLogs.length}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Auth Events</p>
                <p className="text-2xl font-bold">{authLogs.length}</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Asset Changes</p>
                <p className="text-2xl font-bold">
                  {allLogs.filter(log => log.resourceType === 'asset').length}
                </p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">User Actions</p>
                <p className="text-2xl font-bold">
                  {allLogs.filter(log => log.resourceType === 'user').length}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
            <Badge variant="secondary">{filteredLogs.length} logs</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No audit logs found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map((log) => {
                const IconComponent = ACTION_ICONS[log.action]
                return (
                  <div
                    key={log.id}
                    className="flex items-start space-x-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${ACTION_COLORS[log.action]}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {getActionDisplayName(log.action)}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {log.resourceType}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDateTime(log.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">
                        {getActionDescription(log)}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>User: {log.userEmail}</span>
                        {log.metadata?.userAgent && (
                          <span>Device: {log.metadata.userAgent.split(' ')[0]}</span>
                        )}
                        {log.metadata?.ipAddress && log.metadata.ipAddress !== 'unknown' && (
                          <span>IP: {log.metadata.ipAddress}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}