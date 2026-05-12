import { Eye, EyeOff } from 'lucide-react';

const iconProps = { size: 20 as const, strokeWidth: 1.75 as const, 'aria-hidden': true as const };

/** 비밀번호 표시/숨김 토글 버튼 안에 넣는 아이콘 */
export function PasswordVisibilityIcon({ revealed }: { revealed: boolean }) {
  return revealed ? <EyeOff {...iconProps} /> : <Eye {...iconProps} />;
}
