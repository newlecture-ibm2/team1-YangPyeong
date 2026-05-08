import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

interface RouteParams {
  params: Promise<{ farmId: string }>
}

/** PATCH /api/admin/farms/:farmId/approve → 승인 프록시 */
export async function PATCH(_request: NextRequest, { params }: RouteParams) {
  try {
    const { farmId } = await params
    const res = await fetch(`${BACKEND_URL}/api/admin/farms/${farmId}/approve`, {
      method: 'PATCH',
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] PATCH /admin/farms/:farmId/approve 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-FARM-002', message: '백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}
