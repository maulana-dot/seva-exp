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
  Search,
  Eye,
  LogIn,
  LogOut,
  UserPlus,
  Edit,
  Trash2,
  RefreshCw,
  FileText,
  Navigation,
  Settings,
  AlertTriangle,
  Lock,
  Unlock,
  UserCheck,
  UserX,
  Upload,
  Download
} from 'lucide-react'
import type { AuditLog, AuditAction } from '@/entities/audit/audit.types'

const ACTION_ICONS: Record<AuditAction, typeof Activity> = {
  // Authentication
  'auth.login': LogIn,
  'auth.logout': LogOut,
  'auth.failed_login': Shield,
  'auth.register': UserPlus,
  'auth.password_reset_requested': RefreshCw,
  'auth.password_reset_completed': RefreshCw,
  'auth.session_expired': LogOut,

  // User management
  'user.created': UserPlus,
  'user.updated': Edit,
  'user.deleted': Trash2,
  'user.role_changed': Shield,
  'user.activated': UserCheck,
  'user.deactivated': UserX,
  'user.profile_viewed': Eye,
  'user.permissions_changed': Shield,

  // Form actions
  'form.created': FileText,
  'form.updated': Edit,
  'form.deleted': Trash2,
  'form.published': Upload,
  'form.unpublished': Download,
  'form.viewed': Eye,
  'form.submitted': Upload,
  'form.submission_viewed': Eye,
  'form.submission_updated': Edit,
  'form.submission_deleted': Trash2,
  'form.exported': Download,

  // Navigation
  'navigation.page_visited': Navigation,
  'navigation.dashboard_accessed': Activity,
  'navigation.admin_panel_accessed': Shield,

  // System
  'system.data_exported': Download,
  'system.data_imported': Upload,
  'system.settings_changed': Settings,
  'system.maintenance_performed': RefreshCw,
  'system.backup_created': Upload,
  'system.backup_restored': Download,

  // Security
  'security.unauthorized_access_attempt': AlertTriangle,
  'security.suspicious_activity_detected': AlertTriangle,
  'security.account_locked': Lock,
  'security.account_unlocked': Unlock,
  'security.two_factor_enabled': Shield,
  'security.two_factor_disabled': Shield,
}

const ACTION_COLORS: Record<AuditAction, string> = {
  // Authentication
  'auth.login': 'bg-green-100 text-green-800',
  'auth.logout': 'bg-gray-100 text-gray-800',
  'auth.failed_login': 'bg-red-100 text-red-800',
  'auth.register': 'bg-green-100 text-green-800',
  'auth.password_reset_requested': 'bg-yellow-100 text-yellow-800',
  'auth.password_reset_completed': 'bg-blue-100 text-blue-800',
  'auth.session_expired': 'bg-orange-100 text-orange-800',

  // User management
  'user.created': 'bg-green-100 text-green-800',
  'user.updated': 'bg-blue-100 text-blue-800',
  'user.deleted': 'bg-red-100 text-red-800',
  'user.role_changed': 'bg-orange-100 text-orange-800',
  'user.activated': 'bg-green-100 text-green-800',
  'user.deactivated': 'bg-red-100 text-red-800',
  'user.profile_viewed': 'bg-gray-100 text-gray-800',
  'user.permissions_changed': 'bg-orange-100 text-orange-800',

  // Form actions
  'form.created': 'bg-green-100 text-green-800',
  'form.updated': 'bg-blue-100 text-blue-800',
  'form.deleted': 'bg-red-100 text-red-800',
  'form.published': 'bg-green-100 text-green-800',
  'form.unpublished': 'bg-yellow-100 text-yellow-800',
  'form.viewed': 'bg-gray-100 text-gray-800',
  'form.submitted': 'bg-blue-100 text-blue-800',
  'form.submission_viewed': 'bg-gray-100 text-gray-800',
  'form.submission_updated': 'bg-blue-100 text-blue-800',
  'form.submission_deleted': 'bg-red-100 text-red-800',
  'form.exported': 'bg-purple-100 text-purple-800',

  // Navigation
  'navigation.page_visited': 'bg-gray-100 text-gray-800',
  'navigation.dashboard_accessed': 'bg-blue-100 text-blue-800',
  'navigation.admin_panel_accessed': 'bg-orange-100 text-orange-800',

  // System
  'system.data_exported': 'bg-purple-100 text-purple-800',
  'system.data_imported': 'bg-blue-100 text-blue-800',
  'system.settings_changed': 'bg-yellow-100 text-yellow-800',
  'system.maintenance_performed': 'bg-yellow-100 text-yellow-800',
  'system.backup_created': 'bg-green-100 text-green-800',
  'system.backup_restored': 'bg-blue-100 text-blue-800',

  // Security
  'security.unauthorized_access_attempt': 'bg-red-100 text-red-800',
  'security.suspicious_activity_detected': 'bg-red-100 text-red-800',
  'security.account_locked': 'bg-red-100 text-red-800',
  'security.account_unlocked': 'bg-green-100 text-green-800',
  'security.two_factor_enabled': 'bg-green-100 text-green-800',
  'security.two_factor_disabled': 'bg-yellow-100 text-yellow-800',
}

