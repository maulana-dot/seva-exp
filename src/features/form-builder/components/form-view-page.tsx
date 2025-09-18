import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useForm } from '../hooks/use-forms'
import { useCreateFormSubmission } from '../hooks/use-form-submissions'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import { ArrowLeft, Send, FileText } from 'lucide-react'
import type { FormField } from '@/entities/form/form.types'

export default function FormViewPage() {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: form, isLoading } = useForm(formId || '')
  const createSubmissionMutation = useCreateFormSubmission()

  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleInputChange = (fieldId: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }

  const validateField = (field: FormField): string | null => {
    const value = formData[field.id]

    if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return `${field.label} is required`
    }

    if (field.validation && value) {
      const { min, max, pattern } = field.validation

      if (field.type === 'number') {
        const numValue = Number(value)
        if (min !== undefined && numValue < min) {
          return `${field.label} must be at least ${min}`
        }
        if (max !== undefined && numValue > max) {
          return `${field.label} must be at most ${max}`
        }
      } else if (typeof value === 'string') {
        if (min !== undefined && value.length < min) {
          return `${field.label} must be at least ${min} characters`
        }
        if (max !== undefined && value.length > max) {
          return `${field.label} must be at most ${max} characters`
        }
        if (pattern && !new RegExp(pattern).test(value)) {
          return field.validation.errorMessage || `${field.label} format is invalid`
        }
      }
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const newErrors: Record<string, string> = {}

    form?.fields?.forEach(field => {
      const error = validateField(field)
      if (error) {
        newErrors[field.id] = error
      }
    })

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0 && formId && form) {
      try {
        // Get user info for submission
        const userAgent = navigator.userAgent
        const ipAddress = undefined // Would need backend service to get real IP

        await createSubmissionMutation.mutateAsync({
          formId,
          formTitle: form.title || 'Untitled Form',
          submissionData: formData,
          submittedBy: user?.firebaseUid,
          userAgent,
          ipAddress,
        })

        // Show success message
        setShowSuccess(true)

        // Reset form if multiple submissions are allowed
        if (form?.settings?.allowMultipleSubmissions) {
          setFormData({})
          setTimeout(() => setShowSuccess(false), 3000) // Hide success after 3 seconds
        }
      } catch (error) {
        console.error('Failed to submit form:', error)
        alert('Sorry, there was an error submitting your form. Please try again.')
      }
    }

    setIsSubmitting(false)
  }

  const renderField = (field: FormField) => {
    const value = formData[field.id]
    const error = errors[field.id]

    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
      case 'phone':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-gray-600">{field.description}</p>
            )}
            <Input
              id={field.id}
              type={field.type}
              placeholder={field.placeholder}
              value={(value as string) || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-gray-600">{field.description}</p>
            )}
            <Input
              id={field.id}
              type="number"
              placeholder={field.placeholder}
              value={(value as string) || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              min={field.validation?.min}
              max={field.validation?.max}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-gray-600">{field.description}</p>
            )}
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              value={(value as string) || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              rows={4}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-gray-600">{field.description}</p>
            )}
            <select
              id={field.id}
              value={(value as string) || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${error ? 'border-red-500' : 'border-gray-300'}`}
            >
              <option value="">Select an option</option>
              {field.options?.map(option => (
                <option key={option.id} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )

      case 'radio':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-gray-600">{field.description}</p>
            )}
            <div className="space-y-2">
              {field.options?.map(option => (
                <div key={option.id} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`${field.id}-${option.id}`}
                    name={field.id}
                    value={option.value}
                    checked={value === option.value}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <Label htmlFor={`${field.id}-${option.id}`} className="text-sm font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )

      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-gray-600">{field.description}</p>
            )}
            <div className="space-y-2">
              {field.options?.map(option => (
                <div key={option.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${option.id}`}
                    checked={Array.isArray(value) && value.includes(option.value)}
                    onCheckedChange={(checked) => {
                      const currentValues = Array.isArray(value) ? value : []
                      if (checked) {
                        handleInputChange(field.id, [...currentValues, option.value])
                      } else {
                        handleInputChange(field.id, currentValues.filter(v => v !== option.value))
                      }
                    }}
                  />
                  <Label htmlFor={`${field.id}-${option.id}`} className="text-sm font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-gray-600">{field.description}</p>
            )}
            <Input
              id={field.id}
              type="date"
              value={(value as string) || ''}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )

      case 'file':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-sm text-gray-600">{field.description}</p>
            )}
            <Input
              id={field.id}
              type="file"
              onChange={(e) => handleInputChange(field.id, e.target.files?.[0]?.name || '')}
              className={error ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )

      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading form...</p>
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
          <p className="text-gray-600 mb-4">The form you're looking for doesn't exist or has been deleted.</p>
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
                <h1 className="text-xl font-bold">Form Submission</h1>
              </div>
              <Badge variant={form.isActive ? 'default' : 'secondary'}>
                {form.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{form.title}</CardTitle>
            {form.description && (
              <p className="text-gray-600">{form.description}</p>
            )}
          </CardHeader>
          <CardContent>
            {!form.isActive ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Form Inactive
                </h3>
                <p>This form is currently not accepting submissions.</p>
              </div>
            ) : form.fields?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Fields
                </h3>
                <p>This form doesn't have any fields yet.</p>
              </div>
            ) : showSuccess && !form.settings?.allowMultipleSubmissions ? (
              <div className="text-center py-8">
                <div className="bg-green-50 border border-green-200 rounded-md p-6">
                  <div className="text-green-800">
                    <h3 className="text-lg font-medium mb-2">
                      Thank you for your submission!
                    </h3>
                    <p className="text-sm">
                      {form.settings?.confirmationMessage || 'Your form has been submitted successfully.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {showSuccess && form.settings?.allowMultipleSubmissions && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-800 text-sm">
                      {form.settings?.confirmationMessage || 'Your form has been submitted successfully!'}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {form.fields?.map(renderField)}

                  <div className="flex justify-end pt-4 border-t">
                    <Button type="submit" disabled={isSubmitting}>
                      <Send className="h-4 w-4 mr-2" />
                      {isSubmitting ? 'Submitting...' : 'Submit Form'}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </CardContent>
        </Card>

        {form.settings?.confirmationMessage && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">{form.settings.confirmationMessage}</p>
          </div>
        )}
      </div>
    </div>
  )
}