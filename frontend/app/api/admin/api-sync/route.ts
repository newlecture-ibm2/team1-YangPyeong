import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

/** GET /api/admin/api-sync ???�체 목록 조회 ?�록??*/
export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/api-sync`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] GET /admin/api-sync ?�패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-SYNC-001', message: '백엔???�결 ?�패' } },
      { status: 502 }
    )
  }
}
