import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'
import { getSessionFromCookie } from '@/lib/cookie'

/** GET /api/admin/community 전체 게시글 목록 프록시 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie()
    const { searchParams } = new URL(request.url)
    const qs = searchParams.toString()
    const url = qs ? `${BACKEND_URL}/api/admin/community?${qs}` : `${BACKEND_URL}/api/admin/community`
    
    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${session?.token || ''}`
      }
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] GET /admin/community 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-COMM-001', message: '백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}
