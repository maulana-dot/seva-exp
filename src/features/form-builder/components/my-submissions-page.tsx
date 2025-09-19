import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { useForms } from '../hooks/use-forms'
import { useFormSubmissionsByUser } from '../hooks/use-form-submissions'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import {
  ArrowLeft,
  FileText,
  Eye,
  Calendar,
  User,
  Download
} from 'lucide-react'
import { formatDateTime } from '@/utils/date-format'
import type { FormSubmission } from '@/entities/form-submission/form-submission.types'

export default function MySubmissionsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: forms = [], isLoading: formsLoading } = useForms()
  const { data: submissions = [], isLoading: submissionsLoading } = useFormSubmissionsByUser(user?.firebaseUid || '')

  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null)

  // Get form details for a submission
  const getFormForSubmission = (formId: string) => {
    return forms.find(form => form.id === formId)
  }

  // Define columns for the data table
  const columns: DataTableColumn<FormSubmission>[] = [
    {
      id: 'submittedAt',
      header: 'Submission Date',
      accessorKey: 'submittedAt',
      sortable: true,
      searchable: false,
      cell: (value) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{formatDateTime(value)}</span>
        </div>
      ),
      width: '180px'
    },
    {
      id: 'formTitle',
      header: 'Form',
      accessorKey: 'formTitle',
      sortable: true,
      searchable: true,
      cell: (value) => (
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-medium">{value}</span>
        </div>
      ),
      width: '250px'
    }
  ]

  const formatFieldValue = (value: unknown, fieldType?: string): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (Array.isArray(value)) return value.join(', ')

    // Handle file URLs
    if (fieldType === 'file' && typeof value === 'string' && value.startsWith('http')) {
      try {
        const url = new URL(value)
        const pathParts = url.pathname.split('/')
        const filename = pathParts[pathParts.length - 1]
        const cleanFilename = filename.replace(/^\d+_/, '')
        return cleanFilename || 'Uploaded File'
      } catch {
        return 'Uploaded File'
      }
    }

    return String(value)
  }

  const exportSubmissions = () => {
    if (submissions.length === 0) return

    // Create CSV content
    const csvContent = [
      ['Submission Date', 'Form Title', 'Form Data'].join(','),
      ...submissions.map(submission => [
        `"${submission.submittedAt.toLocaleString()}"`,
        `"${submission.formTitle}"`,
        `"${JSON.stringify(submission.submissionData).replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `my_submissions_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (formsLoading || submissionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading your submissions...</p>
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
                <User className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold">My Submissions</h1>
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
        {/* Submissions Data Table */}
        <DataTable
          data={submissions}
          columns={columns}
          title={`My Form Submissions (${submissions.length})`}
          searchPlaceholder="Search my submissions..."
          pageSize={15}
          onRowClick={setSelectedSubmission}
          onExport={submissions.length > 0 ? exportSubmissions : undefined}
          loading={submissionsLoading}
          emptyMessage={
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No submissions yet
              </h3>
              <p className="text-gray-600 mb-4">
                You haven't submitted any forms yet.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/forms')}
              >
                Browse Forms
              </Button>
            </div>
          }
          enableSearch={true}
          enablePagination={true}
          enableSorting={true}
        />
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
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>{selectedSubmission.formTitle}</span>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6 mt-6">
              {(() => {
                const form = getFormForSubmission(selectedSubmission.formId)
                return form?.fields?.map((field) => {
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
                        {value ? (
                          field.type === 'file' && typeof value === 'string' && value.startsWith('http') ? (
                            <a
                              href={value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline flex items-center space-x-2"
                            >
                              <FileText className="h-4 w-4" />
                              <span>{formatFieldValue(value, field.type)}</span>
                            </a>
                          ) : (
                            formatFieldValue(value, field.type)
                          )
                        ) : (
                          <span className="text-gray-400">No response</span>
                        )}
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}