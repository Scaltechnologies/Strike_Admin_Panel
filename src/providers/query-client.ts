import type { AxiosError } from 'axios'
import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query'
import { toast } from 'sonner'

interface ApiErrorData {
  message?: string
}

function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<ApiErrorData>
  return axiosError.response?.data?.message ?? 'An unexpected error occurred'
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const axiosError = error as AxiosError
      const status = axiosError.response?.status
      if (status === 401 || status === 403) return
      if (query.meta?.suppressError) return
      toast.error(getErrorMessage(error))
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.suppressError) return
      toast.error(getErrorMessage(error))
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const axiosError = error as AxiosError
        const status = axiosError.response?.status
        if (status === 401 || status === 403 || status === 404) return false
        return failureCount < 2
      },
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 30_000),
      staleTime: 1_000 * 60 * 5,
      gcTime: 1_000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: 0,
    },
  },
})
