/* ════════════════════════════════════════════════════════
   FarmBalance — 전화번호 유틸리티
   회원가입, 프로필 수정 등에서 공유하는 포맷/유효성 검사
   ════════════════════════════════════════════════════════ */

/** 전화번호 자동 포맷 (01012345678 → 010-1234-5678) */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
}

/** 전화번호 유효성 검사 (에러 메시지 또는 undefined) */
export function validatePhone(value: string): string | undefined {
  if (!value.trim()) return '연락처를 입력해주세요.';
  const cleaned = value.replace(/[\s-]/g, '');
  if (!/^\d{10,11}$/.test(cleaned)) return '올바른 전화번호 형식이 아닙니다.';
  if (!cleaned.startsWith('01')) return '휴대폰 번호는 01로 시작해야 합니다.';
  return undefined;
}

/** 전화번호 유효성 검사 (빈 값 허용 — 프로필 수정 등 선택 입력용) */
export function validatePhoneOptional(value: string): string | undefined {
  if (!value.trim()) return undefined;
  const cleaned = value.replace(/[\s-]/g, '');
  if (!/^\d{10,11}$/.test(cleaned)) return '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)';
  if (!cleaned.startsWith('01')) return '휴대폰 번호는 01로 시작해야 합니다.';
  return undefined;
}
