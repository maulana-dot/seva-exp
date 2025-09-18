import { Outlet } from 'react-router-dom'
import { Suspense } from 'react'

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Digital Asset Management</h1>
          <p className="mt-2 text-gray-600">Manage your organization's assets efficiently</p>
        </div>
        <Suspense
          fallback={
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </div>
    </div>
  )
}