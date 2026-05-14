import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

/** POST /api/admin/users/:id/reactivate → 관리자 수동 탈퇴 복구 프록시 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const res = await fetch(`${BACKEND_URL}/api/admin/users/${id}/reactivate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] POST /admin/users/:id/reactivate 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-USER-005', message: '수동 탈퇴 복구 실패' } },
      { status: 502 }
    )
  }
}
