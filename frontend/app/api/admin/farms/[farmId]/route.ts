import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/cookie';
import { BACKEND_URL } from '@/lib/constants'

/** DELETE /api/admin/farms/[farmId] 백엔드 프록시 (농장 강제 삭제) */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    const session = await getSessionFromCookie();
    
    // await params 처리 (Next.js 15 동적 라우팅 권장 사항)
    const { farmId } = await params;
    
    const res = await fetch(`${BACKEND_URL}/api/admin/farms/${farmId}`, {
      method: 'DELETE',
      headers: {
        ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {})
      }
    })
    
    if (res.status === 204 || res.status === 200) {
      return NextResponse.json({ success: true, data: null })
    }
    
    // 백엔드 에러 응답 파싱
    let errorData;
    try {
      errorData = await res.json()
    } catch {
      errorData = null
    }

    if (res.status === 401 || res.status === 403) {
      return NextResponse.json(
        { success: false, data: null, error: { code: 'E-BFF-AUTH-001', message: '인증 필요' } },
        { status: res.status }
      )
    }

    return NextResponse.json(
      { success: false, data: null, error: errorData?.error || { code: 'E-BFF-FARM-003', message: '농장 삭제 실패' } },
      { status: res.status }
    )
  } catch (error) {
    console.error(`[BFF] DELETE /admin/farms/[farmId] 실패:`, error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-FARM-004', message: '백엔드 연결 실패' } },
      { status: 502 }
    )
  }
}
