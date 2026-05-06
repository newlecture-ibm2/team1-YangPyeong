import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

/** GET /api/weather/current → 기상청 실시간 날씨 정보 프록시 */
export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/weather/current`, {
      cache: 'no-store' // 실시간 데이터이므로 캐시 방지
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] GET /weather/current 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-WTHR-001', message: '날씨 정보 조회 실패' } },
      { status: 502 }
    )
  }
}
