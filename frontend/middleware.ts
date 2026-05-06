/* ════════════════════════════════════════════════════════
   FarmBalance — Next.js Middleware
   
   모든 요청에 대해 실행되며, 인증 상태에 따른 라우팅 제어를 담당합니다.
   
   - 보호된 경로 → 미인증 시 /login 리다이렉트
   - 인증 경로 → 이미 로그인 시 / 리다이렉트
   - 관리자/지자체 경로 → 권한 확인 (TODO)
   ════════════════════════════════════════════════════════ */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, PUBLIC_PATHS, AUTH_REDIRECT_PATHS } from './lib/constants';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. 정적 파일, API Route, _next 내부 요청은 무시 ──
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // 정적 파일 (favicon, images 등)
  ) {
    return NextResponse.next();
  }

  // ── 2. 세션 쿠키 존재 여부 확인 ──
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const isAuthenticated = !!sessionCookie?.value;

  // ── 3. 이미 로그인한 사용자가 /login, /signup 접근 시 → 홈으로 리다이렉트 ──
  if (isAuthenticated && AUTH_REDIRECT_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // ── 4. 공개 경로는 인증 없이 통과 ──
  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isPublicPath) {
    return NextResponse.next();
  }

  // ── 5. 보호된 경로에 미인증 접근 시 → /login 리다이렉트 ──
  // SKIP_AUTH=true 설정 시 인증 없이 모든 페이지 접근 허용 (개발/시연용)
  const skipAuth = process.env.SKIP_AUTH === 'true';
  if (!isAuthenticated && !skipAuth) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 6. 역할(Role) 기반 라우팅 및 접근 제어 ──
  let userRole = '';
  if (skipAuth) {
    // 개발/시연 모드: GOV 역할로 시뮬레이션
    userRole = 'GOV';
  } else if (isAuthenticated) {
    // fb-user 쿠키에서 role 읽기 (로그인 시 BFF가 설정한 non-httpOnly 쿠키)
    const userCookie = request.cookies.get('fb-user');
    if (userCookie?.value) {
      try {
        const userData = JSON.parse(decodeURIComponent(userCookie.value));
        userRole = userData.role || '';
      } catch {
        // 쿠키 파싱 실패 시 무시
      }
    }
  }

  // GOV 롤이 홈(/) 접근 시 → 지자체 대시보드로 리다이렉트
  if (userRole === 'GOV' && pathname === '/') {
    return NextResponse.redirect(new URL('/gov', request.url));
  }

  // /gov 경로 접근 시 GOV 권한 검증 (SKIP_AUTH 모드에서는 이미 GOV 부여됨)
  if (pathname.startsWith('/gov') && !skipAuth && userRole !== 'GOV') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

/**
 * 미들웨어가 실행될 경로 매칭 설정
 * - /((?!_next/static|_next/image|favicon.ico).*) : 정적 자원 제외 모든 경로
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
