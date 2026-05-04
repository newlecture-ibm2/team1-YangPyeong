/**
 * JWT payload를 디코딩합니다 (서명 검증 없이 payload만 추출).
 * BFF 라우트에서 사용자 정보 추출 용도.
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split('.')[1];
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
