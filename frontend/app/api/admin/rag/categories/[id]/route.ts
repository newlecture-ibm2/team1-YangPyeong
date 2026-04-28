import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080'

interface RouteParams {
  params: Promise<{ id: string }>
}

/** PATCH /api/admin/rag/categories/:id → 백엔드 프록시 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const body = await request.json()
  const res = await fetch(`${BACKEND_URL}/api/admins/rag/categories/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

/** DELETE /api/admin/rag/categories/:id → 백엔드 프록시 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const res = await fetch(`${BACKEND_URL}/api/admins/rag/categories/${id}`, {
    method: 'DELETE',
  })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}
