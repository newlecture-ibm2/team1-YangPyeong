import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

/** GET /api/admin/users ??諛깆뿏???꾨줉??*/
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const res = await fetch(`${BACKEND_URL}/api/admin/users?${searchParams.toString()}`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] GET /admin/users ?ㅽ뙣:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-USER-001', message: '諛깆뿏???곌껐 ?ㅽ뙣' } },
      { status: 502 }
    )
  }
}
