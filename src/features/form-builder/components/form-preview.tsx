import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Eye, Send, RefreshCw } from 'lucide-react'
import type { CustomForm, FormField } from '@/entities/form/form.types'

interface FormPreviewProps {
  form: Partial<CustomForm>
  onClose: () => void
}

export function FormPreview({ form, onClose }: FormPreviewProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newErrors: Record<string, string> = {}

    form.fields?.forEach(field => {
      const error = validateField(field)
      if (error) {
        newErrors[field.id] = error
      }
    })

    setErrors(newErrors)

    if (Object.keys(newErrors).length === 0) {
      alert('Form submitted successfully! (This is just a preview)')
      console.log('Form data:', formData)
    }
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

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
      <DialogHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Eye className="h-5 w-5" />
            <DialogTitle>Form Preview</DialogTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFormData({})
              setErrors({})
            }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>
      </DialogHeader>

      <div className="overflow-y-auto max-h-[calc(80vh-140px)] pr-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              {form.title || 'Untitled Form'}
            </h1>
            {form.description && (
              <p className="text-gray-600">{form.description}</p>
            )}
          </div>

          {form.fields?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No fields added yet. Add some fields to see the preview.
            </div>
          ) : (
            <div className="space-y-6">
              {form.fields?.map(renderField)}
            </div>
          )}

          {form.fields && form.fields.length > 0 && (
            <div className="flex justify-end pt-4 border-t">
              <Button type="submit">
                <Send className="h-4 w-4 mr-2" />
                Submit Form
              </Button>
            </div>
          )}
        </form>
      </div>
    </DialogContent>
  )
}