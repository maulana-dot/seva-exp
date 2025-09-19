import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { useForm } from '../hooks/use-forms'
import { useFormSubmissionsByForm } from '../hooks/use-form-submissions'
import { usePermissions } from '@/features/authentication/hooks/use-permissions'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import { formatDateTime } from '@/utils/date-format'
import {
  ArrowLeft,
  FileText,
  Edit,
  Eye,
  Calendar,
  User,
  Download,
  Users,
  BarChart3,
  Share,
  Settings,
  ExternalLink
} from 'lucide-react'
import type { FormSubmission } from '@/entities/form-submission/form-submission.types'

export default function FormDetailPage() {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { canManageAllForms } = usePermissions()

  const { data: form, isLoading: formLoading } = useForm(formId || '')
  const { data: submissions = [], isLoading: submissionsLoading } = useFormSubmissionsByForm(formId || '')

  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null)

  // Check permissions
  const canViewForm = canManageAllForms || (form && form.createdBy === user?.firebaseUid)
  const canEditForm = canManageAllForms || (form && form.createdBy === user?.firebaseUid)

  const formatFieldValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (Array.isArray(value)) return value.join(', ')
    if (value instanceof Date) return formatDateTime(value)
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
          <span>{formatDateTime(value)}</span>
        </div>
      ),
      width: '180px'
    },
    {
      id: 'submittedBy',
      header: 'Submitted By',
      accessorKey: 'submittedBy',
      sortable: true,
      searchable: true,
      cell: (value) => (
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-gray-400" />
          <span>{value || 'Anonymous'}</span>
        </div>
      ),
      width: '150px'
    }
  ]

  // Add form field columns (show first 3 fields as preview)
  if (form?.fields) {
    form.fields.slice(0, 3).forEach((field, index) => {
      columns.push({
        id: `field_${field.id}`,
        header: field.label,
        accessorFn: (row: FormSubmission) => row.submissionData[field.id],
        sortable: true,
        searchable: true,
        cell: (value) => (
          <div className="max-w-48 truncate" title={formatFieldValue(value)}>
            {formatFieldValue(value)}
          </div>
        )
      })
    })
  }

  if (formLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading form details...</p>
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

  if (!canViewForm) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You don't have permission to view this form.</p>
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
                <h1 className="text-xl font-bold">Form Details</h1>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" asChild>
                <Link to={`/forms/${formId}`}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Form
                </Link>
              </Button>
              {canEditForm && (
                <Button variant="outline" asChild>
                  <Link to={`/form-builder/${formId}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Form
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Form Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-6">
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>{form.title}</span>
                  </CardTitle>
                  <Badge variant={form.isActive ? 'default' : 'secondary'}>
                    {form.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {form.description && (
                  <p className="text-gray-600 mt-4">{form.description}</p>
                )}
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Created</p>
                    <p className="text-sm text-gray-900">{formatDateTime(form.createdAt)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Last Updated</p>
                    <p className="text-sm text-gray-900">{formatDateTime(form.updatedAt)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Fields Count</p>
                    <p className="text-sm text-gray-900">{form.fields?.length || 0} fields</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Total Submissions</p>
                    <p className="text-sm text-gray-900">{submissions.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Responses</p>
                    <p className="text-2xl font-bold text-gray-900">{submissions.length}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">This Month</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {submissions.filter(s => {
                        const monthAgo = new Date()
                        monthAgo.setMonth(monthAgo.getMonth() - 1)
                        return s.submittedAt >= monthAgo
                      }).length}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Unique Users</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {new Set(submissions.map(s => s.submittedBy).filter(Boolean)).size}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Form Fields Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Form Fields ({form.fields?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {!form.fields || form.fields.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No fields defined</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {form.fields.map((field, index) => (
                  <div key={field.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{field.label}</h4>
                      <div className="flex items-center space-x-1">
                        <Badge variant="outline" className="text-xs">
                          {field.type}
                        </Badge>
                        {field.required && (
                          <Badge variant="destructive" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                    </div>
                    {field.description && (
                      <p className="text-xs text-gray-600 truncate">{field.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submissions Data Table */}
        <DataTable
          data={submissions}
          columns={columns}
          title={`Form Submissions (${submissions.length})`}
          searchPlaceholder="Search submissions..."
          pageSize={10}
          onRowClick={setSelectedSubmission}
          onExport={submissions.length > 0 ? exportSubmissions : undefined}
          loading={submissionsLoading}
          emptyMessage="No submissions received yet."
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
                  <span>{formatDateTime(selectedSubmission.submittedAt)}</span>
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