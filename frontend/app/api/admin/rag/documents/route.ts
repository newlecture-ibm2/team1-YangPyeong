import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

/** GET /api/admin/rag/documents ??Î∞±Ïóî???ÑÎ°ù??*/
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const query = categoryId ? `?categoryId=${categoryId}` : ''
    const res = await fetch(`${BACKEND_URL}/api/admin/rag/documents${query}`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] GET /admin/rag/documents ?§Ìå®:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-RAG-005', message: 'Î∞±Ïóî???∞Í≤∞ ?§Ìå®' } },
      { status: 502 }
    )
  }
}

/** POST /api/admin/rag/documents ??Î∞±Ïóî???ÑÎ°ù??(JSON ?êÎäî multipart/form-data) */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    // ?åÏùº ?ÖÎ°ú??(multipart/form-data)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const res = await fetch(`${BACKEND_URL}/api/admin/rag/documents/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      return NextResponse.json(data, { status: res.status })
    }

    // ?çÏä§??Î¨∏ÏÑú (JSON)
    const body = await request.json()
    const res = await fetch(`${BACKEND_URL}/api/admin/rag/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] POST /admin/rag/documents ?§Ìå®:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-RAG-006', message: 'Î∞±Ïóî???∞Í≤∞ ?§Ìå®' } },
      { status: 502 }
    )
  }
}
