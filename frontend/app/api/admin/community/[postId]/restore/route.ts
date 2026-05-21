import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'
import { getSessionFromCookie } from '@/lib/cookie'

/** PATCH /api/admin/community/:postId/restore → 게시글 복구 프록시 */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getSessionFromCookie()
    if (!session?.token) {
      return NextResponse.json({ success: false, error: { code: 'E-AUTH-001', message: '인증이 필요합니다.' } }, { status: 401 })
    }

    const { postId } = await params
    const res = await fetch(`${BACKEND_URL}/api/admin/community/${postId}/restore`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session.token}`,
        'Content-Type': 'application/json'
      }
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] PATCH /admin/community/:postId/restore 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-COMM-007', message: '게시글 복구 실패' } },
      { status: 502 }
    )
  }
}
