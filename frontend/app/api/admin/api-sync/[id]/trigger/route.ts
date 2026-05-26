import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/cookie';
import { BACKEND_URL } from '@/lib/constants'

/** POST /api/admin/api-sync/:id/trigger → 수동 동기화 트리거 프록시 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromCookie();
    const { id } = await params
    const backendUrl = new URL(`${BACKEND_URL}/api/admin/api-sync/${id}/trigger`)
    const syncMode = request.nextUrl.searchParams.get('syncMode')
    if (syncMode) {
      backendUrl.searchParams.set('syncMode', syncMode)
    }
    const res = await fetch(backendUrl.toString(),  { headers: { ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}) }, 
      method: 'POST',
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] POST /admin/api-sync/:id/trigger 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-SYNC-003', message: '동기화 트리거 실패' } },
      { status: 502 }
    )
  }
}
