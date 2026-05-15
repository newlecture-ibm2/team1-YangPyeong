import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/balance-engine/data`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] GET /admin/balance-engine/data 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-BAL-001', message: '백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}
