import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'
import { safeJsonParse } from '@/lib/safe-json'

/** GET /api/admin/users 백엔드 프록시 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const res = await fetch(`${BACKEND_URL}/api/admin/users?${searchParams.toString()}`)
    const data = await safeJsonParse(res, '/admin/users GET')
    if (!data) {
      if (res.status === 401 || res.status === 403) {
        return NextResponse.json(
          { success: false, data: null, error: { code: 'E-BFF-AUTH-001', message: '인증 필요' } },
          { status: res.status },
        )
      }
      return NextResponse.json(
        { success: false, data: null, error: { code: 'E-BFF-USER-002', message: '백엔드 응답 없음' } },
        { status: 502 },
      )
    }
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] GET /admin/users 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-USER-001', message: '백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}

/** POST /api/admin/users 백엔드 프록시 (특수 계정 발급) */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const res = await fetch(`${BACKEND_URL}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await safeJsonParse(res, '/admin/users POST')
    if (!data) {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'E-BFF-USER-007', message: '백엔드 응답 없음' } },
        { status: 502 },
      )
    }
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] POST /admin/users 실패:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-USER-006', message: '계정 발급 처리 실패' } },
      { status: 502 }
    )
  }
}
