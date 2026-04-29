/* ── ADM-003 작물 마스터 관리 타입 정의 ── */

export interface AdminCropCategory {
  id: number
  name: string
  description: string | null
  displayOrder: number
  isActive: boolean
}

export interface AdminCrop {
  id: number
  categoryId: number
  code: string
  name: string
  growthDays: number | null
  yieldPerSqm: number | null
  avgCostPerSqm: number | null
  climateConditions: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export interface CreateCropRequest {
  categoryId: number
  name: string
  growthDays?: number
  yieldPerSqm?: number
  avgCostPerSqm?: number
  climateConditions?: string
}

export interface UpdateCropRequest {
  categoryId?: number
  name?: string
  growthDays?: number
  yieldPerSqm?: number
  avgCostPerSqm?: number
  climateConditions?: string
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
