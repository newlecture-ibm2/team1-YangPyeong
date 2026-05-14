/* ── ADM-003 작물 마스터 관리 타입 정의 ── */

export interface AdminCropCategory {
  id: number
  name: string
  description: string | null
  displayOrder: number
  isActive: boolean
  externalId?: string
  dataSource?: string
}

export interface AdminCrop {
  id: number
  categoryId: number
  name: string
  externalId?: string
  dataSource?: string
  createdAt: string
  updatedAt: string | null
}

export interface CreateCropRequest {
  categoryId: number
  name: string
}

export interface UpdateCropRequest {
  categoryId: number
  name: string
}

export interface CreateCropCategoryRequest {
  name: string
  description?: string
  displayOrder?: number
}

export interface UpdateCropCategoryRequest {
  name?: string
  description?: string
  displayOrder?: number
  isActive?: boolean
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  error: {
    code: string
    message: string
  } | null
}
