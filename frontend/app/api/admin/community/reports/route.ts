import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const qs = searchParams.toString()
    const url = `${BACKEND_URL}/api/admin/community/reports${qs ? `?${qs}` : ''}`
    
    const res = await fetch(url)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] GET /admin/community/reports 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-COMM-003', message: '백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}
