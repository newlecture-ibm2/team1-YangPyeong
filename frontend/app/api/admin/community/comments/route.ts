import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'
import { getSessionFromCookie } from '@/lib/cookie'

export async function GET(request: Request) {
  try {
    const session = await getSessionFromCookie()
    if (!session?.token) {
      return NextResponse.json({ success: false, error: { code: 'E-AUTH-001', message: '인증이 필요합니다.' } }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const res = await fetch(`${BACKEND_URL}/api/admin/community/comments?${searchParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${session.token}`,
      }
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] GET /admin/community/comments 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-COMM-009', message: '댓글 목록 조회 실패' } },
      { status: 502 }
    )
  }
}
