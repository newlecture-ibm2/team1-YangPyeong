import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'
import { getSessionFromCookie } from '@/lib/cookie'

/** DELETE /api/admin/community/:postId → 게시글 삭제 프록시 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getSessionFromCookie()
    const { postId } = await params
    const res = await fetch(`${BACKEND_URL}/api/admin/community/${postId}`, { 
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session?.token || ''}`
      }
    })
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

/** GET /api/admin/community/:postId → 게시글 상세 조회 프록시 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getSessionFromCookie()
    const { postId } = await params
    const res = await fetch(`${BACKEND_URL}/api/admin/community/${postId}`, {
      headers: {
        'Authorization': `Bearer ${session?.token || ''}`
      }
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] GET /admin/community/:postId 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-COMM-006', message: '게시글 상세 조회 실패' } },
      { status: 502 }
    )
  }
}
