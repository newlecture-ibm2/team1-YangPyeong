import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

/** GET /api/admin/farms?status=PENDING ??諛깆뿏???꾨줉??*/
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    const res = await fetch(`${BACKEND_URL}/api/admin/farms?status=${status}`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] GET /admin/farms ?ㅽ뙣:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-FARM-001', message: '諛깆뿏???곌껐 ?ㅽ뙣' } },
      { status: 502 }
    )
  }
}
