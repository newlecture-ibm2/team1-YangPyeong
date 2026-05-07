import { NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/constants'

/** GET /api/admin/dashboard ???Ä?úÎ≥¥??KPI ?ÑÎ°ù??*/
export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/dashboard`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error) {
    console.error('[BFF] GET /admin/dashboard ?§Ìå®:', error)
    return NextResponse.json(
      { success: false, data: null, error: { code: 'E-BFF-DASH-001', message: 'Î∞±Ïóî???∞Í≤∞ ?§Ìå®' } },
      { status: 502 }
    )
  }
}
