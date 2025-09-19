import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useForm, useForms } from '../hooks/use-forms'
import { useFormSubmissionsByUser, useUpdateFormSubmission } from '../hooks/use-form-submissions'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import { AuditService } from '@/features/audit/services/audit.service'
import {
  ArrowLeft,
  FileText,
  Eye,
  Calendar,
  User,
  Download,
  Edit,
  Save,
  X
} from 'lucide-react'
import { formatDateTime } from '@/utils/date-format'
import type { FormSubmission } from '@/entities/form-submission/form-submission.types'

export default function MySubmissionsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const { data: forms = [], isLoading: formsLoading } = useForms()
  const { data: submissions = [], isLoading: submissionsLoading } = useFormSubmissionsByUser(user?.firebaseUid || '')
  const updateSubmissionMutation = useUpdateFormSubmission()

  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editFormData, setEditFormData] = useState<Record<string, any>>({})

  const selectedFormId = selectedSubmission?.formId || ''
  const { data: selectedForm, isLoading: selectedFormLoading } = useForm(selectedFormId)

  // Get form details for a submission
  function getFormForSubmission(formId: string) {
    return forms.find(form => form.id === formId)
  }

  const submissionForm = selectedSubmission
    ? getFormForSubmission(selectedSubmission.formId) || selectedForm || null
    : null
  const isFormLoading = Boolean(selectedSubmission && !submissionForm && selectedFormLoading)

  // Handle edit mode
  const handleEditSubmission = (submission: FormSubmission) => {
    setSelectedSubmission(submission)
    setEditFormData({ ...submission.submissionData })
    setIsEditMode(true)
  }

  const handleSaveSubmission = async () => {
    if (!selectedSubmission) return

    try {
      await updateSubmissionMutation.mutateAsync({
        id: selectedSubmission.id,
        submissionData: editFormData,
      })

      // Log the edit action for audit
      if (user) {
        await AuditService.logFormUpdated(
          user.id,
          user.email,
          selectedSubmission.formId,
          selectedSubmission.formTitle,
          { submissionId: selectedSubmission.id, action: 'submission_edited' }
        )
      }

      setIsEditMode(false)
      setSelectedSubmission(null)
      setEditFormData({})
    } catch (error) {
      console.error('Failed to update submission', error)
    }
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setEditFormData({})
  }

  const handleFieldChange = (fieldId: string, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [fieldId]: value
    }))
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
    },
    {
      id: 'actions',
      header: 'Actions',
      accessorKey: 'id',
      sortable: false,
      searchable: false,
      cell: (value, row) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              handleEditSubmission(row)
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
      width: '100px'
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

      {/* Submission Details/Edit Modal */}
      <Dialog open={!!selectedSubmission} onOpenChange={() => {
        setSelectedSubmission(null)
        setIsEditMode(false)
        setEditFormData({})
      }}>
        {selectedSubmission && (
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{isEditMode ? 'Edit Submission' : 'Submission Details'}</span>
                {!isEditMode && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditSubmission(selectedSubmission)}
                    disabled={!submissionForm}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </DialogTitle>
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
              {isFormLoading ? (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  Loading form details...
                </div>
              ) : (() => {
                if (!submissionForm) {
                  return (
                    <div className="space-y-3">
                      {Object.entries(selectedSubmission.submissionData || {}).map(([fieldId, value]) => (
                        <div key={fieldId} className="space-y-2">
                          <div className="font-medium text-gray-900">{fieldId}</div>
                          <div className="text-gray-900 bg-gray-50 p-3 rounded-md min-h-[2.5rem] flex items-center">
                            {formatFieldValue(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }

                return submissionForm.fields?.map((field) => {
                  const value = isEditMode
                    ? editFormData[field.id]
                    : selectedSubmission.submissionData[field.id]

                  return (
                    <div key={field.id} className="space-y-2">
                      <div className="font-medium text-gray-900">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </div>
                      {field.description && (
                        <div className="text-sm text-gray-600">{field.description}</div>
                      )}

                      {isEditMode ? (
                        // Edit mode - render form fields
                        <div>
                          {field.type === 'text' && (
                            <Input
                              value={value || ''}
                              onChange={(e) => handleFieldChange(field.id, e.target.value)}
                              placeholder={`Enter ${field.label}`}
                            />
                          )}
                          {field.type === 'textarea' && (
                            <Textarea
                              value={value || ''}
                              onChange={(e) => handleFieldChange(field.id, e.target.value)}
                              placeholder={`Enter ${field.label}`}
                              rows={3}
                            />
                          )}
                          {field.type === 'email' && (
                            <Input
                              type="email"
                              value={value || ''}
                              onChange={(e) => handleFieldChange(field.id, e.target.value)}
                              placeholder={`Enter ${field.label}`}
                            />
                          )}
                          {field.type === 'number' && (
                            <Input
                              type="number"
                              value={value || ''}
                              onChange={(e) => handleFieldChange(field.id, e.target.value)}
                              placeholder={`Enter ${field.label}`}
                            />
                          )}
                          {field.type === 'select' && field.options && (
                            <select
                              value={value || ''}
                              onChange={(e) => handleFieldChange(field.id, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select an option</option>
                              {field.options.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          )}
                          {field.type === 'radio' && field.options && (
                            <div className="space-y-2">
                              {field.options.map((option) => (
                                <label key={option.value} className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    name={field.id}
                                    value={option.value}
                                    checked={value === option.value}
                                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                    className="text-blue-600"
                                  />
                                  <span>{option.label}</span>
                                </label>
                              ))}
                            </div>
                          )}
                          {field.type === 'checkbox' && field.options && (
                            <div className="space-y-2">
                              {field.options.map((option) => {
                                const checkboxValues = Array.isArray(value) ? value : []
                                return (
                                  <label key={option.value} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      value={option.value}
                                      checked={checkboxValues.includes(option.value)}
                                      onChange={(e) => {
                                        const currentValues = Array.isArray(value) ? value : []
                                        if (e.target.checked) {
                                          handleFieldChange(field.id, [...currentValues, option.value])
                                        } else {
                                          handleFieldChange(field.id, currentValues.filter(v => v !== option.value))
                                        }
                                      }}
                                      className="text-blue-600"
                                    />
                                    <span>{option.label}</span>
                                  </label>
                                )
                              })}
                            </div>
                          )}
                          {field.type === 'file' && (
                            <div className="text-gray-600">
                              File uploads cannot be edited. Current file: {formatFieldValue(value, field.type)}
                            </div>
                          )}
                        </div>
                      ) : (
                        // View mode - display values
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
                      )}
                    </div>
                  )
                })
              })()}

              {isEditMode && (
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={updateSubmissionMutation.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveSubmission}
                    disabled={updateSubmissionMutation.isPending}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updateSubmissionMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
