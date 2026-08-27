import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { storeCategoriesApi } from '../api/store-categories.api'
import type { StoreCategoryRequest } from '../types/store-category.types'

const QUERY_KEY = ['store-categories'] as const

export function useStoreCategoryList() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: storeCategoriesApi.list,
    staleTime: 1000 * 30,
    retry: 1,
  })
}

export function useCreateStoreCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: StoreCategoryRequest) => storeCategoriesApi.create(payload),
    onSuccess: () => {
      toast.success('Category created.')
      void qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(message || 'Failed to create category.')
    },
  })
}

export function useUpdateStoreCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: StoreCategoryRequest }) =>
      storeCategoriesApi.update(id, payload),
    onSuccess: () => {
      toast.success('Category updated.')
      void qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(message || 'Failed to update category.')
    },
  })
}

export function useDeleteStoreCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => storeCategoriesApi.delete(id),
    onSuccess: () => {
      toast.success('Category deleted.')
      void qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
    onError: () => toast.error('Failed to delete category.'),
  })
}
