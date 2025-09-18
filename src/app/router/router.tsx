import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from '@/app/layouts/main-layout'
import { AuthLayout } from '@/app/layouts/auth-layout'
import { ProtectedRoute } from './protected-route'

// Lazy load components for better performance
import { lazy } from 'react'

const LoginPage = lazy(() => import('@/features/authentication/components/login-page'))
const RegisterPage = lazy(() => import('@/features/authentication/components/register-page'))
const DashboardPage = lazy(() => import('@/features/dashboard/components/dashboard-page'))
const AssetsPage = lazy(() => import('@/features/assets/components/assets-page'))
const AssetDetailsPage = lazy(() => import('@/features/assets/components/asset-detail-page'))
const UserManagementPage = lazy(() => import('@/features/user-management/components/user-management-page'))
const AdminSetupPage = lazy(() => import('@/features/admin-setup/components/admin-setup-page'))

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'assets',
        element: (
          <ProtectedRoute>
            <AssetsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'assets/:id',
        element: (
          <ProtectedRoute>
            <AssetDetailsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'users',
        element: (
          <ProtectedRoute>
            <UserManagementPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
    ],
  },
  {
    path: '/admin-setup',
    element: <AdminSetupPage />,
  },
])