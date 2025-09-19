import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Avatar } from '@/components/ui/avatar'
import { DropdownMenu, DropdownTrigger, DropdownContent, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import { usePermissions } from '@/features/authentication/hooks/use-permissions'
import type { UserRole } from '@/entities/user/user.types'
import { LogOut, LayoutDashboard, Users, User, ChevronDown, Activity, FileText, Database, List } from 'lucide-react'

const USER_ROLE_STORAGE_KEY = 'auth:userRole'

export function Navigation() {
  const { user, logout } = useAuth()
  const { canManageUsers, isAdmin } = usePermissions()
  const location = useLocation()
  const [cachedRole, setCachedRole] = useState<UserRole | null>(() => {
    if (typeof window === 'undefined') {
      return null
    }
    const storedRole = window.localStorage.getItem(USER_ROLE_STORAGE_KEY)
    return (storedRole as UserRole | null) ?? null
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (user?.role) {
      setCachedRole(user.role)
      return
    }

    const storedRole = window.localStorage.getItem(USER_ROLE_STORAGE_KEY)
    setCachedRole((storedRole as UserRole | null) ?? null)
  }, [user?.role])

  const effectiveRole = user?.role ?? cachedRole
  const isStandardUser = effectiveRole === 'user'
  const showManagerLinks = effectiveRole === 'manager' || effectiveRole === 'admin'
  const showUsersLink = showManagerLinks && (canManageUsers || effectiveRole === 'manager' || effectiveRole === 'admin')
  const showAuditLink = effectiveRole === 'admin' || isAdmin

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to={isStandardUser ? '/my-submissions' : '/'} className="flex items-center space-x-2">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-2 rounded-lg">
                <Database className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-gray-900">Seva</span>
            </Link>

            <div className="flex space-x-1">
              {showManagerLinks && (
                <Link
                  to="/"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/') && location.pathname === '/'
                      ? 'text-blue-600 bg-blue-50 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              )}

              {showManagerLinks && (
                <Link
                  to="/forms"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/forms') || isActive('/form-builder')
                      ? 'text-blue-600 bg-blue-50 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Forms</span>
                </Link>
              )}

              <Link
                to="/my-submissions"
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/my-submissions')
                    ? 'text-blue-600 bg-blue-50 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <List className="h-4 w-4" />
                <span>My Submissions</span>
              </Link>

              {showUsersLink && (
                <Link
                  to="/users"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/users')
                      ? 'text-blue-600 bg-blue-50 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Users</span>
                </Link>
              )}

              {showAuditLink && (
                <Link
                  to="/audit-logs"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/audit-logs')
                      ? 'text-blue-600 bg-blue-50 border border-blue-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Activity className="h-4 w-4" />
                  <span>Audit Logs</span>
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownTrigger className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <Avatar
                  size="sm"
                  fallback={user?.displayName || user?.email}
                />
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-gray-900">
                    {user?.displayName || 'User'}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {user?.role}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </DropdownTrigger>

              <DropdownContent>
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.displayName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email}
                  </p>
                  {user?.department && (
                    <p className="text-xs text-gray-500">
                      {user.department}
                    </p>
                  )}
                </div>

                <DropdownItem onClick={() => console.log('Profile clicked')}>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownItem>

                <DropdownSeparator />

                <DropdownItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownItem>
              </DropdownContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}
