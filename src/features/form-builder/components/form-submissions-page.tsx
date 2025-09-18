import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useForm } from '../hooks/use-forms'
import { useFormSubmissionsByForm } from '../hooks/use-form-submissions'
import { usePermissions } from '@/features/authentication/hooks/use-permissions'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import {
  ArrowLeft,
  FileText,
  Eye,
  Calendar,
  User,
  Download,
  Search
} from 'lucide-react'
import type { FormSubmission } from '@/entities/form-submission/form-submission.types'

export default function FormSubmissionsPage() {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { canManageAllForms } = usePermissions()

  const { data: form, isLoading: formLoading } = useForm(formId || '')
  const { data: submissions = [], isLoading: submissionsLoading } = useFormSubmissionsByForm(formId || '')

  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Check permissions
  const canViewSubmissions = canManageAllForms || (form && form.createdBy === user?.firebaseUid)

  const filteredSubmissions = submissions.filter(submission => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()

    // Search in submission data values
    const submissionValues = Object.values(submission.submissionData)
      .filter(value => typeof value === 'string')
      .join(' ')
      .toLowerCase()

    return submissionValues.includes(searchLower) ||
           submission.submittedAt.toLocaleDateString().includes(searchLower)
  })

  const formatFieldValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (Array.isArray(value)) return value.join(', ')
    return String(value)
  }

  const exportSubmissions = () => {
    if (submissions.length === 0) return

    // Get all unique field names from form
    const fieldNames = form?.fields?.map(field => field.label) || []
    const headers = ['Submission Date', 'Submitted By', ...fieldNames]

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...submissions.map(submission => [
        `"${submission.submittedAt.toLocaleString()}"`,
        `"${submission.submittedBy || 'Anonymous'}"`,
        ...fieldNames.map(fieldName => {
          const fieldKey = form?.fields?.find(f => f.label === fieldName)?.id
          const value = fieldKey ? submission.submissionData[fieldKey] : ''
          return `"${formatFieldValue(value).replace(/"/g, '""')}"`
        })
      ].join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${form?.title || 'Form'}_submissions_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (formLoading || submissionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading submissions...</p>
        </div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Form not found</h1>
          <p className="text-gray-600 mb-4">The form you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/forms')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forms
          </Button>
        </div>
      </div>
    )
  }

  if (!canViewSubmissions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to view submissions for this form.</p>
          <Button onClick={() => navigate('/forms')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forms
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/forms')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Forms
              </Button>
              <div className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold">Form Submissions</h1>
              </div>
              <Badge variant="outline">
                {submissions.length} submission{submissions.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              {submissions.length > 0 && (
                <Button variant="outline" onClick={exportSubmissions}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Form Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>{form.title}</span>
              <Badge variant={form.isActive ? 'default' : 'secondary'}>
                {form.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </CardTitle>
            {form.description && (
              <p className="text-gray-600">{form.description}</p>
            )}
          </CardHeader>
        </Card>

        {submissions.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No submissions yet
              </h3>
              <p className="text-gray-600 mb-4">
                This form hasn't received any submissions yet.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate(`/forms/${formId}`)}
              >
                View Form
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Search and Filters */}
            <div className="mb-6 flex items-center space-x-4">
              <div className="relative flex-1 max-w-md">
                <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search submissions..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Submissions List */}
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => (
                <Card key={submission.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{submission.submittedAt.toLocaleString()}</span>
                        </div>
                        {submission.submittedBy && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <User className="h-4 w-4" />
                            <span>User ID: {submission.submittedBy}</span>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedSubmission(submission)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>

                    {/* Preview of submission data */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {form.fields?.slice(0, 6).map((field) => {
                        const value = submission.submissionData[field.id]
                        if (!value) return null

                        return (
                          <div key={field.id} className="space-y-1">
                            <div className="text-sm font-medium text-gray-700">
                              {field.label}
                            </div>
                            <div className="text-sm text-gray-900 truncate">
                              {formatFieldValue(value)}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Submission Details Modal */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
        {selectedSubmission && (
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Submission Details</DialogTitle>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>{selectedSubmission.submittedAt.toLocaleString()}</span>
                </div>
                {selectedSubmission.submittedBy && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>User ID: {selectedSubmission.submittedBy}</span>
                  </div>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-6 mt-6">
              {form.fields?.map((field) => {
                const value = selectedSubmission.submissionData[field.id]

                return (
                  <div key={field.id} className="space-y-2">
                    <div className="font-medium text-gray-900">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </div>
                    {field.description && (
                      <div className="text-sm text-gray-600">{field.description}</div>
                    )}
                    <div className="text-gray-900 bg-gray-50 p-3 rounded-md min-h-[2.5rem] flex items-center">
                      {value ? formatFieldValue(value) : <span className="text-gray-400">No response</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}