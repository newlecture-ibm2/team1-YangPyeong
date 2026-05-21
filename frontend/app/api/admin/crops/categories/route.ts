import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/cookie';
import { BACKEND_URL } from '@/lib/constants'

/** GET /api/admin/crops/categories 백엔드 프록시 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    const res = await fetch(`${BACKEND_URL}/api/admin/crops/categories`, { headers: { ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}) } })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] GET /admin/crops/categories 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-CROP-003', message: '백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}

/** POST /api/admin/crops/categories 백엔드 프록시 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    const body = await request.json()
    const res = await fetch(`${BACKEND_URL}/api/admin/crops/categories`,  {
      method: 'POST',
      headers: { ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),  'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] POST /admin/crops/categories 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-CROP-006', message: '백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}

