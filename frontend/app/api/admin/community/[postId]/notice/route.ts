import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/cookie';
import { BACKEND_URL } from '@/lib/constants'

/** PATCH /api/admin/community/:postId/notice → 공지 토글 프록시 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getSessionFromCookie();
    const { postId } = await params
    const body = await request.json()
    const res = await fetch(`${BACKEND_URL}/api/admin/community/${postId}/notice`,  {
      method: 'PATCH',
      headers: { ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),  'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] PATCH /admin/community/:postId/notice 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-COMM-003', message: '공지 설정 실패' } },
      { status: 502 }
    )
  }
}
