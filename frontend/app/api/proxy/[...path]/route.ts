/* ════════════════════════════════════════════════════════
   BFF Catch-all Proxy — /api/proxy/[...path]
   
   팀원들이 개별 API route를 만들지 않아도 되는 범용 프록시입니다.
   /api/proxy/dashboard/crop-balance → Spring Boot /api/dashboard/crop-balance
   
   ⚠ 주의: 로그인/로그아웃 등 특수 처리가 필요한 경로는
     전용 Route Handler(api/auth/login 등)를 사용하세요.
   ════════════════════════════════════════════════════════ */

import { NextRequest } from 'next/server';
import { proxyToBackend } from '@/lib/proxy';

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  // path 배열에서 'proxy' 세그먼트를 제거하여 백엔드 전달 경로 정규화
  const filteredPath = path.filter(p => p !== 'proxy');
  const backendPath = `/api/${filteredPath.join('/')}`;
  return proxyToBackend(request, backendPath);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
