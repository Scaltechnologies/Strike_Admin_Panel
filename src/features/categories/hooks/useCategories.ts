import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { toast } from 'sonner'
import { categoriesApi } from '../api/categories.api'
import type { CategoryStatus, CreateCategoryRequest, UpdateCategoryRequest } from '../types/category.types'

const QUERY_KEY = ['categories'] as const

// Backend's GlobalExceptionHandler already sanitizes ex.getMessage() before it reaches the
// client (see AdminCategoryController/ErrorResponse) — safe to surface directly rather than
// masking it with a generic string.
function getErrorMessage(err: unknown, fallback: string): string {
  const message = (err as AxiosError<{ message?: string }>)?.response?.data?.message
  return message || fallback
}

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
    meta: { suppressError: true },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to upload image.'),
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateCategoryRequest) => categoriesApi.create(payload),
    meta: { suppressError: true },
    onSuccess: () => {
      toast.success('Category created.')
      void qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to create category.')),
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCategoryRequest }) =>
      categoriesApi.update(id, payload),
    meta: { suppressError: true },
    onSuccess: () => {
      toast.success('Category updated.')
      void qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to update category.')),
  })
}

export function useUpdateCategoryStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: CategoryStatus }) =>
      categoriesApi.updateStatus(id, status),
    meta: { suppressError: true },
    onSuccess: (_, vars) => {
      toast.success(vars.status === 'ACTIVE' ? 'Category activated.' : 'Category deactivated.')
      void qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to update category status.')),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => categoriesApi.delete(id),
    meta: { suppressError: true },
    onSuccess: () => {
      toast.success('Category deleted.')
      void qc.invalidateQueries({ queryKey: QUERY_KEY })
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Failed to delete category.')),
  })
}
