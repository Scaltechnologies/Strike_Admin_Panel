import { z } from 'zod'
import { PAGINATION } from '@/constants/pagination'

export const paginationSchema = z.object({
  page: z.number().int().positive().default(PAGINATION.DEFAULT_PAGE),
  pageSize: z
    .number()
    .int()
    .positive()
    .max(PAGINATION.MAX_PAGE_SIZE)
    .default(PAGINATION.DEFAULT_PAGE_SIZE),
})

export const searchSchema = z.object({
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.union([z.literal('asc'), z.literal('desc')]).optional().default('desc'),
})

export const dateRangeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
})

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
})

export type PaginationSchema = z.infer<typeof paginationSchema>
export type SearchSchema = z.infer<typeof searchSchema>
export type DateRangeSchema = z.infer<typeof dateRangeSchema>
