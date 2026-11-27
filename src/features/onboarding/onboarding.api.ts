import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AxiosError } from 'axios'
import { toast } from 'sonner'
import axiosInstance from '@/api/axios'

export interface NewVendorInput {
  hotelName: string
  mobileNumber: string
  pin: string
  address: string
  email?: string
  commissionRate?: number | null
  latitude?: number | null
  longitude?: number | null
}

export interface VendorCreateResult {
  ok: boolean
  row?: number
  vendorId?: number
  storeId?: number | null
  hotelName?: string
  mobileNumber?: string
  error?: string
}

export interface MenuRowInput {
  name: string
  price: number
  category: string
  itemType?: string
  description?: string
  available?: boolean
  imageUrl?: string
}

export interface BulkResult<T> {
  created: number
  failed: number
  results: T[]
  newCategories?: string[]
}

export interface CardInput {
  storeId: number
  name: string
  description?: string
  cardPrice: number
  walletAmount: number
  validityInDays: number
  categoryIds: number[]
  imageUrl?: string
  isActive?: boolean
}

export const onboardingApi = {
  createVendor: (v: NewVendorInput) => axiosInstance.post<VendorCreateResult>('/api/admin/vendors/onboard', v).then((r) => r.data),
  createVendors: (vendors: NewVendorInput[]) =>
    axiosInstance.post<BulkResult<VendorCreateResult>>('/api/admin/vendors/onboard/bulk', { vendors }).then((r) => r.data),
  setPin: (vendorId: number, pin: string) => axiosInstance.put(`/api/admin/vendors/${vendorId}/pin`, { pin }),
  uploadMenu: (storeId: number, items: MenuRowInput[], createMissingCategories: boolean) =>
    axiosInstance.post<BulkResult<{ row: number; name: string; ok: boolean; error?: string }>>(
      `/api/admin/menu/store/${storeId}/items/bulk`, { items, createMissingCategories },
    ).then((r) => r.data),
  createCard: (c: CardInput) => axiosInstance.post('/api/admin/cards/create', c).then((r) => r.data),
  updateCard: (cardId: number, c: Partial<CardInput>) => axiosInstance.put(`/api/admin/cards/${cardId}/manage`, c).then((r) => r.data),
}

export const apiError = (err: unknown, fallback: string) =>
  (err as AxiosError<{ message?: string }>)?.response?.data?.message || fallback

/** After any of these, refresh vendor, store, menu and card data everywhere. */
function useRefresh() {
  const qc = useQueryClient()
  return () => ['vendors', 'stores', 'store', 'menus', 'cards', 'dashboard'].forEach((k) => void qc.invalidateQueries({ queryKey: [k] }))
}

export function useCreateVendor() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: onboardingApi.createVendor, meta: { suppressError: true }, onSuccess: refresh })
}

export function useCreateVendors() {
  const refresh = useRefresh()
  return useMutation({ mutationFn: onboardingApi.createVendors, meta: { suppressError: true }, onSuccess: refresh })
}

export function useSetVendorPin() {
  return useMutation({
    mutationFn: ({ vendorId, pin }: { vendorId: number; pin: string }) => onboardingApi.setPin(vendorId, pin),
    meta: { suppressError: true },
    onError: (e) => toast.error(apiError(e, "Couldn't set the PIN")),
  })
}

export function useUploadMenu(storeId: number) {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ items, createMissing }: { items: MenuRowInput[]; createMissing: boolean }) => onboardingApi.uploadMenu(storeId, items, createMissing),
    meta: { suppressError: true },
    onSuccess: refresh,
    onError: (e) => toast.error(apiError(e, "Couldn't upload the menu")),
  })
}

export function useSaveCard() {
  const refresh = useRefresh()
  return useMutation({
    mutationFn: ({ cardId, card }: { cardId?: number; card: CardInput | Partial<CardInput> }) =>
      cardId ? onboardingApi.updateCard(cardId, card) : onboardingApi.createCard(card as CardInput),
    meta: { suppressError: true },
    onSuccess: (_d, v) => { refresh(); toast.success(v.cardId ? 'Card saved' : 'Card created — it’s on sale in the app now') },
    onError: (e) => toast.error(apiError(e, "Couldn't save the card")),
  })
}
