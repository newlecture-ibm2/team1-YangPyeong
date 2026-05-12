import { Eye, EyeOff } from 'lucide-react';

const iconProps = { size: 20 as const, strokeWidth: 1.75 as const, 'aria-hidden': true as const };

/** 비밀번호 필드 토글 버튼용 — 마크업은 Input.tsx가 아닌 여기서만 관리 */
export function PasswordVisibilityGlyph({ revealed }: { revealed: boolean }) {
  return revealed ? <EyeOff {...iconProps} /> : <Eye {...iconProps} />;
}
