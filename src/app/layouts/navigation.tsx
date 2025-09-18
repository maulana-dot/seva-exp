import { Link, useLocation } from 'react-router-dom'
import { Avatar } from '@/components/ui/avatar'
import { DropdownMenu, DropdownTrigger, DropdownContent, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import { usePermissions } from '@/features/authentication/hooks/use-permissions'
import { LogOut, LayoutDashboard, Users, User, Settings, ChevronDown, Activity, FileText, Database } from 'lucide-react'

export function Navigation() {
  const { user, logout } = useAuth()
  const { canManageUsers, isAdmin } = usePermissions()
  const location = useLocation()

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-2 rounded-lg">
                <Database className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold text-gray-900">Seva</span>
            </Link>

            <div className="flex space-x-1">
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

              {canManageUsers && (
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

              {isAdmin && (
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

                <DropdownItem onClick={() => console.log('Settings clicked')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
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