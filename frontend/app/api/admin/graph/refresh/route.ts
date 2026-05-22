import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/cookie';
import { BACKEND_URL } from '@/lib/constants'

/** POST /api/admin/graph/refresh → 지식 그래프 수동 동기화 프록시 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();

    const res = await fetch(`${BACKEND_URL}/api/admin/graph/refresh`, {
      method: 'POST',
      headers: { 
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}), 
        'Content-Type': 'application/json' 
      }
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] POST /admin/graph/refresh 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-RAG-001', message: '그래프 동기화 백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}
