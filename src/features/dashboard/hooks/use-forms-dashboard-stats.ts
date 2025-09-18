import { useQuery } from '@tanstack/react-query'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'
import { db } from '@/libs/firebase'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import { usePermissions } from '@/features/authentication/hooks/use-permissions'
import type { CustomForm } from '@/entities/form/form.types'
import type { FormSubmission } from '@/entities/form-submission/form-submission.types'
import type { AuditLog } from '@/entities/audit/audit.types'

interface FormsDashboardStats {
  totalForms: number
  totalSubmissions: number
  activeForms: number
  recentForms: CustomForm[]
  recentSubmissions: FormSubmission[]
  recentActivity: AuditLog[]
  formSubmissionDistribution: Record<string, number>
  monthlyGrowth: {
    formsCreated: number
    submissionsReceived: number
  }
  topPerformingForms: Array<{
    formId: string
    formTitle: string
    submissionCount: number
  }>
}

export function useFormsDashboardStats() {
  const { user } = useAuth()
  const { isAdmin, canManageUsers } = usePermissions()

  return useQuery({
    queryKey: ['forms-dashboard-stats', user?.id, isAdmin],
    queryFn: async (): Promise<FormsDashboardStats> => {
      if (!user) throw new Error('User not authenticated')

      const now = new Date()
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      // Fetch forms based on user permissions
      const formsRef = collection(db, 'forms')
      let formsQuery

      if (isAdmin || canManageUsers) {
        // Admins and managers can see all forms
        formsQuery = query(formsRef, orderBy('updatedAt', 'desc'))
      } else {
        // Regular users can only see their own forms
        formsQuery = query(
          formsRef,
          where('createdBy', '==', user.id),
          orderBy('updatedAt', 'desc')
        )
      }

      const formsSnapshot = await getDocs(formsQuery)
      const forms: CustomForm[] = []

      formsSnapshot.forEach((doc) => {
        const data = doc.data()
        forms.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as CustomForm)
      })

      // Fetch form submissions
      const submissionsRef = collection(db, 'formSubmissions')
      const submissionsSnapshot = await getDocs(submissionsRef)
      const submissions: FormSubmission[] = []

      submissionsSnapshot.forEach((doc) => {
        const data = doc.data()
        submissions.push({
          id: doc.id,
          formId: data.formId,
          formTitle: data.formTitle,
          submissionData: data.submissionData,
          submittedBy: data.submittedBy,
          submittedAt: data.submittedAt?.toDate() || new Date(),
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        })
      })

      // Fetch recent audit logs for activity feed
      const auditRef = collection(db, 'audit_logs')
      let auditQuery

      if (isAdmin) {
        // Admins see all activity
        auditQuery = query(
          auditRef,
          orderBy('createdAt', 'desc'),
          limit(10)
        )
      } else {
        // Users see only their activity
        auditQuery = query(
          auditRef,
          where('userId', '==', user.id),
          orderBy('createdAt', 'desc'),
          limit(10)
        )
      }

      const auditSnapshot = await getDocs(auditQuery)
      const auditLogs: AuditLog[] = []

      auditSnapshot.forEach((doc) => {
        const data = doc.data()
        auditLogs.push({
          id: doc.id,
          ...data,
          metadata: {
            ...data.metadata,
            timestamp: data.metadata?.timestamp?.toDate() || new Date(),
          },
          createdAt: data.createdAt?.toDate() || new Date(),
        } as AuditLog)
      })

      // Calculate statistics
      const totalForms = forms.length
      const totalSubmissions = submissions.length
      const activeForms = forms.filter(form => form.isActive).length

      // Recent forms (last 5)
      const recentForms = forms.slice(0, 5)

      // Recent submissions (last 5)
      const recentSubmissions = submissions
        .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime())
        .slice(0, 5)

      // Form submission distribution (submissions per form)
      const formSubmissionDistribution: Record<string, number> = {}
      submissions.forEach(submission => {
        const formTitle = submission.formTitle || 'Unknown Form'
        formSubmissionDistribution[formTitle] = (formSubmissionDistribution[formTitle] || 0) + 1
      })

      // Monthly growth calculation
      const formsCreatedThisMonth = forms.filter(form =>
        form.createdAt >= oneMonthAgo
      ).length

      const submissionsThisMonth = submissions.filter(submission =>
        submission.submittedAt >= oneMonthAgo
      ).length

      // Top performing forms (by submission count)
      const formSubmissionCounts = new Map<string, { title: string, count: number }>()
      submissions.forEach(submission => {
        const existing = formSubmissionCounts.get(submission.formId) || {
          title: submission.formTitle || 'Unknown Form',
          count: 0
        }
        formSubmissionCounts.set(submission.formId, {
          title: existing.title,
          count: existing.count + 1
        })
      })

      const topPerformingForms = Array.from(formSubmissionCounts.entries())
        .map(([formId, { title, count }]) => ({
          formId,
          formTitle: title,
          submissionCount: count
        }))
        .sort((a, b) => b.submissionCount - a.submissionCount)
        .slice(0, 5)

      return {
        totalForms,
        totalSubmissions,
        activeForms,
        recentForms,
        recentSubmissions,
        recentActivity: auditLogs,
        formSubmissionDistribution,
        monthlyGrowth: {
          formsCreated: formsCreatedThisMonth,
          submissionsReceived: submissionsThisMonth,
        },
        topPerformingForms,
      }
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}