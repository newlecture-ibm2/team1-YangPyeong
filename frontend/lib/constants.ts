/* ════════════════════════════════════════════════════════
   FarmBalance — 공통 상수 정의
   ════════════════════════════════════════════════════════ */

/** Spring Boot 백엔드 서버 주소 (서버 사이드 전용) */
export const BACKEND_URL =
  process.env.INTERNAL_BACKEND_URL || 'http://localhost:8080';

/** 쿠키에 저장할 세션 키 이름 */
export const SESSION_COOKIE_NAME = 'fb-session';

/** JWT Access Token 만료 시간 (ms) — 30분 */
export const ACCESS_TOKEN_TTL = 30 * 60 * 1000;

/** JWT Refresh Token 만료 시간 (ms) — 7일 */
export const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000;

/** 인증이 필요 없는 공개 경로 패턴 */
export const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/auth',
  '/balance',
  '/recommend',
  '/community',
  '/shop',
  '/stores',
];

/** 인증된 사용자가 접근하면 리다이렉트할 경로 */
export const AUTH_REDIRECT_PATHS = ['/login', '/signup'];

/** API 공통 응답 타입 (백엔드 ApiResponse<T> 매핑) */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
  meta?: {
    page?: number;
    size?: number;
    totalCount?: number;
    totalPages?: number;
  };
}
