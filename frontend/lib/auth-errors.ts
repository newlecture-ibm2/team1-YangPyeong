/* ════════════════════════════════════════════════════════
   인증 API — 예상 가능한 오류 분류
   (사용자 입력 실패 vs 세션/시스템 오류)
   ════════════════════════════════════════════════════════ */

/** 백엔드 ErrorCode — 로그인·계정 관련 */
export const AUTH_ERROR = {
  INVALID_CREDENTIALS: 'E-AUTH-LOGIN-001',
  ACCOUNT_SUSPENDED: 'E-AUTH-LOGIN-002',
  ACCOUNT_PENDING: 'E-AUTH-LOGIN-003',
  LOGIN_LOCKED: 'E-AUTH-LOGIN-004',
  USER_WITHDRAWN: 'E-USER-004',
} as const;

/** UI에서 처리하는 로그인 예상 오류 (console.error 제외) */
export const LOGIN_EXPECTED_ERROR_CODES: readonly string[] = [
  AUTH_ERROR.INVALID_CREDENTIALS,
  AUTH_ERROR.ACCOUNT_SUSPENDED,
  AUTH_ERROR.ACCOUNT_PENDING,
  AUTH_ERROR.LOGIN_LOCKED,
  AUTH_ERROR.USER_WITHDRAWN,
];

/**
 * BFF 로그인 응답 HTTP status 정규화.
 * 자격 증명 오류(401)만 200으로 — 브라우저 Console 401 노이즈 방지.
 * 정지/승인대기(403), 잠금(429) 등은 status 유지.
 */
export function normalizeLoginBffStatus(backendStatus: number, errorCode?: string | null): number {
  if (errorCode === AUTH_ERROR.INVALID_CREDENTIALS) {
    return 200;
  }
  return backendStatus;
}

export function isExpectedLoginError(errorCode?: string | null): boolean {
  return errorCode != null && LOGIN_EXPECTED_ERROR_CODES.includes(errorCode);
}

/** dev console.warn 대상 (403/429 등 — 선택적 warn) */
export function shouldWarnExpectedLoginError(errorCode?: string | null): boolean {
  return errorCode === AUTH_ERROR.ACCOUNT_SUSPENDED
    || errorCode === AUTH_ERROR.ACCOUNT_PENDING
    || errorCode === AUTH_ERROR.LOGIN_LOCKED
    || errorCode === AUTH_ERROR.USER_WITHDRAWN;
}
