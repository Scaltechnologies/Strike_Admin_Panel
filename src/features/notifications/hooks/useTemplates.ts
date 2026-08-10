import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { templatesApi } from '../api/templates.api'
import type { TemplateFilters, CreateTemplateRequest, UpdateTemplateRequest } from '../types/notification.types'

const KEYS = {
  list: (page: number, size: number, filters: TemplateFilters) =>
    ['notifications', 'templates', 'list', page, size, filters] as const,
}

export function useTemplateList(page: number, size: number, filters: TemplateFilters = {}, enabled = true) {
  return useQuery({
    queryKey: KEYS.list(page, size, filters),
    queryFn: () => templatesApi.list(page, size, filters),
    enabled,
    retry: false,
    meta: { suppressError: true },
  })
}

export function useCreateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTemplateRequest) => templatesApi.create(data),
    onSuccess: () => {
      toast.success('Template created')
      void qc.invalidateQueries({ queryKey: ['notifications', 'templates'] })
    },
    onError: () => {
      toast.error('Failed to create template')
    },
  })
}

export function useUpdateTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTemplateRequest }) => templatesApi.update(id, data),
    onSuccess: () => {
      toast.success('Template updated')
      void qc.invalidateQueries({ queryKey: ['notifications', 'templates'] })
    },
    onError: () => {
      toast.error('Failed to update template')
    },
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => templatesApi.remove(id),
    onSuccess: () => {
      toast.success('Template deleted')
      void qc.invalidateQueries({ queryKey: ['notifications', 'templates'] })
    },
    onError: () => {
      toast.error('Failed to delete template')
    },
  })
}

export function useToggleTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => templatesApi.toggle(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notifications', 'templates'] })
    },
    onError: () => {
      toast.error('Failed to update template status')
    },
  })
}
