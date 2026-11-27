import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { toast } from 'sonner'
import axiosInstance from '@/api/axios'
import { hasPermission } from '@/core/auth/auth'
import type { ItemAvailabilityStatus, ItemType } from '../types/menu.types'

// ── Types ────────────────────────────────────────────────────────────────────

export type ChangeAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'IMAGE'
export type ChangeStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
export type ChangeFilter = ChangeStatus | 'ALL' | 'DECIDED'
export type ApprovalMode = 'ALL' | 'MANAGERS' | 'OFF'

/** Item fields as stored on a change (any subset). */
export interface ItemFields {
  name?: string
  description?: string | null
  price?: number
  imageUrl?: string | null
  itemType?: ItemType | null
  availabilityStatus?: ItemAvailabilityStatus | null
  categoryId?: number | null
}

export interface MenuChange {
  id: number
  storeId: number
  storeName: string | null
  storeLogo: string | null
  vendorId: number
  itemId: number | null
  action: ChangeAction
  status: ChangeStatus
  itemName: string | null
  changes: ItemFields
  before: ItemFields
  current: ItemFields | null
  requestedByType: 'OWNER' | 'MANAGER' | null
  requestedByName: string | null
  reviewedByName: string | null
  reviewNote: string | null
  createdAt: string | null
  reviewedAt: string | null
}

export interface ChangePage {
  content: MenuChange[]
  totalElements: number
  totalPages: number
  counts?: Record<ChangeStatus, number>
  categoryNames?: Record<string, string>
}

export interface ChangeQuery {
  status: ChangeFilter
  storeId?: number | null
  action?: ChangeAction | ''
  q?: string
}

export interface ApprovalSettings {
  mode: ApprovalMode
  trustedVendorIds: number[]
  trustedVendors: { vendorId: number; name: string | null }[]
}

export interface MenuOverview {
  items?: number
  stores?: number
  veg?: number
  nonVeg?: number
  outOfStock?: number
  withoutPhoto?: number
  averagePrice?: number
  highestPrice?: number
  addedThisWeek?: number
  byCategory?: { categoryId: number; name: string; items: number; averagePrice: number }[]
  priceBands?: { from: number; to: number; items: number }[]
  changes?: Record<ChangeStatus, number>
  approvedToday?: number
  rejectedToday?: number
  oldestPendingAt?: string | null
  averageReviewMinutes?: number
  daily?: { day: string; requested: number; approved: number; rejected: number }[]
}

export interface StoreMenuSummary {
  storeId: number
  name: string | null
  vendorId: number | null
  vendorName: string | null
  logoUrl: string | null
  address: string | null
  status: string | null
  managerName: string | null
  items: number
  categories: number
  veg: number
  outOfStock: number
  withoutPhoto: number
  minPrice: number
  maxPrice: number
  averagePrice: number
  lastUpdatedAt: string | null
  pendingChanges: number
  oldestPendingAt: string | null
  trusted?: boolean
  approvedChanges?: number
  rejectedChanges?: number
}

export interface StorePage {
  content: StoreMenuSummary[]
  totalElements: number
  totalPages: number
}

export type StoreSort = 'items' | 'pending' | 'updated' | 'name' | 'out_of_stock'

// ── API ──────────────────────────────────────────────────────────────────────

const BASE = '/api/admin/menu'

export const menuAdminApi = {
  changes: (q: ChangeQuery, page: number, size: number) =>
    axiosInstance.get<ChangePage>(`${BASE}/changes`, {
      params: { status: q.status, storeId: q.storeId ?? undefined, action: q.action || undefined, q: q.q || undefined, page, size },
    }).then((r) => r.data),
  approve: (id: number, body: { note?: string; changes?: ItemFields }) =>
    axiosInstance.post<MenuChange>(`${BASE}/changes/${id}/approve`, body).then((r) => r.data),
  reject: (id: number, note: string) =>
    axiosInstance.post<MenuChange>(`${BASE}/changes/${id}/reject`, { note }).then((r) => r.data),
  bulkApprove: (ids: number[]) =>
    axiosInstance.post<{ approved: number[]; failed: { id: number; reason: string }[] }>(`${BASE}/changes/bulk-approve`, { ids }).then((r) => r.data),
  settings: () => axiosInstance.get<ApprovalSettings>(`${BASE}/approval-settings`).then((r) => r.data),
  saveSettings: (body: { mode?: ApprovalMode; trustedVendorIds?: number[] }) =>
    axiosInstance.put<ApprovalSettings>(`${BASE}/approval-settings`, body).then((r) => r.data),
  overview: () => axiosInstance.get<MenuOverview>(`${BASE}/insights/overview`).then((r) => r.data),
  stores: (q: string, sort: StoreSort, page: number, size: number) =>
    axiosInstance.get<StorePage>(`${BASE}/insights/stores`, { params: { q: q || undefined, sort, page, size } }).then((r) => r.data),
  store: (storeId: number) => axiosInstance.get<StoreMenuSummary>(`${BASE}/insights/stores/${storeId}`).then((r) => r.data),
  createItem: (storeId: number, body: ItemFields) => axiosInstance.post(`${BASE}/store/${storeId}/items`, body).then((r) => r.data),
  updateItem: (itemId: number, body: ItemFields) => axiosInstance.put(`${BASE}/items/${itemId}`, body).then((r) => r.data),
  deleteItem: (itemId: number) => axiosInstance.delete(`${BASE}/items/${itemId}`),
}

