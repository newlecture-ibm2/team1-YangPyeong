import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

/** DELETE /api/admin/community/:postId → 게시글 삭제 프록시 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const res = await fetch(`${BACKEND_URL}/api/admin/community/${postId}`, { method: 'DELETE' })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] DELETE /admin/community/:postId 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-COMM-002', message: '게시글 삭제 실패' } },
      { status: 502 }
    )
  }
}
