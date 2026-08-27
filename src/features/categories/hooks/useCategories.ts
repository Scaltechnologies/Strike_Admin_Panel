import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { categoriesApi } from '../api/categories.api'
import type { CategoryStatus, CreateCategoryRequest, UpdateCategoryRequest } from '../types/category.types'

const QUERY_KEY = ['categories'] as const

export function useCategoryList() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: categoriesApi.list,
    staleTime: 1000 * 30,
    retry: 1,
  })
}

export function useUploadCategoryImage() {
  return useMutation({
    mutationFn: (file: File) => categoriesApi.uploadImage(file),
    onError: () => toast.error('Failed to upload image.'),
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCategoryRequest) => categoriesApi.create(payload),
    onSuccess: () => {
      toast.success('Category created.')
      void qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
    onError: () => toast.error('Failed to create category.'),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCategoryRequest }) =>
      categoriesApi.update(id, payload),
    onSuccess: () => {
      toast.success('Category updated.')
      void qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
    onError: () => toast.error('Failed to update category.'),
  })
}

export function useUpdateCategoryStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: CategoryStatus }) =>
      categoriesApi.updateStatus(id, status),
    onSuccess: (_, vars) => {
      toast.success(vars.status === 'ACTIVE' ? 'Category activated.' : 'Category deactivated.')
      void qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
    onError: () => toast.error('Failed to update category status.'),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    onSuccess: () => {
      toast.success('Category deleted.')
      void qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(message || 'Failed to delete category.')
    },
  })
}
