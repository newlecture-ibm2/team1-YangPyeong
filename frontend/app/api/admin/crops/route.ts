import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

/** GET /api/admin/crops ??諛깆뿏???꾨줉??*/
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.toString() ? `?${searchParams}` : ''
    const res = await fetch(`${BACKEND_URL}/api/admin/crops${query}`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] GET /admin/crops ?ㅽ뙣:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-CROP-001', message: '諛깆뿏???곌껐 ?ㅽ뙣' } },
      { status: 502 }
    )
  }
}

/** POST /api/admin/crops ???묐Ъ ?깅줉 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const res = await fetch(`${BACKEND_URL}/api/admin/crops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] POST /admin/crops ?ㅽ뙣:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-CROP-002', message: '諛깆뿏???곌껐 ?ㅽ뙣' } },
      { status: 502 }
    )
  }
}
