import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { FormFieldEditor } from './form-field-editor'
import { FieldTypeSelector } from './field-type-selector'
import { FormPreview } from './form-preview'
import { useForm, useCreateForm, useUpdateForm } from '../hooks/use-forms'
import { usePermissions } from '@/features/authentication/hooks/use-permissions'
import {
  Plus,
  Eye,
  Save,
  Settings,
  FileText,
  Palette,
  Share,
  Copy,
  Download,
  Upload
} from 'lucide-react'
import type { CustomForm, FormField, FormFieldType } from '@/entities/form/form.types'

export default function FormBuilderPage() {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()
  const { canManageAllForms } = usePermissions()

  const isEditing = formId && formId !== 'new'
  const { data: existingForm } = useForm(formId || '')
  const createMutation = useCreateForm()
  const updateMutation = useUpdateForm()

  const [form, setForm] = useState<Partial<CustomForm>>({
    title: 'Untitled Form',
    description: '',
    fields: [],
    settings: {
      allowMultipleSubmissions: true,
      requireAuthentication: false,
      showProgressBar: false,
      confirmationMessage: 'Thank you for your submission!'
    }
  })

  // Load existing form data when editing
  useEffect(() => {
    if (existingForm) {
      setForm(existingForm)
    }
  }, [existingForm])

  const [showFieldTypeSelector, setShowFieldTypeSelector] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [draggedField, setDraggedField] = useState<string | null>(null)


  const addField = (type: FormFieldType) => {
    const newField: FormField = {
      id: crypto.randomUUID(),
      type,
      label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
      required: false,
      order: form.fields?.length || 0,
      options: ['select', 'radio', 'checkbox'].includes(type) ? [
        { id: crypto.randomUUID(), label: 'Option 1', value: 'option_1' },
        { id: crypto.randomUUID(), label: 'Option 2', value: 'option_2' },
      ] : undefined
    }

    setForm(prev => ({
      ...prev,
      fields: [...(prev.fields || []), newField]
    }))
  }

  const updateField = (updatedField: FormField) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields?.map(field =>
        field.id === updatedField.id ? updatedField : field
      )
    }))
  }

  const deleteField = (fieldId: string) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields?.filter(field => field.id !== fieldId)
    }))
  }

  const moveField = (fieldId: string, direction: 'up' | 'down') => {
    const fields = form.fields || []
    const currentIndex = fields.findIndex(f => f.id === fieldId)

    if (
      (direction === 'up' && currentIndex <= 0) ||
      (direction === 'down' && currentIndex >= fields.length - 1)
    ) {
      return
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const newFields = [...fields]

    // Swap fields
    ;[newFields[currentIndex], newFields[newIndex]] = [newFields[newIndex], newFields[currentIndex]]

    // Update order
    newFields.forEach((field, index) => {
      field.order = index
    })

    setForm(prev => ({ ...prev, fields: newFields }))
  }

  const saveForm = async () => {
    if (!form.title?.trim()) {
      alert('Please enter a form title')
      return
    }

    if (!form.fields || form.fields.length === 0) {
      alert('Please add at least one field to your form')
      return
    }

    try {
      if (isEditing && formId) {
        await updateMutation.mutateAsync({
          id: formId,
          title: form.title,
          description: form.description || '',
          fields: form.fields.map(field => {
            const cleanField: any = {
              id: field.id,
              type: field.type,
              label: field.label,
              required: field.required,
              order: field.order
            }

            // Only add optional fields if they have values
            if (field.placeholder) cleanField.placeholder = field.placeholder
            if (field.description) cleanField.description = field.description
            if (field.options) cleanField.options = field.options
            if (field.validation) cleanField.validation = field.validation
            if (field.defaultValue) cleanField.defaultValue = field.defaultValue

            return cleanField
          }),
          settings: form.settings!,
          isActive: form.isActive ?? true
        })
      } else {
        const newFormId = await createMutation.mutateAsync({
          title: form.title,
          description: form.description || '',
          fields: form.fields.map(field => {
            const cleanField: any = {
              id: field.id,
              type: field.type,
              label: field.label,
              required: field.required,
              order: field.order
            }

            // Only add optional fields if they have values
            if (field.placeholder) cleanField.placeholder = field.placeholder
            if (field.description) cleanField.description = field.description
            if (field.options) cleanField.options = field.options
            if (field.validation) cleanField.validation = field.validation
            if (field.defaultValue) cleanField.defaultValue = field.defaultValue

            return cleanField
          }),
          settings: form.settings!
        })
        navigate(`/form-builder/${newFormId}/edit`)
      }
    } catch (error) {
      console.error('Failed to save form:', error)
    }
  }

  const exportForm = () => {
    const dataStr = JSON.stringify(form, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${form.title?.replace(/\s+/g, '_') || 'form'}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const importForm = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedForm = JSON.parse(e.target?.result as string)
        setForm(importedForm)
        alert('Form imported successfully!')
      } catch (error) {
        alert('Invalid JSON file')
      }
    }
    reader.readAsText(file)
  }

  const copyFormUrl = () => {
    // In a real app, this would be the actual form URL
    const formUrl = `${window.location.origin}/forms/${form.id || 'preview'}`
    navigator.clipboard.writeText(formUrl)
    alert('Form URL copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold">
                  {isEditing ? 'Edit Form' : 'Form Builder'}
                </h1>
              </div>
              <Badge variant={form.isActive ? 'default' : 'secondary'}>
                {form.isActive ? 'Active' : 'Draft'}
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(true)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>

              <div className="flex items-center space-x-1">
                <Button variant="outline" size="sm" onClick={exportForm}>
                  <Download className="h-4 w-4" />
                </Button>

                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importForm}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>

                <Button variant="outline" size="sm" onClick={copyFormUrl}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              <Button
                onClick={saveForm}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {createMutation.isPending || updateMutation.isPending
                  ? 'Saving...'
                  : isEditing ? 'Update Form' : 'Save Form'
                }
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Builder */}
          <div className="lg:col-span-2 space-y-6">
            {/* Form Header */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Palette className="h-5 w-5" />
                  <span>Form Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="form-title">Form Title</Label>
                  <Input
                    id="form-title"
                    value={form.title || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter form title"
                    className="text-lg font-medium"
                  />
                </div>

                <div>
                  <Label htmlFor="form-description">Description</Label>
                  <Textarea
                    id="form-description"
                    value={form.description || ''}
                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional form description"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Form Fields */}
            <div className="space-y-4">
              {form.fields?.map((field) => (
                <FormFieldEditor
                  key={field.id}
                  field={field}
                  onUpdate={updateField}
                  onDelete={deleteField}
                  onMoveUp={(fieldId) => moveField(fieldId, 'up')}
                  onMoveDown={(fieldId) => moveField(fieldId, 'down')}
                  isDragging={draggedField === field.id}
                />
              ))}

              {form.fields?.length === 0 && (
                <Card className="border-dashed border-2 border-gray-300">
                  <CardContent className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No fields yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Add your first field to get started
                    </p>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowFieldTypeSelector(true)
                      }}
                      className="mx-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Field
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Add Field Button */}
              {form.fields && form.fields.length > 0 && (
                <Card className="border-dashed border-2 border-gray-300 hover:border-gray-400 transition-colors">
                  <CardContent className="p-4">
                    <Button
                      variant="ghost"
                      className="w-full h-12 border-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowFieldTypeSelector(true)
                      }}
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Add Field
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Form Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Form Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Fields</span>
                  <span className="font-medium">{form.fields?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Required Fields</span>
                  <span className="font-medium">
                    {form.fields?.filter(f => f.required).length || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Optional Fields</span>
                  <span className="font-medium">
                    {form.fields?.filter(f => !f.required).length || 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Form Settings */}
            {showSettings && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Form Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="multiple-submissions" className="text-sm">
                      Allow Multiple Submissions
                    </Label>
                    <Switch
                      id="multiple-submissions"
                      checked={form.settings?.allowMultipleSubmissions}
                      onCheckedChange={(checked) => setForm(prev => ({
                        ...prev,
                        settings: { ...prev.settings!, allowMultipleSubmissions: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="require-auth" className="text-sm">
                      Require Authentication
                    </Label>
                    <Switch
                      id="require-auth"
                      checked={form.settings?.requireAuthentication}
                      onCheckedChange={(checked) => setForm(prev => ({
                        ...prev,
                        settings: { ...prev.settings!, requireAuthentication: checked }
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="progress-bar" className="text-sm">
                      Show Progress Bar
                    </Label>
                    <Switch
                      id="progress-bar"
                      checked={form.settings?.showProgressBar}
                      onCheckedChange={(checked) => setForm(prev => ({
                        ...prev,
                        settings: { ...prev.settings!, showProgressBar: checked }
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmation-message" className="text-sm">
                      Confirmation Message
                    </Label>
                    <Textarea
                      id="confirmation-message"
                      value={form.settings?.confirmationMessage || ''}
                      onChange={(e) => setForm(prev => ({
                        ...prev,
                        settings: { ...prev.settings!, confirmationMessage: e.target.value }
                      }))}
                      rows={3}
                      className="text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setShowPreview(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Form
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={copyFormUrl}
                >
                  <Share className="h-4 w-4 mr-2" />
                  Copy Share Link
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={exportForm}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Form Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <FormPreview
          form={form}
          onClose={() => setShowPreview(false)}
        />
      </Dialog>

      {/* Field Type Selector Dialog */}
      <Dialog open={showFieldTypeSelector} onOpenChange={setShowFieldTypeSelector}>
        <FieldTypeSelector
          onSelectType={addField}
          onClose={() => setShowFieldTypeSelector(false)}
        />
      </Dialog>

    </div>
  )
}