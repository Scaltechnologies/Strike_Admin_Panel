export type ItemType = 'VEG' | 'NON_VEG'
export type ItemAvailabilityStatus = 'AVAILABLE' | 'OUT_OF_STOCK'

export interface MenuItemResponse {
  id: number
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  itemType: ItemType | null
  availabilityStatus: ItemAvailabilityStatus | null
  categoryId: number | null
  storeId: number
  createdAt: string
  updatedAt: string
}

export interface CategoryWithItemsResponse {
  id: number
  name: string
  description: string | null
  imageUrl: string | null
  displayOrder: number
  items: MenuItemResponse[]
}
