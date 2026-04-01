import type { StorefrontDepartment } from '@shared/index'

export type {
  StorefrontBrand,
  StorefrontCatalogResponse,
  StorefrontCheckoutPayload,
  StorefrontCategory,
  StorefrontDepartment,
  StorefrontDeliveryMethod,
  StorefrontOrder,
  StorefrontPaymentMethod,
  StorefrontProduct,
  StorefrontRazorpayCheckoutSession,
  StorefrontReview,
  CommerceOrderWorkflow,
  CommerceOrderWorkflowResponse,
} from '@shared/index'

export type StorefrontSortOption =
  | 'featured'
  | 'latest'
  | 'price-asc'
  | 'price-desc'
  | 'rating-desc'
  | 'name-asc'

export type CatalogFilters = {
  department: StorefrontDepartment | 'all'
  categories: string[]
  sizes: string[]
  colors: string[]
  fabrics: string[]
  fits: string[]
  sleeves: string[]
  occasions: string[]
  minPrice: number
  maxPrice: number
  rating: number
  availabilityOnly: boolean
}

export type StorefrontCartItem = {
  productId: string
  quantity: number
  size: string
  color: string
}
