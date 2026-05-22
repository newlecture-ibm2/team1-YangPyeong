import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/cookie';
import { BACKEND_URL } from '@/lib/constants'

/** GET /api/admin/policy 전체 정책 목록 프록시*/
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    const res = await fetch(`${BACKEND_URL}/api/admin/policy`, { headers: { ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}) } })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] GET /admin/policy 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-POL-001', message: '백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}

/** POST /api/admin/policy 정책 등록 프록시*/
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    const body = await request.json()
    const res = await fetch(`${BACKEND_URL}/api/admin/policy`,  {
      method: 'POST',
      headers: { ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),  'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] POST /admin/policy 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-POL-002', message: '정책 등록 실패' } },
      { status: 502 }
    )
  }
}
