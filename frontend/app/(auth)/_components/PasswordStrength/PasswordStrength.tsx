'use client';

import { useMemo } from 'react';
import styles from './PasswordStrength.module.css';

interface PasswordStrengthProps {
  password: string;
  strength: { level: number; text: string };
}

/**
 * 비밀번호 강도 표시 (체크리스트 + 강도 바)
 * 회원가입 / 비밀번호 재설정에서 공통 사용
 */
export default function PasswordStrength({ password, strength }: PasswordStrengthProps) {
  const composition = useMemo(() => {
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const hasLength = password.length >= 8;
    return [
      { ok: hasLetter, label: '영문자' },
      { ok: hasNumber, label: '숫자' },
      { ok: hasSpecial, label: '특수문자' },
      { ok: hasLength, label: '8자 이상' },
    ];
  }, [password]);

  if (password.length < 1) return null;

  return (
    <>
      {/* 조합 체크리스트 */}
      <div className={styles.checks}>
        {composition.map((item) => (
          <span key={item.label} className={item.ok ? styles.checkPass : styles.checkFail}>
            {item.ok ? '✓' : '✕'} {item.label}
          </span>
        ))}
      </div>

      {/* 강도 바 (6자 이상일 때 표시) */}
      {password.length >= 6 && (
        <>
          <div className={styles.strengthBar}>
            {[1, 2, 3].map((seg) => (
              <div
                key={seg}
                className={`${styles.strengthSegment} ${
                  strength.level >= seg
                    ? seg === 1 ? styles.strengthWeak
                      : seg === 2 ? styles.strengthMedium
                      : styles.strengthStrong
                    : ''
                }`}
              />
            ))}
          </div>
          <div className={`${styles.strengthText} ${
            strength.level === 1 ? styles.strengthTextWeak
              : strength.level === 2 ? styles.strengthTextMedium
              : styles.strengthTextStrong
          }`}>
            비밀번호 강도: {strength.text}
          </div>
        </>
      )}
    </>
  );
}
