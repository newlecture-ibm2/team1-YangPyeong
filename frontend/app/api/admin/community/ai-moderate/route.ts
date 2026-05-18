import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

/** POST /api/admin/community/ai-moderate → 커뮤니티 스팸 AI 일괄 청소 프록시 */
export async function POST(request: NextRequest) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/community/ai-moderate`, {
      method: 'POST',
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] POST /admin/community/ai-moderate 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-COMM-004', message: 'AI 스팸 청소 백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}