function getActionDisplayName(action: AuditAction): string {
  const names: Record<AuditAction, string> = {
    // Authentication
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.failed_login': 'Failed Login',
    'auth.register': 'Registration',
    'auth.password_reset_requested': 'Password Reset Requested',
    'auth.password_reset_completed': 'Password Reset Completed',
    'auth.session_expired': 'Session Expired',

    // User management
    'user.created': 'User Created',
    'user.updated': 'User Updated',
    'user.deleted': 'User Deleted',
    'user.role_changed': 'Role Changed',
    'user.activated': 'User Activated',
    'user.deactivated': 'User Deactivated',
    'user.profile_viewed': 'Profile Viewed',
    'user.permissions_changed': 'Permissions Changed',

    // Form actions
    'form.created': 'Form Created',
    'form.updated': 'Form Updated',
    'form.deleted': 'Form Deleted',
    'form.published': 'Form Published',
    'form.unpublished': 'Form Unpublished',
    'form.viewed': 'Form Viewed',
    'form.submitted': 'Form Submitted',
    'form.submission_viewed': 'Submission Viewed',
    'form.submission_updated': 'Submission Updated',
    'form.submission_deleted': 'Submission Deleted',
    'form.exported': 'Form Data Exported',

    // Navigation
    'navigation.page_visited': 'Page Visited',
    'navigation.dashboard_accessed': 'Dashboard Accessed',
    'navigation.admin_panel_accessed': 'Admin Panel Accessed',

    // System
    'system.data_exported': 'Data Exported',
    'system.data_imported': 'Data Imported',
    'system.settings_changed': 'Settings Changed',
    'system.maintenance_performed': 'Maintenance Performed',
    'system.backup_created': 'Backup Created',
    'system.backup_restored': 'Backup Restored',

    // Security
    'security.unauthorized_access_attempt': 'Unauthorized Access',
    'security.suspicious_activity_detected': 'Suspicious Activity',
    'security.account_locked': 'Account Locked',
    'security.account_unlocked': 'Account Unlocked',
    'security.two_factor_enabled': '2FA Enabled',
    'security.two_factor_disabled': '2FA Disabled',
  }
  return names[action]
}

