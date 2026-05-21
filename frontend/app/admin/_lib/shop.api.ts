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

export async function updateProductStatus(productId: number, status: string, reason?: string): Promise<void> {
  const res = await fetch(`/api/admin/shop/${productId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, reason })
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || '상태 변경에 실패했습니다.')
  }
}

export async function deleteAdminProduct(productId: number): Promise<void> {
  const res = await fetch(`/api/admin/shop/${productId}`, {
    method: 'DELETE'
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.message || '상품 삭제에 실패했습니다.')
  }
}

export async function aiAuditProducts(): Promise<{ approvedCount: number }> {
  const res = await fetch('/api/admin/shop/ai-audit', {
    method: 'POST',
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error?.message ?? 'AI 자동 심사 실패')
  return json.data
}
