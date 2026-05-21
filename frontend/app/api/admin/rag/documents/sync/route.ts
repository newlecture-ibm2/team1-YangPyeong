import { NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/cookie'
import { BACKEND_URL } from '@/lib/constants'

export async function POST() {
  try {
    const session = await getSessionFromCookie()
    if (!session?.token) {
      return NextResponse.json({ success: false, error: { code: 'E-AUTH-001', message: '인증이 필요합니다.' } }, { status: 401 })
    }

    const res = await fetch(`${BACKEND_URL}/api/admin/rag/documents/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.token}`,
        'Content-Type': 'application/json',
      },
    })
    
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] RAG Sync 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-RAG-002', message: 'RAG 동기화 실패' } },
      { status: 502 }
    )
  }
}
