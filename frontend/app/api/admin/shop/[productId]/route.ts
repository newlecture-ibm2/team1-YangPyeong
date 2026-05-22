import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/cookie';
import { BACKEND_URL } from '@/lib/constants'

/** PATCH /api/admin/shop/:productId → 상품 상태 변경 프록시 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getSessionFromCookie();
    const { productId } = await params
    const body = await request.json()
    const res = await fetch(`${BACKEND_URL}/api/admin/shop/${productId}`,  {
      method: 'PATCH',
      headers: { ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),  'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] PATCH /admin/shop/:productId 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-SHOP-002', message: '상태 변경 실패' } },
      { status: 502 }
    )
  }
}

/** DELETE /api/admin/shop/:productId → 상품 삭제(Soft Delete) 프록시 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getSessionFromCookie();
    const { productId } = await params
    const res = await fetch(`${BACKEND_URL}/api/admin/shop/${productId}`,  { headers: { ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}) }, 
      method: 'DELETE',
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] DELETE /admin/shop/:productId 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-SHOP-003', message: '상품 삭제 실패' } },
      { status: 502 }
    )
  }
}
