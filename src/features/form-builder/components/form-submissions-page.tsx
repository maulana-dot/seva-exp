import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { useForm } from '../hooks/use-forms'
import { useFormSubmissionsByForm, useFormSubmissions } from '../hooks/use-form-submissions'
import { usePermissions } from '@/features/authentication/hooks/use-permissions'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Download
} from 'lucide-react'
import { formatDateTime } from '@/utils/date-format'
import type { FormSubmission, FormSubmissionFilters } from '@/entities/form-submission/form-submission.types'
import {
  buildSubmissionFieldColumns,
  buildSubmissionFieldInfo,
  collectSubmissionFieldIds,
  formatSubmissionFieldValue,
} from '../utils/submission-table'

export default function FormSubmissionsPage() {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { canManageAllForms, isAdmin } = usePermissions()

  const [departmentFilter, setDepartmentFilter] = useState<string>('all')

  const { data: form, isLoading: formLoading } = useForm(formId || '')

  // Get submissions based on department filter for admins
  const submissionsFilters: FormSubmissionFilters = formId ? { formId } : {}
  if (isAdmin && departmentFilter !== 'all') {
    submissionsFilters.submittedByDepartment = departmentFilter
    delete submissionsFilters.formId // Remove formId when filtering by department
  }

  const { data: allSubmissions = [], isLoading: allSubmissionsLoading } = useFormSubmissions(
    isAdmin && departmentFilter !== 'all' ? submissionsFilters : undefined
  )
  const { data: formSubmissions = [], isLoading: formSubmissionsLoading } = useFormSubmissionsByForm(formId || '')

  // Use appropriate submissions based on filter
  const submissions = isAdmin && departmentFilter !== 'all'
    ? allSubmissions.filter(sub => sub.formId === formId)
    : formSubmissions
  const submissionsLoading = isAdmin && departmentFilter !== 'all' ? allSubmissionsLoading : formSubmissionsLoading

  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null)

  const departmentOptions = [
    { value: 'all', label: 'All Departments' },
    { value: 'ACC', label: 'ACC - Accounting' },
    { value: 'SEVA', label: 'SEVA - Service A' },
    { value: 'TAF', label: 'TAF - Technical Affairs' },
    { value: 'FIF', label: 'FIF - Finance' },
  ]

  // Check permissions
  const canViewSubmissions = canManageAllForms || (form && form.createdBy === user?.firebaseUid)

  const fieldIds = useMemo(() => collectSubmissionFieldIds(submissions), [submissions])
  const fieldInfo = useMemo(
    () => buildSubmissionFieldInfo(form, fieldIds),
    [form, fieldIds]
  )

  const columns: DataTableColumn<FormSubmission>[] = useMemo(() => {
    const baseColumns: DataTableColumn<FormSubmission>[] = [
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
        width: '180px',
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
            <span className="text-sm">{value || 'Anonymous'}</span>
          </div>
        ),
        width: '150px',
      },
    ]

    if (isAdmin) {
      baseColumns.push({
        id: 'submittedByDepartment',
        header: 'Department',
        accessorKey: 'submittedByDepartment',
        sortable: true,
        searchable: true,
        cell: (value) => (
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              {value || 'N/A'}
            </Badge>
          </div>
        ),
        width: '120px',
      })
    }

    const fieldColumns = buildSubmissionFieldColumns(fieldInfo, {
      columnIdPrefix: formId ? `field-${formId}` : 'field',
    })

    return [...baseColumns, ...fieldColumns]
  }, [fieldInfo, formId, isAdmin])

  const exportSubmissions = () => {
    if (submissions.length === 0) return

    const escapeCsv = (value: string) => value.replace(/"/g, '""')

    const headers = [
      'Submission Date',
      'Submitted By',
      ...(isAdmin ? ['Department'] : []),
      ...fieldInfo.map((field) => field.label),
    ]

    const csvContent = [
      headers.join(','),
      ...submissions.map((submission) => {
        const row: string[] = [
          `"${escapeCsv(submission.submittedAt.toLocaleString())}"`,
          `"${escapeCsv(submission.submittedBy || 'Anonymous')}"`,
        ]

        if (isAdmin) {
          row.push(`"${escapeCsv(submission.submittedByDepartment || 'N/A')}"`)
        }

        fieldInfo.forEach((field) => {
          const value = submission.submissionData[field.id]
          const formatted = formatSubmissionFieldValue(value, field.type)
          row.push(`"${escapeCsv(formatted)}"`)
        })

        return row.join(',')
      }),
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
              {isAdmin && (
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {departmentOptions.map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              )}
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

        {/* Submissions Data Table */}
        <DataTable
          data={submissions}
          columns={columns}
          title={`Form Submissions (${submissions.length})`}
          searchPlaceholder="Search submissions..."
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
                This form hasn't received any submissions yet.
              </p>
              <Button
                variant="outline"
                onClick={() => navigate(`/forms/${formId}`)}
              >
                View Form
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
                      {value ? (
                        field.type === 'file' && typeof value === 'string' && value.startsWith('http') ? (
                          <a
                            href={value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline flex items-center space-x-2"
                          >
                            <FileText className="h-4 w-4" />
                            <span>{formatSubmissionFieldValue(value, field.type)}</span>
                          </a>
                        ) : (
                          formatSubmissionFieldValue(value, field.type)
                        )
                      ) : (
                        <span className="text-gray-400">No response</span>
                      )}
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
