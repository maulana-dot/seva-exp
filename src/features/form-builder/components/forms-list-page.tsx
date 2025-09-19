import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { DropdownMenu, DropdownTrigger, DropdownContent, DropdownItem } from '@/components/ui/dropdown-menu'
import { useForms, useDeleteForm, useDuplicateForm } from '../hooks/use-forms'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import { usePermissions } from '@/features/authentication/hooks/use-permissions'
import { formatDateTime } from '@/utils/date-format'
import {
  Plus,
  Search,
  FileText,
  MoreVertical,
  Edit,
  Eye,
  Copy,
  Trash2,
  Users,
  Settings,
  ExternalLink,
  Grid,
  List,
  SortAsc,
  SortDesc
} from 'lucide-react'
import type { CustomForm } from '@/entities/form/form.types'

type ViewMode = 'grid' | 'list'
type SortField = 'title' | 'updatedAt' | 'createdAt'
type SortOrder = 'asc' | 'desc'

export default function FormsListPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortField, setSortField] = useState<SortField>('updatedAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const navigate = useNavigate()
  const { user } = useAuth()
  const { canManageAllForms, canDeleteForms } = usePermissions()

  const { data: forms = [], isLoading, error } = useForms()
  const deleteMutation = useDeleteForm()
  const duplicateMutation = useDuplicateForm()

  const filteredAndSortedForms = forms
    .filter(form => {
      const matchesSearch = form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           form.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' ||
                           (statusFilter === 'active' && form.isActive) ||
                           (statusFilter === 'inactive' && !form.isActive)
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let aValue: string | Date = ''
      let bValue: string | Date = ''

      switch (sortField) {
        case 'title':
          aValue = a.title
          bValue = b.title
          break
        case 'updatedAt':
          aValue = a.updatedAt
          bValue = b.updatedAt
          break
        case 'createdAt':
          aValue = a.createdAt
          bValue = b.createdAt
          break
      }

      if (sortField === 'title') {
        return sortOrder === 'asc'
          ? (aValue as string).localeCompare(bValue as string)
          : (bValue as string).localeCompare(aValue as string)
      } else {
        return sortOrder === 'asc'
          ? (aValue as Date).getTime() - (bValue as Date).getTime()
          : (bValue as Date).getTime() - (aValue as Date).getTime()
      }
    })

  const handleDelete = (formId: string) => {
    if (window.confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      deleteMutation.mutate(formId)
    }
  }

  const handleDuplicate = (formId: string) => {
    duplicateMutation.mutate(formId)
  }

  const canEditForm = (form: CustomForm) => {
    return form.createdBy === user?.id || canManageAllForms
  }

  const canDeleteForm = (form: CustomForm) => {
    return canDeleteForms && (form.createdBy === user?.id || canManageAllForms)
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Forms</h1>
          <p className="text-gray-600">Create and manage your custom forms</p>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Forms</h1>
          <p className="text-gray-600">Create and manage your custom forms</p>
        </div>
        <div className="text-center py-16">
          <p className="text-red-600">Failed to load forms</p>
        </div>
      </div>
    )
  }

  const FormCard = ({ form }: { form: CustomForm }) => (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/forms/${form.id}/submissions`)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="truncate text-lg">{form.title}</CardTitle>
            {form.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{form.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2 ml-2">
            <Badge variant={form.isActive ? 'default' : 'secondary'}>
              {form.isActive ? 'Active' : 'Draft'}
            </Badge>
            <DropdownMenu>
              <DropdownTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownTrigger>
              <DropdownContent>
                <DropdownItem onClick={() => navigate(`/forms/${form.id}/detail`)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Details
                </DropdownItem>
                <DropdownItem onClick={() => navigate(`/form-builder/${form.id}`)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownItem>
                {canEditForm(form) && (
                  <DropdownItem onClick={() => navigate(`/form-builder/${form.id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownItem>
                )}
                <DropdownItem onClick={() => handleDuplicate(form.id)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownItem>
                <DropdownItem onClick={() => navigate(`/forms/${form.id}/submissions`)}>
                  <Users className="mr-2 h-4 w-4" />
                  Submissions
                </DropdownItem>
                <DropdownItem onClick={() => window.open(`/forms/${form.id}`, '_blank')}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open Form
                </DropdownItem>
                {canDeleteForm(form) && (
                  <>
                    <div className="border-t my-1" />
                    <DropdownItem
                      onClick={() => handleDelete(form.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownItem>
                  </>
                )}
              </DropdownContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{form.fields.length} fields</span>
            <span>{form.fields.filter(f => f.required).length} required</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {canManageAllForms && (
                <div className="flex items-center space-x-1">
                  <Avatar size="sm" fallback="U" />
                  <span className="text-xs text-gray-500">
                    {form.createdBy === user?.id ? 'You' : 'Other user'}
                  </span>
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {formatDateTime(form.updatedAt)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const FormRow = ({ form }: { form: CustomForm }) => (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/forms/${form.id}/submissions`)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <FileText className="h-5 w-5 text-gray-600 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="font-medium truncate">{form.title}</h3>
              {form.description && (
                <p className="text-sm text-gray-600 truncate">{form.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-sm font-medium">{form.fields.length}</div>
              <div className="text-xs text-gray-500">Fields</div>
            </div>

            <Badge variant={form.isActive ? 'default' : 'secondary'}>
              {form.isActive ? 'Active' : 'Draft'}
            </Badge>

            <div className="text-xs text-gray-500 w-24">
              {formatDateTime(form.updatedAt)}
            </div>

            <DropdownMenu>
              <DropdownTrigger>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownTrigger>
              <DropdownContent>
                <DropdownItem onClick={() => navigate(`/forms/${form.id}/detail`)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Details
                </DropdownItem>
                <DropdownItem onClick={() => navigate(`/form-builder/${form.id}`)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View
                </DropdownItem>
                {canEditForm(form) && (
                  <DropdownItem onClick={() => navigate(`/form-builder/${form.id}/edit`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownItem>
                )}
                <DropdownItem onClick={() => handleDuplicate(form.id)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </DropdownItem>
                {canDeleteForm(form) && (
                  <DropdownItem
                    onClick={() => handleDelete(form.id)}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownItem>
                )}
              </DropdownContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Forms</h1>
          <p className="text-gray-600">
            {canManageAllForms ? 'Manage all forms in the system' : 'Create and manage your custom forms'}
          </p>
        </div>
        <Button onClick={() => navigate('/form-builder/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Form
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search forms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Draft</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSort('title')}
                className="flex items-center space-x-1"
              >
                <span>Title</span>
                {sortField === 'title' && (
                  sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSort('updatedAt')}
                className="flex items-center space-x-1"
              >
                <span>Updated</span>
                {sortField === 'updatedAt' && (
                  sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                )}
              </Button>

              <div className="border-l pl-2 flex items-center space-x-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Forms</p>
                <p className="text-2xl font-bold">{forms.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Forms</p>
                <p className="text-2xl font-bold text-green-600">
                  {forms.filter(f => f.isActive).length}
                </p>
              </div>
              <Settings className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Draft Forms</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {forms.filter(f => !f.isActive).length}
                </p>
              </div>
              <Edit className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">My Forms</p>
                <p className="text-2xl font-bold text-purple-600">
                  {forms.filter(f => f.createdBy === user?.id).length}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forms List */}
      {filteredAndSortedForms.length === 0 ? (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No forms found' : 'No forms yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? 'Try adjusting your search terms or filters'
                : 'Create your first form to get started'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate('/form-builder/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Form
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {filteredAndSortedForms.map((form) =>
            viewMode === 'grid' ? (
              <FormCard key={form.id} form={form} />
            ) : (
              <FormRow key={form.id} form={form} />
            )
          )}
        </div>
      )}
    </div>
  )
}