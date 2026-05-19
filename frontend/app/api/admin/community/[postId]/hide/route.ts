import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'
import { getSessionFromCookie } from '@/lib/cookie'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getSessionFromCookie()
    const { postId } = await params
    const body = await request.json()

    const res = await fetch(`${BACKEND_URL}/api/admin/community/${postId}/hide`, { 
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session?.token || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    
    if (!res.ok) {
        throw new Error('Backend responded with status: ' + res.status)
    }

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] PATCH /admin/community/:postId/hide 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-COMM-HIDE-01', message: '게시글 숨김 처리 실패' } },
      { status: 502 }
    )
  }
}
