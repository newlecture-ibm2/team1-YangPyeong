import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/cookie';
import { BACKEND_URL } from '@/lib/constants'

/** PATCH /api/admin/api-sync/:id/toggle → On/Off 토글 프록시 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookie();
    const { id } = await params
    const body = await request.json()
    const res = await fetch(`${BACKEND_URL}/api/admin/api-sync/${id}/toggle`,  {
      method: 'PATCH',
      headers: { ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),  'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] PATCH /admin/api-sync/:id/toggle 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-SYNC-002', message: '상태 변경 실패' } },
      { status: 502 }
    )
  }
}
