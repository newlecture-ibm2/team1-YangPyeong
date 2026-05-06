import type { ApiResponse, AdminProduct } from './shop.types'

const BASE = '/api/admin/shop'

export async function fetchProducts(): Promise<AdminProduct[]> {
  const res = await fetch(BASE)
  const json: ApiResponse<AdminProduct[]> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '상품 조회 실패')
  return json.data
}

export async function updateProductStatus(productId: number, status: string): Promise<void> {
  const res = await fetch(`${BASE}/${productId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  const json: ApiResponse<null> = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? '상태 변경 실패')
}
