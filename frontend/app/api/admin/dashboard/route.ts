import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/cookie';
import { BACKEND_URL } from '@/lib/constants'
import { safeJsonParse } from '@/lib/safe-json'

/** GET /api/admin/dashboard 대시보드 KPI 프록시 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    const res = await fetch(`${BACKEND_URL}/api/admin/dashboard`, { headers: { ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}) } })
    const data = await safeJsonParse(res, '/admin/dashboard')
    if (!data) {
      if (res.status === 401 || res.status === 403) {
        return NextResponse.json(
          { success: false, data: null, error: { code: 'E-BFF-AUTH-001', message: '인증 필요' } },
          { status: res.status },
        )
      }
      return NextResponse.json(
        { success: false, data: null, error: { code: 'E-BFF-DASH-002', message: '백엔드 응답 없음' } },
        { status: 502 },
      )
    }
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] GET /admin/dashboard 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-DASH-001', message: '백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}