// ── Queries (all under ['menus', …] so any menu mutation refreshes them) ────

const OPTS = { retry: 1, meta: { suppressError: true } } as const

export function useMenuChanges(q: ChangeQuery, page: number, size = 20) {
  return useQuery({
    queryKey: ['menus', 'changes', q, page, size],
    queryFn: () => menuAdminApi.changes(q, page, size),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    refetchInterval: q.status === 'PENDING' ? 45_000 : false,
    ...OPTS,
  })
}

/** Waiting-for-approval count for the sidebar badge. */
export function useMenuPendingCount(enabled: boolean) {
  return useQuery({
    queryKey: ['menus', 'changes', 'pending-count'],
    queryFn: () => menuAdminApi.changes({ status: 'PENDING' }, 0, 1).then((p) => p.totalElements),
    enabled: enabled && hasPermission('SEC_MENUS'),
    staleTime: 30_000,
    refetchInterval: 60_000,
    ...OPTS,
  })
}

export function useApprovalSettings() {
  return useQuery({ queryKey: ['menus', 'approval-settings'], queryFn: menuAdminApi.settings, staleTime: 30_000, ...OPTS })
}

export function useMenuOverview() {
  return useQuery({ queryKey: ['menus', 'overview'], queryFn: menuAdminApi.overview, staleTime: 30_000, ...OPTS })
}

export function useMenuStores(q: string, sort: StoreSort, page: number, size = 24) {
  return useQuery({
    queryKey: ['menus', 'stores', q, sort, page, size],
    queryFn: () => menuAdminApi.stores(q, sort, page, size),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    ...OPTS,
  })
}

export function useMenuStore(storeId: number) {
  return useQuery({ queryKey: ['menus', 'store', storeId], queryFn: () => menuAdminApi.store(storeId), staleTime: 15_000, ...OPTS })
}

// ── Mutations ────────────────────────────────────────────────────────────────

export function errorMessage(err: unknown, fallback: string): string {
  return (err as AxiosError<{ message?: string }>)?.response?.data?.message || fallback
}

function useMenuMutation<T, V>(fn: (v: V) => Promise<T>, success: string | ((data: T, v: V) => string), failure: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    meta: { suppressError: true },
    onSuccess: (data, v) => {
      void qc.invalidateQueries({ queryKey: ['menus'] })
      toast.success(typeof success === 'function' ? success(data, v) : success)
    },
    onError: (err) => toast.error(errorMessage(err, failure)),
  })
}

export function useApproveChange() {
  return useMenuMutation(
    ({ id, note, changes }: { id: number; note?: string; changes?: ItemFields }) => menuAdminApi.approve(id, { note, changes }),
    (c) => `Approved — ${c.itemName ?? 'the change'} is live now`,
    "Couldn't approve this change",
  )
}

export function useRejectChange() {
  return useMenuMutation(
    ({ id, note }: { id: number; note: string }) => menuAdminApi.reject(id, note),
    'Rejected — the store will see your reason',
    "Couldn't reject this change",
  )
}

export function useBulkApprove() {
  return useMenuMutation(
    (ids: number[]) => menuAdminApi.bulkApprove(ids),
    (r) => (r.failed.length ? `Approved ${r.approved.length}, ${r.failed.length} couldn't be approved` : `Approved ${r.approved.length} changes`),
    "Couldn't approve these changes",
  )
}

export function useSaveApprovalSettings() {
  return useMenuMutation(
    (body: { mode?: ApprovalMode; trustedVendorIds?: number[] }) => menuAdminApi.saveSettings(body),
    'Approval settings saved',
    "Couldn't save the approval settings",
  )
}

export function useCreateItem(storeId: number) {
  return useMenuMutation((body: ItemFields) => menuAdminApi.createItem(storeId, body), 'Item added — live on the menu now', "Couldn't add the item")
}

export function useUpdateItem() {
  return useMenuMutation(
    ({ itemId, body }: { itemId: number; body: ItemFields; quiet?: boolean }) => menuAdminApi.updateItem(itemId, body),
    (_d, v) => (v.body.availabilityStatus && Object.keys(v.body).length === 1
      ? (v.body.availabilityStatus === 'AVAILABLE' ? 'Back in stock' : 'Marked out of stock')
      : 'Item saved — live on the menu now'),
    "Couldn't save the item",
  )
}

export function useDeleteItem() {
  return useMenuMutation((itemId: number) => menuAdminApi.deleteItem(itemId), 'Item removed from the menu', "Couldn't remove the item")
}
