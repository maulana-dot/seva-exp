import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FormSubmissionService } from '../services/form-submission.service'
import type {
  CreateFormSubmissionInput,
  FormSubmissionFilters,
} from '@/entities/form-submission/form-submission.types'

// Query keys
const QUERY_KEYS = {
  submissions: ['submissions'],
  submission: (id: string) => ['submissions', id],
  submissionsByForm: (formId: string) => ['submissions', 'form', formId],
  submissionsByUser: (userId: string) => ['submissions', 'user', userId],
} as const

// Get all submissions with filters
export const useFormSubmissions = (filters?: FormSubmissionFilters) => {
  return useQuery({
    queryKey: [...QUERY_KEYS.submissions, filters],
    queryFn: () => FormSubmissionService.getSubmissions(filters),
    staleTime: 30000, // 30 seconds
  })
}

// Get single submission
export const useFormSubmission = (id: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.submission(id),
    queryFn: () => FormSubmissionService.getSubmission(id),
    enabled: !!id,
    staleTime: 60000, // 1 minute
  })
}

// Get submissions for a specific form
export const useFormSubmissionsByForm = (formId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.submissionsByForm(formId),
    queryFn: () => FormSubmissionService.getSubmissionsByForm(formId),
    enabled: !!formId,
    staleTime: 30000, // 30 seconds
  })
}

// Get submissions by user
export const useFormSubmissionsByUser = (userId: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.submissionsByUser(userId),
    queryFn: () => FormSubmissionService.getSubmissionsByUser(userId),
    enabled: !!userId,
    staleTime: 30000, // 30 seconds
  })
}

// Create form submission
export const useCreateFormSubmission = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateFormSubmissionInput) => {
      const submissionId = await FormSubmissionService.createSubmission(input)
      return submissionId
    },
    onSuccess: (submissionId, variables) => {
      console.log('Form submission created successfully', {
        submissionId,
        formId: variables.formId,
      })

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.submissions,
      })
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.submissionsByForm(variables.formId),
      })
      if (variables.submittedBy) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.submissionsByUser(variables.submittedBy),
        })
      }
    },
    onError: (error, variables) => {
      console.error('Failed to create form submission', {
        error,
        formId: variables.formId,
      })
    },
  })
}