import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

/** GET /api/admin/shop ???꾩껜 ?곹뭹 紐⑸줉 ?꾨줉??*/
export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/shop`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] GET /admin/shop ?ㅽ뙣:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-SHOP-001', message: '諛깆뿏???곌껐 ?ㅽ뙣' } },
      { status: 502 }
    )
  }
}
