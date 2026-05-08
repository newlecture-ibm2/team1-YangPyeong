import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

/** GET /api/admin/policy ???꾩껜 ?뺤콉 紐⑸줉 ?꾨줉??*/
export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/policy`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] GET /admin/policy ?ㅽ뙣:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-POL-001', message: '諛깆뿏???곌껐 ?ㅽ뙣' } },
      { status: 502 }
    )
  }
}

/** POST /api/admin/policy ???뺤콉 ?깅줉 ?꾨줉??*/
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const res = await fetch(`${BACKEND_URL}/api/admin/policy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] POST /admin/policy ?ㅽ뙣:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-POL-002', message: '?뺤콉 ?깅줉 ?ㅽ뙣' } },
      { status: 502 }
    )
  }
}
