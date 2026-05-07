export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: { code: string; message: string }
}

/** 관리자용 상품 */
export interface AdminProduct {
  id: number
  sellerId: number
  categoryId: number
  name: string
  price: number
  stock: number
  description: string
  imageUrl: string | null
  status: string
  createdAt: string
  updatedAt: string | null
  deletedAt: string | null
}

/** 상품 상태 타입 */
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'REJECTED'
