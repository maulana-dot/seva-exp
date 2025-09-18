export type FormFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'file'
  | 'url'
  | 'phone'

export interface FormFieldOption {
  id: string
  label: string
  value: string
}

export interface FormField {
  id: string
  type: FormFieldType
  label: string
  placeholder?: string
  description?: string
  required: boolean
  options?: FormFieldOption[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    errorMessage?: string
  }
  defaultValue?: string | string[]
  order: number
}

export interface CustomForm {
  id: string
  title: string
  description?: string
  fields: FormField[]
  settings: {
    allowMultipleSubmissions: boolean
    requireAuthentication: boolean
    showProgressBar: boolean
    confirmationMessage: string
    redirectUrl?: string
  }
  createdBy: string
  createdAt: Date
  updatedAt: Date
  isActive: boolean
}

export interface FormSubmission {
  id: string
  formId: string
  submittedBy?: string
  submitterEmail?: string
  data: Record<string, unknown>
  submittedAt: Date
  ipAddress?: string
}

export interface CreateFormInput {
  title: string
  description?: string
  fields: Omit<FormField, 'id'>[]
  settings: CustomForm['settings']
}

export interface UpdateFormInput {
  id: string
  title?: string
  description?: string
  fields?: FormField[]
  settings?: Partial<CustomForm['settings']>
  isActive?: boolean
}