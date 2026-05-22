import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/cookie';
import { BACKEND_URL } from '@/lib/constants'

/** POST /api/admin/shop/ai-audit → 상품 AI 일괄 심사 프록시 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    const res = await fetch(`${BACKEND_URL}/api/admin/shop/ai-audit`,  { headers: { ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}) }, 
      method: 'POST',
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] POST /admin/shop/ai-audit 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-SHOP-004', message: 'AI 자동 심사 백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}
