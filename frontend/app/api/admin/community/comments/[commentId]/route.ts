import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/cookie';
import { BACKEND_URL } from '@/lib/constants'

/** DELETE /api/admin/community/comments/:commentId → 댓글 삭제 프록시 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const session = await getSessionFromCookie();
    const { commentId } = await params
    const res = await fetch(`${BACKEND_URL}/api/admin/community/comments/${commentId}`,  { headers: { ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}) },  method: 'DELETE' })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] DELETE /admin/community/comments/:commentId 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-COMM-008', message: '댓글 삭제 실패' } },
      { status: 502 }
    )
  }
}
