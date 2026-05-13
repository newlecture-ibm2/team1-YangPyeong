import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'
import { cookies } from 'next/headers'

/** POST /api/admin/community/notices → 공지 작성 프록시 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const cookieStore = await cookies()
    const token = cookieStore.get('accessToken')?.value

    const res = await fetch(`${BACKEND_URL}/api/admin/community/notices`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(body)
    })
    
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] POST /admin/community/notices 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-COMM-005', message: '공지 작성 실패' } },
      { status: 502 }
    )
  }
}
