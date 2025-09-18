import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FormService } from '../services/form.service'
import { useAuth } from '@/features/authentication/hooks/use-auth'
import { usePermissions } from '@/features/authentication/hooks/use-permissions'
import type {
  CustomForm,
  CreateFormInput,
  UpdateFormInput,
  FormSubmission
} from '@/entities/form/form.types'

// Query Keys
const QUERY_KEYS = {
  forms: ['forms'],
  userForms: (userId: string) => ['forms', 'user', userId],
  allForms: () => ['forms', 'all'],
  form: (formId: string) => ['forms', formId],
  submissions: (formId: string) => ['forms', formId, 'submissions'],
}

// Get forms based on user permissions
export function useForms() {
  const { user } = useAuth()
  const { isAdmin } = usePermissions()

  return useQuery({
    queryKey: isAdmin ? QUERY_KEYS.allForms() : QUERY_KEYS.userForms(user?.id || ''),
    queryFn: () => isAdmin ? FormService.getAllForms() : FormService.getUserForms(user?.id!),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get user's own forms
export function useUserForms() {
  const { user } = useAuth()

  return useQuery({
    queryKey: QUERY_KEYS.userForms(user?.id || ''),
    queryFn: () => FormService.getUserForms(user?.id!),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  })
}

// Get all forms (admin only)
export function useAllForms() {
  const { isAdmin } = usePermissions()

  return useQuery({
    queryKey: QUERY_KEYS.allForms(),
    queryFn: FormService.getAllForms,
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000,
  })
}

// Get single form
export function useForm(formId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.form(formId),
    queryFn: () => FormService.getForm(formId),
    enabled: !!formId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

// Get form submissions
export function useFormSubmissions(formId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.submissions(formId),
    queryFn: () => FormService.getFormSubmissions(formId),
    enabled: !!formId,
    staleTime: 30 * 1000, // 30 seconds
  })
}

// Create form mutation
export function useCreateForm() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateFormInput) => FormService.createForm(input, user?.id!),
    onSuccess: (formId) => {
      toast.success('Form created successfully')
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.forms })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userForms(user?.id || '') })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allForms() })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create form')
    },
  })
}

// Update form mutation
export function useUpdateForm() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateFormInput) => FormService.updateForm(input, user?.id!),
    onSuccess: (_, variables) => {
      toast.success('Form updated successfully')
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.forms })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.form(variables.id) })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userForms(user?.id || '') })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allForms() })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update form')
    },
  })
}

// Delete form mutation
export function useDeleteForm() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formId: string) => FormService.deleteForm(formId, user?.id!),
    onSuccess: () => {
      toast.success('Form deleted successfully')
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.forms })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userForms(user?.id || '') })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allForms() })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete form')
    },
  })
}

// Duplicate form mutation
export function useDuplicateForm() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (formId: string) => FormService.duplicateForm(formId, user?.id!),
    onSuccess: () => {
      toast.success('Form duplicated successfully')
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.forms })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.userForms(user?.id || '') })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allForms() })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to duplicate form')
    },
  })
}

// Submit form mutation
export function useSubmitForm() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ formId, data, submitterEmail }: {
      formId: string
      data: Record<string, unknown>
      submitterEmail?: string
    }) => FormService.submitForm(formId, data, user?.id, submitterEmail),
    onSuccess: (_, variables) => {
      toast.success('Form submitted successfully')
      // Invalidate submissions for this form
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.submissions(variables.formId) })
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit form')
    },
  })
}