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

  // ── 2. 세션 쿠키 존재 여부 및 skipAuth 확인 ──
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);
  const isAuthenticated = !!sessionCookie?.value;

  const skipAuth = process.env.SKIP_AUTH === 'true';

  // ── 3. 역할(Role) 기반 제어를 위해 Role 파싱 (가장 먼저 수행) ──
  // ⚠️ 실제 API 권한 검증은 백엔드에서 수행하며, 이는 UX용 라우트 가드입니다.
  let userRole = '';
  if (skipAuth) {
    // 개발/시연 모드: 테스트 편의를 위해 GOV 역할로 시뮬레이션
    userRole = 'GOV';
  } else if (isAuthenticated) {
    // 방법 1: fb-user 쿠키에서 role 읽기 (로그인 시 BFF가 설정한 non-httpOnly 쿠키)
    const userCookie = request.cookies.get('fb-user');
    if (userCookie?.value) {
      try {
        const userData = JSON.parse(decodeURIComponent(userCookie.value));
        userRole = (userData.role || '').toUpperCase();
      } catch {
        // 파싱 실패 시 fallback으로 넘어감
      }
    }

    // 방법 2: fb-user가 없으면 fb-session에서 JWT 추출 후 role 파싱 (fallback)
    if (!userRole && sessionCookie?.value) {
      try {
        const decoded = Buffer.from(sessionCookie.value, 'base64').toString('utf-8');
        const sessionData = JSON.parse(decoded);
        const jwt = sessionData.token || sessionData.accessToken;
        if (jwt) {
          const parts = jwt.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
            userRole = (payload.role || '').toUpperCase();
          }
        }
      } catch {
        // 무시
      }
    }
  }

  // ── 4. GOV 롤 사용자 강제 격리 ──
  // GOV 사용자는 어떤 URL로 접근하든 무조건 /gov 로 보냅니다. (PUBLIC_PATHS 포함)
  // 단, skipAuth=true 인 개발 모드에서는 프론트엔드 일반 페이지 테스트를 위해 격리하지 않습니다.
  if (userRole === 'GOV' && !skipAuth) {
    if (!pathname.startsWith('/gov')) {
      return NextResponse.redirect(new URL('/gov', request.url));
    }
    // 이미 /gov 경로라면 통과
    return NextResponse.next();
  }

  // ── 5. 이미 로그인한 사용자가 /login, /signup 접근 시 → 홈으로 리다이렉트 ──
  const userCookieDetail = request.cookies.get('fb-user');
  const hasUserDetail = !!userCookieDetail?.value;
  if (isAuthenticated && hasUserDetail && AUTH_REDIRECT_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // ── 6. 공개 경로는 인증 없이 통과 ──
  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isPublicPath) {
    return NextResponse.next();
  }

  // ── 7. 보호된 경로에 미인증 접근 시 → /login 리다이렉트 ──
  if (!isAuthenticated && !skipAuth) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── 8. /admin 경로 접근 차단 — ADMIN만 허용 ──
  if (pathname.startsWith('/admin')) {
    if (userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // ── 9. /gov 경로 접근 차단 — GOV 또는 ADMIN만 허용 ──
  if (pathname.startsWith('/gov')) {
    // GOV 롤은 4단계에서 이미 next()로 통과했으므로 여기 도달한 사람은 ADMIN 또는 일반 유저입니다.
    if (userRole !== 'ADMIN' && userRole !== 'GOV') {
      return NextResponse.redirect(new URL('/', request.url));
    }
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
