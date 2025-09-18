import { useQuery } from '@tanstack/react-query'
import { AuditService } from '../services/audit.service'
import type { AuditLog } from '@/entities/audit/audit.types'

interface UseAuditLogsOptions {
  userId?: string
  resourceType?: 'form' | 'user' | 'auth' | 'navigation' | 'system' | 'security'
  resourceId?: string
  limitCount?: number
  startDate?: Date
  endDate?: Date
  action?: string
}

export function useAuditLogs(options?: UseAuditLogsOptions) {
  return useQuery({
    queryKey: ['audit-logs', options],
    queryFn: () => AuditService.getAuditLogs(options),
    staleTime: 30 * 1000, // 30 seconds
  })
}

export function useRecentAuditLogs(limit = 50) {
  return useAuditLogs({ limitCount: limit })
}

export function useUserAuditLogs(userId: string, limit = 50) {
  return useAuditLogs({ userId, limitCount: limit })
}

export function useFormAuditLogs(formId: string, limit = 50) {
  return useAuditLogs({ resourceType: 'form', resourceId: formId, limitCount: limit })
}

export function useAuthAuditLogs(limit = 50) {
  return useAuditLogs({ resourceType: 'auth', limitCount: limit })
}