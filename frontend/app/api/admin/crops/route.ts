import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

/** GET /api/admin/crops → 백엔드 프록시 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.toString() ? `?${searchParams}` : ''
    const res = await fetch(`${BACKEND_URL}/api/admins/crops${query}`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] GET /admin/crops 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-CROP-001', message: '백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}

/** POST /api/admin/crops → 작물 등록 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const res = await fetch(`${BACKEND_URL}/api/admins/crops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] POST /admin/crops 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-CROP-002', message: '백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}
