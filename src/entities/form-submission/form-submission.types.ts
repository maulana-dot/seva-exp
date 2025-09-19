export interface FormSubmission {
  id: string
  formId: string
  formTitle: string
  submissionData: Record<string, unknown>
  submittedBy?: string // User ID if authenticated
  submittedByDepartment?: string // User's department
  submittedAt: Date
  ipAddress?: string
  userAgent?: string
}

export interface CreateFormSubmissionInput {
  formId: string
  formTitle: string
  submissionData: Record<string, unknown>
  submittedBy?: string
  submittedByDepartment?: string
  ipAddress?: string
  userAgent?: string
}

export interface FormSubmissionFilters {
  formId?: string
  submittedBy?: string
  submittedByDepartment?: string
  startDate?: Date
  endDate?: Date
}