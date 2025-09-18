import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  GripVertical,
  Settings,
  Trash2,
  Plus,
  X,
  Type,
  AlignLeft,
  Mail,
  Hash,
  ChevronDown,
  Circle,
  CheckSquare,
  Calendar,
  Upload,
  Link,
  Phone
} from 'lucide-react'
import type { FormField, FormFieldOption } from '@/entities/form/form.types'

interface FormFieldEditorProps {
  field: FormField
  onUpdate: (field: FormField) => void
  onDelete: (fieldId: string) => void
  onMoveUp: (fieldId: string) => void
  onMoveDown: (fieldId: string) => void
  isDragging?: boolean
}

const FIELD_ICONS = {
  text: Type,
  textarea: AlignLeft,
  email: Mail,
  number: Hash,
  select: ChevronDown,
  radio: Circle,
  checkbox: CheckSquare,
  date: Calendar,
  file: Upload,
  url: Link,
  phone: Phone,
}

export function FormFieldEditor({
  field,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  isDragging = false
}: FormFieldEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [newOption, setNewOption] = useState('')

  const IconComponent = FIELD_ICONS[field.type]

  const updateField = (updates: Partial<FormField>) => {
    onUpdate({ ...field, ...updates })
  }

  const addOption = () => {
    if (!newOption.trim()) return

    const option: FormFieldOption = {
      id: crypto.randomUUID(),
      label: newOption.trim(),
      value: newOption.trim().toLowerCase().replace(/\s+/g, '_')
    }

    updateField({
      options: [...(field.options || []), option]
    })
    setNewOption('')
  }

  const updateOption = (optionId: string, updates: Partial<FormFieldOption>) => {
    updateField({
      options: field.options?.map(opt =>
        opt.id === optionId ? { ...opt, ...updates } : opt
      )
    })
  }

  const removeOption = (optionId: string) => {
    updateField({
      options: field.options?.filter(opt => opt.id !== optionId)
    })
  }

  const hasOptions = ['select', 'radio', 'checkbox'].includes(field.type)

  return (
    <Card className={`transition-all ${isDragging ? 'opacity-50' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="cursor-move">
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            <IconComponent className="h-4 w-4 text-gray-600" />
            <div>
              <div className="font-medium">
                {field.label || 'Untitled Field'}
              </div>
              <div className="text-sm text-gray-500 capitalize">
                {field.type.replace('_', ' ')}
              </div>
            </div>
            {field.required && (
              <Badge variant="secondary" className="text-xs">Required</Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(field.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 border-t bg-gray-50">
          <div className="space-y-4">
            {/* Basic Settings */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor={`label-${field.id}`}>Field Label</Label>
                <Input
                  id={`label-${field.id}`}
                  value={field.label}
                  onChange={(e) => updateField({ label: e.target.value })}
                  placeholder="Enter field label"
                />
              </div>

              <div>
                <Label htmlFor={`placeholder-${field.id}`}>Placeholder</Label>
                <Input
                  id={`placeholder-${field.id}`}
                  value={field.placeholder || ''}
                  onChange={(e) => updateField({ placeholder: e.target.value })}
                  placeholder="Enter placeholder text"
                />
              </div>

              <div>
                <Label htmlFor={`description-${field.id}`}>Description</Label>
                <Textarea
                  id={`description-${field.id}`}
                  value={field.description || ''}
                  onChange={(e) => updateField({ description: e.target.value })}
                  placeholder="Optional field description"
                  rows={2}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id={`required-${field.id}`}
                  checked={field.required}
                  onCheckedChange={(checked) => updateField({ required: checked })}
                />
                <Label htmlFor={`required-${field.id}`}>Required field</Label>
              </div>
            </div>

            {/* Options for select, radio, checkbox */}
            {hasOptions && (
              <div className="space-y-3">
                <Label>Options</Label>

                {field.options?.map((option, index) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Input
                      value={option.label}
                      onChange={(e) => updateOption(option.id, {
                        label: e.target.value,
                        value: e.target.value.toLowerCase().replace(/\s+/g, '_')
                      })}
                      placeholder={`Option ${index + 1}`}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(option.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <div className="flex items-center space-x-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add new option"
                    onKeyPress={(e) => e.key === 'Enter' && addOption()}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    disabled={!newOption.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Validation Settings */}
            {['text', 'textarea', 'number'].includes(field.type) && (
              <div className="space-y-3">
                <Label>Validation</Label>
                <div className="grid grid-cols-2 gap-3">
                  {field.type === 'number' ? (
                    <>
                      <div>
                        <Label htmlFor={`min-${field.id}`}>Minimum Value</Label>
                        <Input
                          id={`min-${field.id}`}
                          type="number"
                          value={field.validation?.min || ''}
                          onChange={(e) => updateField({
                            validation: {
                              ...field.validation,
                              min: e.target.value ? Number(e.target.value) : undefined
                            }
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`max-${field.id}`}>Maximum Value</Label>
                        <Input
                          id={`max-${field.id}`}
                          type="number"
                          value={field.validation?.max || ''}
                          onChange={(e) => updateField({
                            validation: {
                              ...field.validation,
                              max: e.target.value ? Number(e.target.value) : undefined
                            }
                          })}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <Label htmlFor={`min-length-${field.id}`}>Min Length</Label>
                        <Input
                          id={`min-length-${field.id}`}
                          type="number"
                          value={field.validation?.min || ''}
                          onChange={(e) => updateField({
                            validation: {
                              ...field.validation,
                              min: e.target.value ? Number(e.target.value) : undefined
                            }
                          })}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`max-length-${field.id}`}>Max Length</Label>
                        <Input
                          id={`max-length-${field.id}`}
                          type="number"
                          value={field.validation?.max || ''}
                          onChange={(e) => updateField({
                            validation: {
                              ...field.validation,
                              max: e.target.value ? Number(e.target.value) : undefined
                            }
                          })}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}