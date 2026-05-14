import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/community/categories`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] GET /community/categories 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-COMM-CAT', message: '카테고리 목록 조회 실패' } },
      { status: 502 }
    )
  }
}
