import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080'

/** GET /api/admin/rag/categories → 백엔드 프록시 */
export async function GET() {
  const res = await fetch(`${BACKEND_URL}/api/admins/rag/categories`)
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

/** POST /api/admin/rag/categories → 백엔드 프록시 */
export async function POST(request: NextRequest) {
  const body = await request.json()
  const res = await fetch(`${BACKEND_URL}/api/admins/rag/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
