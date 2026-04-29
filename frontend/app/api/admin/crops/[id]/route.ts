import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

/** PATCH /api/admin/crops/[id] → 백엔드 프록시 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const res = await fetch(`${BACKEND_URL}/api/admins/crops/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] PATCH /admin/crops/[id] 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-CROP-004', message: '백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}
