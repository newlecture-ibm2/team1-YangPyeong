import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/cookie';
import { BACKEND_URL } from '@/lib/constants'

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    const res = await fetch(`${BACKEND_URL}/api/admin/balance-engine/properties`, { headers: { ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}) } })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] GET /admin/balance-engine/properties 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-BAL-002', message: '백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSessionFromCookie();
    const body = await req.json()
    const res = await fetch(`${BACKEND_URL}/api/admin/balance-engine/properties`,  {
      method: 'PUT',
      headers: { ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),  'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] PUT /admin/balance-engine/properties 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-BAL-003', message: '백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}
