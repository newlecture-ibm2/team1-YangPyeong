import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/cookie';
import { BACKEND_URL } from '@/lib/constants'

/** GET /api/admin/community/:postId/comments → 댓글 목록 조회 프록시 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getSessionFromCookie();
    const { postId } = await params
    const res = await fetch(`${BACKEND_URL}/api/admin/community/${postId}/comments`, { headers: { ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}) } })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] GET /admin/community/:postId/comments 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-COMM-007', message: '댓글 목록 조회 실패' } },
      { status: 502 }
    )
  }
}
