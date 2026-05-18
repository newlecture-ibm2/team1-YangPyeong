import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const backendUrl = process.env.INTERNAL_BACKEND_URL || 'http://localhost:8080';
    const cookieHeader = req.headers.get('cookie');
    
    const response = await fetch(`${backendUrl}/api/admin/data/graph-refresh`, {
      method: "POST",
      headers: cookieHeader ? { 'cookie': cookieHeader } : {}
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json({ error: "백엔드 연결 실패" }, { status: 500 });
  }
}
