import { FileText } from 'lucide-react'
import type { ReactNode } from 'react'
import type { DataTableColumn } from '@/components/ui/data-table'
import type { CustomForm } from '@/entities/form/form.types'
import type { FormSubmission } from '@/entities/form-submission/form-submission.types'

export interface SubmissionFieldInfo {
  id: string
  label: string
  type?: string
}

export const formatSubmissionFieldValue = (value: unknown, fieldType?: string): string => {
  if (value === null || value === undefined) return '-'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.join(', ')

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

export const renderSubmissionFieldValue = (value: unknown, fieldType?: string): ReactNode => {
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
        <span>{formatSubmissionFieldValue(value, fieldType)}</span>
      </a>
    )
  }

  return <>{formatSubmissionFieldValue(value, fieldType)}</>
}

export const collectSubmissionFieldIds = (submissions: FormSubmission[]): string[] => {
  const fieldIds = new Set<string>()

  submissions.forEach((submission) => {
    Object.keys(submission.submissionData || {}).forEach((fieldId) => {
      fieldIds.add(fieldId)
    })
  })

  return Array.from(fieldIds)
}

export const buildSubmissionFieldInfo = (form: CustomForm | undefined, fieldIds: string[]): SubmissionFieldInfo[] => {
  const info: SubmissionFieldInfo[] = []
  const knownFieldIds = new Set<string>()

  if (form?.fields?.length) {
    const sortedFields = [...form.fields].sort((a, b) => a.order - b.order)
    sortedFields.forEach((field) => {
      knownFieldIds.add(field.id)
      info.push({
        id: field.id,
        label: field.label,
        type: field.type,
      })
    })
  }

  fieldIds
    .filter((fieldId) => !knownFieldIds.has(fieldId))
    .forEach((fieldId) => {
      info.push({
        id: fieldId,
        label: fieldId,
      })
    })

  return info
}

interface BuildSubmissionFieldColumnsOptions {
  columnIdPrefix?: string
  renderValue?: (value: unknown, fieldType?: string) => ReactNode
}

export const buildSubmissionFieldColumns = (
  fieldInfo: SubmissionFieldInfo[],
  options: BuildSubmissionFieldColumnsOptions = {}
): DataTableColumn<FormSubmission>[] => {
  const {
    columnIdPrefix = 'field',
    renderValue = renderSubmissionFieldValue,
  } = options

  return fieldInfo.map((info) => ({
    id: `${columnIdPrefix}-${info.id}`,
    header: info.label,
    searchable: true,
    sortable: false,
    accessorFn: (row: FormSubmission) => row.submissionData[info.id],
    cell: (value) => renderValue(value, info.type),
  }))
}
