import type {
  ApiResponse, AdminCrop, AdminCropCategory,
  CreateCropRequest, UpdateCropRequest,
  CreateCropCategoryRequest, UpdateCropCategoryRequest,
} from './crop.types'

const BASE = '/api/admin/crops'

// ── 카테고리 ──

/** 카테고리 목록 조회 */
export async function fetchCropCategories(): Promise<AdminCropCategory[]> {
  const res = await fetch(`${BASE}/categories`)
  const json: ApiResponse<AdminCropCategory[]> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '카테고리 조회 실패')
  return json.data
}

/** 카테고리 등록 */
export async function createCropCategory(body: CreateCropCategoryRequest): Promise<number> {
  const res = await fetch(`${BASE}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json: ApiResponse<number> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '카테고리 등록 실패')
  return json.data
}

/** 카테고리 수정 */
export async function updateCropCategory(id: number, body: UpdateCropCategoryRequest): Promise<void> {
  const res = await fetch(`${BASE}/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '카테고리 수정 실패')
}

/** 카테고리 삭제 */
export async function deleteCropCategory(id: number): Promise<void> {
  const res = await fetch(`${BASE}/categories/${id}`, { method: 'DELETE' })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '카테고리 삭제 실패')
}

// ── 작물 ──

/** 작물 목록 조회 (필터 선택) */
export async function fetchCrops(categoryId?: number, keyword?: string, isActive?: boolean): Promise<AdminCrop[]> {
  const params = new URLSearchParams()
  if (categoryId) params.set('categoryId', String(categoryId))
  if (keyword) params.set('keyword', keyword)
  if (isActive !== undefined) params.set('isActive', String(isActive))
  const query = params.toString() ? `?${params}` : ''
  const res = await fetch(`${BASE}${query}`)
  const json: ApiResponse<AdminCrop[]> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '작물 조회 실패')
  return json.data
}

/** 작물 단건 조회 */
export async function fetchCropById(id: number): Promise<AdminCrop> {
  const res = await fetch(`${BASE}/${id}`)
  const json: ApiResponse<AdminCrop> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '작물 조회 실패')
  return json.data
}

/** 작물 등록 */
export async function createCrop(body: CreateCropRequest): Promise<number> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json: ApiResponse<number> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '작물 등록 실패')
  return json.data
}

/** 작물 수정 */
export async function updateCrop(id: number, body: UpdateCropRequest): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '작물 수정 실패')
}

/** 작물 비활성화 */
export async function deactivateCrop(id: number): Promise<void> {
  const res = await fetch(`${BASE}/${id}/deactivate`, { method: 'PATCH' })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '비활성화 실패')
}
