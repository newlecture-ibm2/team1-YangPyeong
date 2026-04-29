/* ════════════════════════════════════════════════════════
   FarmBalance — 클라이언트 사이드 유틸리티
   ════════════════════════════════════════════════════════ */

/**
 * 비밀번호 강도를 체크합니다.
 * @returns level 0~3 (0: 미달, 1: 약함, 2: 보통, 3: 강함)
 */
export function getPasswordStrength(pw: string): { level: number; text: string } {
  if (pw.length < 6) return { level: 0, text: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: 1, text: '약함' };
  if (score <= 2) return { level: 2, text: '보통' };
  return { level: 3, text: '강함' };
}
