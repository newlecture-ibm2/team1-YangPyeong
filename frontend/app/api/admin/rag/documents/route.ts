import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/cookie';
import { BACKEND_URL } from '@/lib/constants'

/** GET /api/admin/rag/documents 백엔드 프록시 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const query = categoryId ? `?categoryId=${categoryId}` : ''
    const res = await fetch(`${BACKEND_URL}/api/admin/rag/documents${query}`, { headers: { ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}) } })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] GET /admin/rag/documents 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-RAG-005', message: '백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}

/** POST /api/admin/rag/documents 백엔드 프록시(JSON 또는 multipart/form-data) */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    const contentType = request.headers.get('content-type') || ''

    // 파일 업로드(multipart/form-data)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const res = await fetch(`${BACKEND_URL}/api/admin/rag/documents/upload`,  { headers: { ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}) }, 
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      return NextResponse.json(data, { status: res.status })
    }

    // 텍스트 문서 (JSON)
    const body = await request.json()
    const res = await fetch(`${BACKEND_URL}/api/admin/rag/documents`,  {
      method: 'POST',
      headers: { ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),  'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] POST /admin/rag/documents 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-RAG-006', message: '백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}
