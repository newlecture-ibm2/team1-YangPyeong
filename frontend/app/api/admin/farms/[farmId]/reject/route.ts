import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

interface RouteParams {
  params: Promise<{ farmId: string }>
}

/** PATCH /api/admin/farms/:farmId/reject → 반려 프록시 (반려 사유 포함) */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { farmId } = await params
    const body = await request.json()

    const res = await fetch(`${BACKEND_URL}/api/admin/farms/${farmId}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] PATCH /admin/farms/:farmId/reject 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-FARM-003', message: '백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}
