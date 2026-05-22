export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: { code: string; message: string }
}

/** 관리자용 상품 */
export interface AdminProduct {
  id: number
  sellerId: number
  sellerName: string
  categoryId: number
  categoryName: string | null
  name: string
  price: number
  stock: number
  description: string
  imageUrl: string | null
  imageUrls?: string[] | null
  status: string
  statusReason?: string | null
  createdAt: string
  updatedAt: string | null
  deletedAt: string | null
}

/** 상품 상태 타입 */
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'REJECTED' | 'SOLDOUT'

export interface AdminProductListResponse {
  products: AdminProduct[]
  meta: {
    page: number
    size: number
    totalCount: number
    totalPages: number
  }
}
