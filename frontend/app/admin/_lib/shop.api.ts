import type { ApiResponse, AdminProductListResponse } from './shop.types'

const BASE = '/api/admin/shop'

export async function fetchProducts(
  keyword = '',
  category = 'ALL',
  status = 'ALL',
  sort = 'createdAt',
  page = 0,
  size = 20
): Promise<AdminProductListResponse> {
  const query = new URLSearchParams({
    keyword,
    category,
    status,
    sort,
    page: page.toString(),
    size: size.toString(),
  })
  const res = await fetch(`${BASE}?${query.toString()}`)
  const json: ApiResponse<AdminProductListResponse> = await res.json()
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