function getActionDescription(log: AuditLog): string {
  switch (log.action) {
    // Authentication
    case 'auth.login':
      const method = log.details.loginMethod ? ` via ${log.details.loginMethod}` : ''
      return `Logged in to the system${method}`
    case 'auth.logout':
      return `Logged out of the system`
    case 'auth.failed_login':
      return `Failed login attempt: ${log.details.reason || 'Unknown error'}`
    case 'auth.register':
      return `Registered new account via ${log.details.method || 'email'}`
    case 'auth.password_reset_requested':
      return `Requested password reset`
    case 'auth.password_reset_completed':
      return `Completed password reset`
    case 'auth.session_expired':
      return `Session expired`

    // User management
    case 'user.created':
      return `Created user account for ${log.details.newUserEmail || 'Unknown'} with role ${log.details.role || 'user'}`
    case 'user.updated':
      return `Updated user ${log.details.targetUserEmail || 'Unknown'}`
    case 'user.deleted':
      return `Deleted user ${log.details.deletedUserEmail || 'Unknown'}`
    case 'user.role_changed':
      return `Changed user ${log.details.targetUserEmail || 'Unknown'} role from ${log.details.oldRole} to ${log.details.newRole}`
    case 'user.activated':
      return `Activated user account`
    case 'user.deactivated':
      return `Deactivated user account`
    case 'user.profile_viewed':
      return `Viewed profile of ${log.details.viewedUserEmail || 'Unknown'}`
    case 'user.permissions_changed':
      return `Changed permissions for user`

    // Form actions
    case 'form.created':
      return `Created form "${log.details.formTitle || 'Unknown'}"`
    case 'form.updated':
      return `Updated form "${log.details.formTitle || 'Unknown'}"`
    case 'form.deleted':
      return `Deleted form "${log.details.formTitle || 'Unknown'}"`
    case 'form.published':
      return `Published form "${log.details.formTitle || 'Unknown'}"`
    case 'form.unpublished':
      return `Unpublished form "${log.details.formTitle || 'Unknown'}"`
    case 'form.viewed':
      return `Viewed form "${log.details.formTitle || 'Unknown'}"`
    case 'form.submitted':
      return `Submitted form "${log.details.formTitle || 'Unknown'}"`
    case 'form.submission_viewed':
      return `Viewed form submission`
    case 'form.submission_updated':
      return `Updated form submission`
    case 'form.submission_deleted':
      return `Deleted form submission`
    case 'form.exported':
      return `Exported form data`

    // Navigation
    case 'navigation.page_visited':
      return `Visited ${log.details.pageTitle || log.details.pagePath || 'page'}`
    case 'navigation.dashboard_accessed':
      return `Accessed dashboard`
    case 'navigation.admin_panel_accessed':
      return `Accessed admin panel${log.details.section ? ` (${log.details.section})` : ''}`

    // System
    case 'system.data_exported':
      const exportCount = log.details.recordCount ? ` (${log.details.recordCount} records)` : ''
      return `Exported ${log.details.exportType || 'data'}${exportCount}`
    case 'system.data_imported':
      const importCount = log.details.recordCount ? ` (${log.details.recordCount} records)` : ''
      return `Imported ${log.details.importType || 'data'}${importCount}`
    case 'system.settings_changed':
      return `Changed setting "${log.details.settingKey || 'Unknown'}" from "${log.details.oldValue}" to "${log.details.newValue}"`
    case 'system.maintenance_performed':
      return `Performed system maintenance`
    case 'system.backup_created':
      return `Created system backup`
    case 'system.backup_restored':
      return `Restored system backup`

    // Security
    case 'security.unauthorized_access_attempt':
      return `Attempted to access ${log.details.attemptedResource || 'protected resource'}${log.details.requiredRole ? ` (requires ${log.details.requiredRole} role)` : ''}`
    case 'security.suspicious_activity_detected':
      return `Suspicious activity detected: ${log.details.description || 'Unknown activity'}`
    case 'security.account_locked':
      return `Account locked`
    case 'security.account_unlocked':
      return `Account unlocked`
    case 'security.two_factor_enabled':
      return `Enabled two-factor authentication`
    case 'security.two_factor_disabled':
      return `Disabled two-factor authentication`

    default:
      return `Performed ${log.action}`
  }
}

export default function AuditLogsPage() {
  const [filter, setFilter] = useState<'all' | 'auth' | 'forms' | 'users' | 'navigation' | 'system' | 'security'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const { data: allLogs = [], isLoading: allLoading, refetch: refetchAll } = useRecentAuditLogs(200)
  const { data: authLogs = [], isLoading: authLoading, refetch: refetchAuth } = useAuthAuditLogs(100)

  const isLoading = allLoading || authLoading

  const displayLogs = filter === 'auth' ? authLogs : allLogs

  const filteredLogs = displayLogs.filter(log => {
    if (filter === 'auth' && log.resourceType !== 'auth') return false
    if (filter === 'forms' && log.resourceType !== 'form') return false
    if (filter === 'users' && log.resourceType !== 'user') return false
    if (filter === 'navigation' && log.resourceType !== 'navigation') return false
    if (filter === 'system' && log.resourceType !== 'system') return false
    if (filter === 'security' && log.resourceType !== 'security') return false

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
                variant={filter === 'forms' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('forms')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Forms
              </Button>
              <Button
                variant={filter === 'security' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('security')}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Security
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
                <p className="text-sm font-medium text-gray-600">Form Activities</p>
                <p className="text-2xl font-bold">
                  {allLogs.filter(log => log.resourceType === 'form').length}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
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
                        {log.metadata?.deviceType && (
                          <span>Device: {log.metadata.deviceType}</span>
                        )}
                        {log.metadata?.sessionId && (
                          <span>Session: {log.metadata.sessionId.slice(-8)}</span>
                        )}
                        {log.metadata?.location && (
                          <span>Path: {log.metadata.location}</span>
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