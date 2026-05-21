import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/cookie'
import { BACKEND_URL } from '@/lib/constants'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const session = await getSessionFromCookie()
    if (!session?.token) {
      return NextResponse.json({ success: false, error: { code: 'E-AUTH-001', message: '인증이 필요합니다.' } }, { status: 401 })
    }

    // Proxy request to backend
    const backendUrl = `${BACKEND_URL}/api/admin/community/reports/target/sanction`
    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    const result = await res.json()
    return NextResponse.json(result, { status: res.status })
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'E-COMMUNITY-999', message: '신고 제재 처리 실패' } }, { status: 500 })
  }
}
