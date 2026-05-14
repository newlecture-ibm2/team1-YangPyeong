import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

/** PATCH /api/admin/community/reports/:reportId/status → 신고 상태 변경 프록시 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ reportId: string }> }
) {
  try {
    const { reportId } = await params
    const body = await request.json()
    const res = await fetch(`${BACKEND_URL}/api/admin/community/reports/${reportId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] PATCH /admin/community/reports/:reportId/status 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-COMM-009', message: '신고 상태 변경 실패' } },
      { status: 502 }
    )
  }
}
