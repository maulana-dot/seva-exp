import { useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import { AuditService } from '@/features/audit/services/audit.service'

/**
 * Custom hook for automatic activity tracking
 * This hook automatically tracks page visits and can be extended for other activities
 */
export function useAuditTracker() {
  const { user } = useAuth()
  const location = useLocation()

  // Track page visits
  useEffect(() => {
    if (user) {
      const pageTitle = document.title
      const pagePath = location.pathname + location.search

      // Don't track authentication pages for logged-in users
      if (!pagePath.includes('/auth/')) {
        AuditService.logPageVisited(user.id, user.email, pagePath, pageTitle)
      }

      // Track specific important page accesses
      if (pagePath === '/' || pagePath === '/dashboard') {
        AuditService.logDashboardAccessed(user.id, user.email)
      } else if (pagePath.includes('/users') || pagePath.includes('/audit-logs')) {
        AuditService.logAdminPanelAccessed(user.id, user.email, pagePath.split('/')[1])
      }
    }
  }, [user, location.pathname, location.search])

  // Activity tracking methods that components can call
  const trackFormCreated = useCallback((formId: string, formTitle: string) => {
    if (user) {
      AuditService.logFormCreated(user.id, user.email, formId, formTitle)
    }
  }, [user])

  const trackFormUpdated = useCallback((formId: string, formTitle: string, changes: Record<string, unknown>) => {
    if (user) {
      AuditService.logFormUpdated(user.id, user.email, formId, formTitle, changes)
    }
  }, [user])

  const trackFormDeleted = useCallback((formId: string, formTitle: string) => {
    if (user) {
      AuditService.logFormDeleted(user.id, user.email, formId, formTitle)
    }
  }, [user])

  const trackFormViewed = useCallback((formId: string, formTitle: string) => {
    if (user) {
      AuditService.logFormViewed(user.id, user.email, formId, formTitle)
    }
  }, [user])

  const trackFormSubmitted = useCallback((formId: string, formTitle: string, submissionId: string) => {
    if (user) {
      AuditService.logFormSubmitted(user.id, user.email, formId, formTitle, submissionId)
    }
  }, [user])

  const trackUserProfileViewed = useCallback((viewedUserId: string, viewedUserEmail: string) => {
    if (user) {
      AuditService.logProfileViewed(user.id, user.email, viewedUserId, viewedUserEmail)
    }
  }, [user])

  const trackDataExport = useCallback((exportType: string, recordCount?: number) => {
    if (user) {
      AuditService.logDataExported(user.id, user.email, exportType, recordCount)
    }
  }, [user])

  const trackDataImport = useCallback((importType: string, recordCount?: number) => {
    if (user) {
      AuditService.logDataImported(user.id, user.email, importType, recordCount)
    }
  }, [user])

  const trackUnauthorizedAccess = useCallback((attemptedResource: string, requiredRole?: string) => {
    if (user) {
      AuditService.logUnauthorizedAccess(user.id, user.email, attemptedResource, requiredRole)
    }
  }, [user])

  const trackSuspiciousActivity = useCallback((activityType: string, description: string) => {
    if (user) {
      AuditService.logSuspiciousActivity(user.id, user.email, activityType, description)
    }
  }, [user])

  return {
    trackFormCreated,
    trackFormUpdated,
    trackFormDeleted,
    trackFormViewed,
    trackFormSubmitted,
    trackUserProfileViewed,
    trackDataExport,
    trackDataImport,
    trackUnauthorizedAccess,
    trackSuspiciousActivity,
  }
}

/**
 * Hook for tracking user session activities
 * Tracks session duration, activity level, etc.
 */
export function useSessionTracker() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) return

    let activityTimer: NodeJS.Timeout
    let idleTimer: NodeJS.Timeout
    let isIdle = false

    const trackActivity = () => {
      if (isIdle) {
        // User became active again
        isIdle = false
      }

      // Reset idle timer
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => {
        if (!isIdle) {
          isIdle = true
          // Could track idle state if needed
        }
      }, 15 * 60 * 1000) // 15 minutes
    }

    const trackUserActivity = () => {
      trackActivity()
    }

    // Track mouse movement, clicks, and keyboard activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(event => {
      document.addEventListener(event, trackUserActivity, true)
    })

    // Track when user leaves the page
    const handleBeforeUnload = () => {
      // Could track session end time, but logout is better tracked in auth service
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      clearTimeout(idleTimer)
      events.forEach(event => {
        document.removeEventListener(event, trackUserActivity, true)
      })
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [user])
}