import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

/** POST /api/admin/users/:id/withdraw → 사용자 강제 탈퇴 프록시 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const res = await fetch(`${BACKEND_URL}/api/admin/users/${id}/withdraw`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] POST /admin/users/:id/withdraw 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-USER-004', message: '강제 탈퇴 처리 실패' } },
      { status: 502 }
    )
  }
}
