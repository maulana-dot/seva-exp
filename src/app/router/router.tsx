import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from '@/app/layouts/main-layout'
import { AuthLayout } from '@/app/layouts/auth-layout'
import { ProtectedRoute } from './protected-route'

// Lazy load components for better performance
import { lazy } from 'react'

const LoginPage = lazy(() => import('@/features/authentication/components/login-page'))
const RegisterPage = lazy(() => import('@/features/authentication/components/register-page'))
const DashboardPage = lazy(() => import('@/features/dashboard/components/dashboard-page'))
const UserManagementPage = lazy(() => import('@/features/user-management/components/user-management-page'))
const AuditLogsPage = lazy(() => import('@/features/audit/components/audit-logs-page'))
const FormBuilderPage = lazy(() => import('@/features/form-builder/components/form-builder-page'))
const FormsListPage = lazy(() => import('@/features/form-builder/components/forms-list-page'))
const FormViewPage = lazy(() => import('@/features/form-builder/components/form-view-page'))
const FormDetailPage = lazy(() => import('@/features/form-builder/components/form-detail-page'))
const FormSubmissionsPage = lazy(() => import('@/features/form-builder/components/form-submissions-page'))
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
        path: 'users',
        element: (
          <ProtectedRoute>
            <UserManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'audit-logs',
        element: (
          <ProtectedRoute requiredRole="admin">
            <AuditLogsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'forms',
        element: (
          <ProtectedRoute>
            <FormsListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'forms/:formId',
        element: (
          <ProtectedRoute>
            <FormViewPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'forms/:formId/detail',
        element: (
          <ProtectedRoute>
            <FormDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'forms/:formId/submissions',
        element: (
          <ProtectedRoute>
            <FormSubmissionsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'form-builder/new',
        element: (
          <ProtectedRoute>
            <FormBuilderPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'form-builder/:formId',
        element: (
          <ProtectedRoute>
            <FormBuilderPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'form-builder/:formId/edit',
        element: (
          <ProtectedRoute>
            <FormBuilderPage />
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