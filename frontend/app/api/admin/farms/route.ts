import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/cookie';
import { BACKEND_URL } from '@/lib/constants'

/** GET /api/admin/farms?status=PENDING 백엔드 프록시 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    const res = await fetch(`${BACKEND_URL}/api/admin/farms?status=${status}`, { headers: { ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}) } })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] GET /admin/farms 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-FARM-001', message: '백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}
