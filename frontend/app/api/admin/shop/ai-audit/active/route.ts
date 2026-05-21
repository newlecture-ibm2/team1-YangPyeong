import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'
import { cookies } from 'next/headers'

/** POST /api/admin/shop/ai-audit/active → 기승인 상품 AI 일괄 재검수 프록시 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const res = await fetch(`${BACKEND_URL}/api/admin/shop/ai-audit/active`, {
      method: 'POST',
      headers
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] POST /admin/shop/ai-audit/active 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-SHOP-005', message: 'AI 재검수 백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}
