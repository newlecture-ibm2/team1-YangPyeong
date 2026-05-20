import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'
import { getSessionFromCookie } from '@/lib/cookie'

/** PATCH /api/admin/community/comments/:commentId/restore → 댓글 복구 프록시 */
export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const session = await getSessionFromCookie()
    if (!session?.token) {
      return NextResponse.json({ success: false, error: { code: 'E-AUTH-001', message: '인증이 필요합니다.' } }, { status: 401 })
    }

    const { commentId } = await params
    const res = await fetch(`${BACKEND_URL}/api/admin/community/comments/${commentId}/restore`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session.token}`,
        'Content-Type': 'application/json'
      }
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] PATCH /admin/community/comments/:commentId/restore 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-COMM-008', message: '댓글 복구 실패' } },
      { status: 502 }
    )
  }
}
