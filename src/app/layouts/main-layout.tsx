import { Outlet } from 'react-router-dom'
import { Suspense } from 'react'
import { Navigation } from './navigation'
import { useAuditTracker, useSessionTracker } from '@/features/audit/hooks/use-audit-tracker'

export function MainLayout() {
  // Enable automatic activity tracking
  useAuditTracker()
  useSessionTracker()

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  )
}