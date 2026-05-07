import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

/** GET /api/admin/community ???„ì²´ ê²Œì‹œê¸€ ëª©ë¡ ?„ë¡??*/
export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/community`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] GET /admin/community ?¤íŒ¨:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-COMM-001', message: 'ë°±ì—”???°ê²° ?¤íŒ¨' } },
      { status: 502 }
    )
  }
}

/** DELETE /api/admin/community ??ê²Œì‹œê¸€ ?? œ ?„ë¡??*/
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const pathParts = url.pathname.split('/')
    const postId = pathParts[pathParts.length - 1]
    const res = await fetch(`${BACKEND_URL}/api/admin/community/${postId}`, { method: 'DELETE' })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] DELETE /admin/community ?¤íŒ¨:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-COMM-002', message: 'ê²Œì‹œê¸€ ?? œ ?¤íŒ¨' } },
      { status: 502 }
    )
  }
}
