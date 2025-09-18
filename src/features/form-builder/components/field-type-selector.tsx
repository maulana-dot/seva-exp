import { Button } from '@/components/ui/button'
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
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
import type { FormFieldType } from '@/entities/form/form.types'

interface FieldTypeSelectorProps {
  onSelectType: (type: FormFieldType) => void
  onClose: () => void
}

const FIELD_TYPES = [
  {
    type: 'text' as FormFieldType,
    label: 'Short Text',
    description: 'Single line text input',
    icon: Type,
  },
  {
    type: 'textarea' as FormFieldType,
    label: 'Long Text',
    description: 'Multi-line text area',
    icon: AlignLeft,
  },
  {
    type: 'email' as FormFieldType,
    label: 'Email',
    description: 'Email address input',
    icon: Mail,
  },
  {
    type: 'number' as FormFieldType,
    label: 'Number',
    description: 'Numeric input',
    icon: Hash,
  },
  {
    type: 'select' as FormFieldType,
    label: 'Dropdown',
    description: 'Select from dropdown list',
    icon: ChevronDown,
  },
  {
    type: 'radio' as FormFieldType,
    label: 'Multiple Choice',
    description: 'Radio button selection',
    icon: Circle,
  },
  {
    type: 'checkbox' as FormFieldType,
    label: 'Checkboxes',
    description: 'Multiple selections allowed',
    icon: CheckSquare,
  },
  {
    type: 'date' as FormFieldType,
    label: 'Date',
    description: 'Date picker input',
    icon: Calendar,
  },
  {
    type: 'file' as FormFieldType,
    label: 'File Upload',
    description: 'File attachment',
    icon: Upload,
  },
  {
    type: 'url' as FormFieldType,
    label: 'URL',
    description: 'Website link input',
    icon: Link,
  },
  {
    type: 'phone' as FormFieldType,
    label: 'Phone Number',
    description: 'Phone number input',
    icon: Phone,
  },
]

export function FieldTypeSelector({ onSelectType, onClose }: FieldTypeSelectorProps) {

  return (
    <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Select Field Type</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-1 gap-2 mt-4">
        {FIELD_TYPES.map((fieldType) => {
          const IconComponent = fieldType.icon
          return (
            <Button
              key={fieldType.type}
              variant="ghost"
              className="h-auto p-4 justify-start hover:bg-gray-50"
              onClick={() => {
                onSelectType(fieldType.type)
                onClose()
              }}
            >
              <div className="flex items-center space-x-3">
                <IconComponent className="h-5 w-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">{fieldType.label}</div>
                  <div className="text-sm text-gray-500">{fieldType.description}</div>
                </div>
              </div>
            </Button>
          )
        })}
      </div>
    </DialogContent>
  )
}