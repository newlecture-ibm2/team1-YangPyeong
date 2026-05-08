import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

/** GET /api/admin/community전체 게시글 목록 프록시 */
export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/community`)
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

/** DELETE /api/admin/community 게시글 삭제 프록시 */
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const postId = pathParts[pathParts.length - 1]
    const res = await fetch(`${BACKEND_URL}/api/admin/community/${postId}`, { method: 'DELETE' })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] DELETE /admin/community 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-COMM-002', message: '게시글 삭제 실패' } },
      { status: 502 }
    )
  }
}
