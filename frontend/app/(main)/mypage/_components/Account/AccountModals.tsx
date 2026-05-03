'use client';

import { useState, useCallback, useMemo } from 'react';
import { getPasswordStrength } from '@/lib/utils';
import styles from './AccountModals.module.css';

/* ── 비밀번호 변경 모달 ── */
interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export function ChangePasswordModal({ isOpen, onClose, onSuccess, onError }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState('');
  const [currentPwError, setCurrentPwError] = useState('');

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  /** 비밀번호 조합 검증: 문자 + 숫자 + 특수문자 */
  const composition = useMemo(() => {
    const hasLetter = /[A-Za-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
    return { hasLetter, hasNumber, hasSpecial, isValid: hasLetter && hasNumber && hasSpecial };
  }, [newPassword]);

  const resetForm = useCallback(() => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setInlineError('');
    setCurrentPwError('');
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setInlineError('');
    setCurrentPwError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setInlineError('모든 필드를 입력해주세요.');
      return;
    }
    if (newPassword.length < 8) {
      setInlineError('새 비밀번호는 8자 이상이어야 합니다.');
      return;
    }
    if (!composition.isValid) {
      setInlineError('비밀번호는 영문자, 숫자, 특수문자를 모두 포함해야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setInlineError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (currentPassword === newPassword) {
      setInlineError('현재 비밀번호와 다른 비밀번호를 입력해주세요.');
      return;
    }
    if (strength.level < 2) {
      setInlineError('보안을 위해 더 강력한 비밀번호를 설정해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users/me/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (data.success) {
        resetForm();
        onSuccess();
        onClose();
      } else {
        const errMsg = data.error?.message || '비밀번호 변경에 실패했습니다.';
        // 현재 비밀번호 관련 에러는 해당 필드 아래에 표시
        if (errMsg.includes('현재 비밀번호') || errMsg.includes('올바르지')) {
          setCurrentPwError(errMsg);
        } else {
          setInlineError(errMsg);
        }
      }
    } catch {
      setInlineError('비밀번호 변경 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>비밀번호 변경</h2>

        {/* 인라인 에러 메시지 (현재 비밀번호 에러 제외) */}
        {inlineError && (
          <div className={styles.inlineError}>{inlineError}</div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>현재 비밀번호</label>
          <input
            type="password"
            className={`${styles.input} ${currentPwError ? styles.inputError : ''}`}
            value={currentPassword}
            onChange={(e) => { setCurrentPassword(e.target.value); setInlineError(''); setCurrentPwError(''); }}
            placeholder="현재 비밀번호 입력"
          />
          {currentPwError && (
            <div className={styles.fieldHint}>{currentPwError}</div>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>새 비밀번호</label>
          <input
            type="password"
            className={styles.input}
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); setInlineError(''); }}
            placeholder="8자 이상, 영문자·숫자·특수문자 포함"
          />
          {/* 비밀번호 조합 체크리스트 */}
          {newPassword.length > 0 && (
            <div className={styles.compositionChecks}>
              <span className={composition.hasLetter ? styles.checkPass : styles.checkFail}>
                {composition.hasLetter ? '✓' : '✕'} 영문자
              </span>
              <span className={composition.hasNumber ? styles.checkPass : styles.checkFail}>
                {composition.hasNumber ? '✓' : '✕'} 숫자
              </span>
              <span className={composition.hasSpecial ? styles.checkPass : styles.checkFail}>
                {composition.hasSpecial ? '✓' : '✕'} 특수문자
              </span>
              <span className={newPassword.length >= 8 ? styles.checkPass : styles.checkFail}>
                {newPassword.length >= 8 ? '✓' : '✕'} 8자 이상
              </span>
            </div>
          )}
          {newPassword.length >= 6 && (
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
              <span className={styles.strengthLabel}>{strength.text}</span>
            </div>
          )}
        </div>

        <div className={styles.field}>
          <label className={styles.label}>새 비밀번호 확인</label>
          <input
            type="password"
            className={styles.input}
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setInlineError(''); }}
            placeholder="새 비밀번호 재입력"
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <div className={styles.fieldHint}>비밀번호가 일치하지 않습니다.</div>
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={handleClose} disabled={isSubmitting}>
            취소
          </button>
          <button className={styles.submitBtn} onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '변경 중...' : '변경하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── 회원 탈퇴 모달 ── */
interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (msg: string) => void;
  isSocial?: boolean;
}

export function DeleteAccountModal({ isOpen, onClose, onSuccess, onError, isSocial = false }: DeleteAccountModalProps) {
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setPassword('');
    setConfirmText('');
    onClose();
  };

  const handleSubmit = async () => {
    // LOCAL 유저는 비밀번호 필수
    if (!isSocial && !password) {
      onError('비밀번호를 입력해주세요.');
      return;
    }
    if (confirmText !== '탈퇴합니다') {
      onError("확인을 위해 '탈퇴합니다'를 정확히 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const body: Record<string, string> = {};
      if (!isSocial) {
        body.password = password;
      }

      const res = await fetch('/api/users/me', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        onSuccess();
      } else {
        onError(data.error?.message || '회원 탈퇴에 실패했습니다.');
      }
    } catch {
      onError('회원 탈퇴 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={`${styles.title} ${styles.dangerTitle}`}>회원 탈퇴</h2>

        <div className={styles.warningBox}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <p>
            탈퇴 후에도 동일 계정으로 다시 로그인하면 계정을 복구할 수 있습니다.
          </p>
        </div>

        {/* LOCAL 유저만 비밀번호 입력 표시 */}
        {!isSocial && (
          <div className={styles.field}>
            <label className={styles.label} style={{ fontWeight: 500 }}>비밀번호 확인</label>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="현재 비밀번호 입력"
            />
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label} style={{ fontWeight: 500 }}>
            확인을 위해 <span style={{ color: '#ef4444', fontWeight: 600 }}>&apos;탈퇴합니다&apos;</span>를 입력해주세요
          </label>
          <input
            type="text"
            className={styles.input}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="탈퇴합니다"
          />
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={handleClose} disabled={isSubmitting}>
            취소
          </button>
          <button
            className={styles.dangerSubmitBtn}
            onClick={handleSubmit}
            disabled={isSubmitting || confirmText !== '탈퇴합니다'}
          >
            {isSubmitting ? '처리 중...' : '탈퇴하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
