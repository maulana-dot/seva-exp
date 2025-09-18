import { QueryClient } from '@tanstack/react-query'
import { logger } from '@/utils/logger'
import { handleError, AuthenticationError, AuthorizationError, NetworkError } from '@/utils/error-handling'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error: any) => {
        logger.warn('Query failed', { failureCount, error: error.message })

        // Don't retry for authentication/authorization errors
        if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
          return false
        }

        // Don't retry for client errors (4xx)
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }

        return failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: (failureCount, error: any) => {
        // Generally don't retry mutations, except for network errors
        if (error instanceof NetworkError && failureCount < 2) {
          return true
        }
        return false
      },
      onError: (error: any) => {
        logger.error('Mutation failed', { error: error.message })
        handleError(error, 'Mutation')
      },
    },
  },
})