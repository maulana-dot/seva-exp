import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable, type DataTableColumn } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useQueries, useQuery } from '@tanstack/react-query'
import { useForm, useForms } from '../hooks/use-forms'
import { useFormSubmissionsByUser, useUpdateFormSubmission } from '../hooks/use-form-submissions'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import { usePermissions } from '@/features/authentication/hooks/use-permissions'
import { AuditService } from '@/features/audit/services/audit.service'
import { FormService } from '../services/form.service'
import { FormSubmissionService } from '../services/form-submission.service'
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Download,
  Edit,
  Save,
  X
} from 'lucide-react'
import { formatDateTime } from '@/utils/date-format'
import type { FormSubmission } from '@/entities/form-submission/form-submission.types'
import type { CustomForm } from '@/entities/form/form.types'

export default function MySubmissionsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const { isAdmin } = usePermissions()

  const { data: forms = [], isLoading: formsLoading } = useForms()

  const adminSubmissionsQuery = useQuery({
    queryKey: ['submissions', 'all'],
    queryFn: () => FormSubmissionService.getSubmissions(),
    enabled: isAdmin,
    staleTime: 30000,
  })

  const userSubmissionsQuery = useFormSubmissionsByUser(user?.firebaseUid || '')

  const submissions = isAdmin
    ? adminSubmissionsQuery.data || []
    : userSubmissionsQuery.data || []

  const submissionsLoading = isAdmin
    ? adminSubmissionsQuery.isLoading
    : userSubmissionsQuery.isLoading
  const updateSubmissionMutation = useUpdateFormSubmission()

  const uniqueFormIds = useMemo(
    () => Array.from(new Set(submissions.map(submission => submission.formId))),
    [submissions]
  )

  const missingFormIds = useMemo(
    () => uniqueFormIds.filter(formId => !forms.some(form => form.id === formId)),
    [uniqueFormIds, forms]
  )

  const missingFormQueries = useQueries({
    queries: missingFormIds.map((formId) => ({
      queryKey: ['forms', formId],
      queryFn: () => FormService.getForm(formId),
      enabled: true,
      staleTime: 5 * 60 * 1000,
    })),
  })

  const fetchedForms = useMemo(
    () => missingFormQueries
      .map(result => result.data)
      .filter((form): form is CustomForm => Boolean(form)),
    [missingFormQueries]
  )

  const combinedForms = useMemo(() => {
    const map = new Map<string, CustomForm>()
    forms.forEach(form => map.set(form.id, form))
    fetchedForms.forEach(form => map.set(form.id, form))
    return Array.from(map.values())
  }, [forms, fetchedForms])

  const additionalFormsLoading = missingFormQueries.some(result => result.isLoading)
  const formsDataLoading = formsLoading || additionalFormsLoading

  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editFormData, setEditFormData] = useState<Record<string, any>>({})

  const selectedFormId = selectedSubmission?.formId || ''
  const { data: selectedForm, isLoading: selectedFormLoading } = useForm(selectedFormId)

  // Get form details for a submission
  function getFormForSubmission(formId: string) {
    return combinedForms.find(form => form.id === formId)
  }

  const submissionForm = selectedSubmission
    ? getFormForSubmission(selectedSubmission.formId) || selectedForm || null
    : null
  const isFormLoading = Boolean(
    selectedSubmission &&
    !submissionForm &&
    (selectedFormLoading || formsDataLoading)
  )

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

  const renderDisplayValue = (value: unknown, fieldType?: string): ReactNode => {
    const isEmptyArray = Array.isArray(value) && value.length === 0
    if (value === null || value === undefined || value === '' || isEmptyArray) {
      return <span className="text-gray-400">No response</span>
    }

    if (fieldType === 'file' && typeof value === 'string' && value.startsWith('http')) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline flex items-center space-x-2"
        >
          <FileText className="h-4 w-4" />
          <span>{formatFieldValue(value, fieldType)}</span>
        </a>
      )
    }

    return <>{formatFieldValue(value, fieldType)}</>
  }

  const buildColumnsForGroup = (form: CustomForm | undefined, fieldIds: string[]): DataTableColumn<FormSubmission>[] => {
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
        width: '180px',
      },
    ]

    const knownFieldIds = new Set<string>()

    if (form?.fields?.length) {
      const sortedFields = [...form.fields].sort((a, b) => a.order - b.order)
      sortedFields.forEach((field) => {
        knownFieldIds.add(field.id)
        columns.push({
          id: `field-${form.id}-${field.id}`,
          header: field.label,
          searchable: true,
          sortable: false,
          accessorFn: (row) => row.submissionData[field.id],
          cell: (value) => renderDisplayValue(value, field.type),
        })
      })
    }

    fieldIds
      .filter((fieldId) => !knownFieldIds.has(fieldId))
      .forEach((fieldId) => {
        columns.push({
          id: `fallback-${fieldId}`,
          header: fieldId,
          searchable: true,
          sortable: false,
          accessorFn: (row) => row.submissionData[fieldId],
          cell: (value) => renderDisplayValue(value),
        })
      })

    return columns
  }

  const groupedSubmissions = useMemo(() => {
    const map = new Map<string, { submissions: FormSubmission[]; fieldIds: Set<string> }>()

    submissions.forEach((submission) => {
      if (!map.has(submission.formId)) {
        map.set(submission.formId, {
          submissions: [],
          fieldIds: new Set<string>(),
        })
      }

      const group = map.get(submission.formId)!
      group.submissions.push(submission)
      Object.keys(submission.submissionData || {}).forEach((fieldId) => {
        group.fieldIds.add(fieldId)
      })
    })

    return Array.from(map.entries()).map(([formId, group]) => {
      const form = combinedForms.find((f) => f.id === formId)
      const title = form?.title || group.submissions[0]?.formTitle || 'Untitled Form'
      const sortedSubmissions = [...group.submissions].sort(
        (a, b) => b.submittedAt.getTime() - a.submittedAt.getTime()
      )

      return {
        formId,
        form,
        title,
        submissions: sortedSubmissions,
        fieldIds: Array.from(group.fieldIds),
      }
    }).sort((a, b) => a.title.localeCompare(b.title))
  }, [submissions, combinedForms])

  const exportSubmissions = (subset: FormSubmission[], label: string) => {
    if (subset.length === 0) return

    const safeLabel = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'my_submissions'

    const csvContent = [
      ['Submission Date', 'Form Title', 'Form Data'].join(','),
      ...subset.map((submission) => [
        `"${submission.submittedAt.toLocaleString()}"`,
        `"${submission.formTitle}"`,
        `"${JSON.stringify(submission.submissionData).replace(/"/g, '""')}"`,
      ].join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${safeLabel}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const exportAllSubmissions = () => exportSubmissions(submissions, 'all_submissions')

  const totalSubmissions = submissions.length
  const hasSubmissions = groupedSubmissions.length > 0

  if (formsDataLoading || submissionsLoading) {
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
                {totalSubmissions} submission{totalSubmissions !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              {totalSubmissions > 0 && (
                <Button variant="outline" onClick={exportAllSubmissions}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {!hasSubmissions ? (
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
        ) : (
          <div className="space-y-6">
            {groupedSubmissions.map((group) => {
              const columns = buildColumnsForGroup(group.form, group.fieldIds)
              return (
                <Card key={group.formId}>
                  <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <CardTitle>{group.title}</CardTitle>
                      {group.form?.description && (
                        <p className="text-sm text-gray-600 max-w-2xl">{group.form.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {group.submissions.length} submission{group.submissions.length !== 1 ? 's' : ''}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportSubmissions(group.submissions, group.title)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <DataTable
                      data={group.submissions}
                      columns={columns}
                      searchPlaceholder="Search submissions..."
                      pageSize={10}
                      onRowClick={setSelectedSubmission}
                      showRowActionButton={false}
                      enableSearch={true}
                      enablePagination={group.submissions.length > 10}
                      enableSorting={true}
                    />
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
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
