import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

/** POST /api/admin/api-sync/:id/health-check → 수동 헬스체크 트리거 프록시 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const res = await fetch(`${BACKEND_URL}/api/admin/api-sync/${id}/health-check`, {
      method: 'POST',
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] POST /admin/api-sync/:id/health-check 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-SYNC-004', message: '헬스체크 트리거 실패' } },
      { status: 502 }
    )
  }
}
