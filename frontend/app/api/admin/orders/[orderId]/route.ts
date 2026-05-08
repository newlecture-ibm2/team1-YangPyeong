import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

/** PATCH /api/admin/orders/:orderId 상태 변경 프록시 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params
    const body = await request.json()
    const res = await fetch(`${BACKEND_URL}/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] PATCH /admin/orders/:orderId 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-ORDER-002', message: '상태 변경 실패' } },
      { status: 502 }
    )
  }
}
