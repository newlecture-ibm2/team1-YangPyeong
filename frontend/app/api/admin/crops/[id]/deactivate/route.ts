import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

/** PATCH /api/admin/crops/[id]/deactivate → 백엔드 프록시 */
export async function PATCH(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const res = await fetch(`${BACKEND_URL}/api/admins/crops/${id}/deactivate`, { method: 'PATCH' })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] PATCH /admin/crops/[id]/deactivate 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-CROP-005', message: '백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}
