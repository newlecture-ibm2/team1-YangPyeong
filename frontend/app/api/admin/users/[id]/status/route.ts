import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/cookie';
import { BACKEND_URL } from '@/lib/constants'

interface RouteParams {
  params: Promise<{ id: string }>
}

/** PATCH /api/admin/users/:id/status → 상태 변경 프록시 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromCookie();
    const { id } = await params
    const body = await request.json()
    const res = await fetch(`${BACKEND_URL}/api/admin/users/${id}/status`,  {
      method: 'PATCH',
      headers: { ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),  'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] PATCH /admin/users/:id/status 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-USER-003', message: '백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}
