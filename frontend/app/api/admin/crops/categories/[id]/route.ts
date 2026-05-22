import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/cookie';
import { BACKEND_URL } from '@/lib/constants'

/** PATCH /api/admin/crops/categories/[id] → 백엔드 프록시 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromCookie();
    const { id } = await params
    const body = await request.json()
    const res = await fetch(`${BACKEND_URL}/api/admin/crops/categories/${id}`,  {
      method: 'PATCH',
      headers: { ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),  'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] PATCH /admin/crops/categories/[id] 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-CROP-007', message: '백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}

/** DELETE /api/admin/crops/categories/[id] → 백엔드 프록시 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromCookie();
    const { id } = await params
    const res = await fetch(`${BACKEND_URL}/api/admin/crops/categories/${id}`,  { headers: { ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}) },  method: 'DELETE' })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] DELETE /admin/crops/categories/[id] 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-CROP-008', message: '백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}
