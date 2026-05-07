import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

/** GET /api/admin/crops/categories ??백엔???�록??*/
export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/crops/categories`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] GET /admin/crops/categories ?�패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-CROP-003', message: '백엔???�결 ?�패' } },
      { status: 502 }
    )
  }
}

/** POST /api/admin/crops/categories ??백엔???�록??*/
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const res = await fetch(`${BACKEND_URL}/api/admin/crops/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] POST /admin/crops/categories ?�패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-CROP-006', message: '백엔???�결 ?�패' } },
      { status: 502 }
    )
  }
}

