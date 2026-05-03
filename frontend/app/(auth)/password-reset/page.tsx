'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import AuthBrand from '../_components/AuthBrand';
import StepIndicator from '../_components/StepIndicator';
import PasswordStrength from '../_components/PasswordStrength';
import styles from './page.module.css';

import usePasswordReset from './usePasswordReset';

const RESET_STEPS = [
  { label: '이메일 확인' },
  { label: '본인 확인' },
  { label: '새 비밀번호' },
];

export default function ResetPasswordPage() {
  const router = useRouter();
  const hook = usePasswordReset();

  // ── 재설정 성공 화면 ──
  if (hook.success) {
    return (
      <div className={styles.authPage}>
        <div className={styles.authCard}>
          <AuthBrand />
          <h1 className={styles.authTitle}>재설정 완료! 🔐</h1>
          <div className={styles.successMsg}>
            비밀번호가 성공적으로 변경되었습니다.<br />
            새 비밀번호로 로그인해주세요.
          </div>
          <Button id="reset-go-login" variant="dark" size="lg" fullWidth onClick={() => router.push('/login')}>
            로그인하러 가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <AuthBrand />
        <h1 className={styles.authTitle}>비밀번호 재설정</h1>

        <StepIndicator steps={RESET_STEPS} currentStep={hook.step} />

        {hook.error && <div className={styles.errorMsg}>{hook.error}</div>}

        <form className={styles.form} onSubmit={hook.handleResetSubmit}>
          {hook.step === 1 && <Step1Email hook={hook} styles={styles} />}
          {hook.step === 2 && <Step2Answer hook={hook} styles={styles} />}
          {hook.step === 3 && <Step3NewPassword hook={hook} styles={styles} />}
        </form>

        <p className={styles.authFooter}>
          비밀번호가 기억나셨나요?{' '}
          <Link href="/login" className={styles.footerLink}>로그인</Link>
        </p>
      </div>
    </div>
  );
}

/* ── Step 1: 이메일 입력 ── */
function Step1Email({ hook, styles }: { hook: ReturnType<typeof usePasswordReset>; styles: Record<string, string> }) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.stepDescription}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <p>가입 시 사용한 이메일을 입력해주세요.<br />등록된 보안질문으로 본인 확인을 진행합니다.</p>
      </div>

      <Input
        label="이메일" id="reset-email" type="email"
        placeholder="example@farmbalance.kr"
        value={hook.email}
        onChange={(e) => { hook.setEmail(e.target.value); hook.setError(''); }}
        required autoComplete="email"
      />

      <Button
        id="reset-email-submit" type="button" variant="dark" size="lg" fullWidth
        disabled={hook.loading} onClick={hook.handleEmailSubmit}
      >
        {hook.loading ? '확인 중...' : '다음'}
      </Button>
    </div>
  );
}

/* ── Step 2: 보안질문 답변 ── */
function Step2Answer({ hook, styles }: { hook: ReturnType<typeof usePasswordReset>; styles: Record<string, string> }) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.questionCard}>
        <div className={styles.questionIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <span className={styles.questionLabel}>보안질문</span>
        <p className={styles.questionText}>{hook.securityQuestion}</p>
      </div>

      <Input
        label="답변" id="reset-security-answer"
        placeholder="보안질문에 대한 답변을 입력해주세요"
        value={hook.securityAnswer}
        onChange={(e) => { hook.setSecurityAnswer(e.target.value); hook.setError(''); hook.setAnswerError(''); }}
        required
      />
      {hook.answerError && (
        <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '4px', fontWeight: 500 }}>
          {hook.answerError}
        </p>
      )}

      <div className={styles.btnGroup}>
        <Button id="reset-answer-back" type="button" variant="outline" size="lg" onClick={hook.handlePrev}>
          이전
        </Button>
        <Button
          id="reset-answer-submit" type="button" variant="dark" size="lg"
          disabled={hook.loading} onClick={hook.handleAnswerSubmit}
        >
          {hook.loading ? '확인 중...' : '다음'}
        </Button>
      </div>
    </div>
  );
}

/* ── Step 3: 새 비밀번호 설정 ── */
function Step3NewPassword({ hook, styles }: { hook: ReturnType<typeof usePasswordReset>; styles: Record<string, string> }) {
  return (
    <div className={styles.stepContent}>
      <div>
        <Input
          label="새 비밀번호" id="reset-new-password" type="password"
          placeholder="8자 이상, 대문자·숫자·특수문자 포함"
          value={hook.newPassword}
          onChange={(e) => { hook.setNewPassword(e.target.value); hook.setError(''); }}
          required autoComplete="new-password"
        />
        <PasswordStrength password={hook.newPassword} strength={hook.strength} />
      </div>

      <div>
        <Input
          label="새 비밀번호 확인" id="reset-confirm-password" type="password"
          placeholder="비밀번호를 다시 입력해주세요"
          value={hook.confirmPassword}
          onChange={(e) => { hook.setConfirmPassword(e.target.value); hook.setError(''); }}
          required autoComplete="new-password"
        />
        {hook.confirmPassword && hook.newPassword !== hook.confirmPassword && (
          <div className={styles.fieldError}>비밀번호가 일치하지 않습니다.</div>
        )}
      </div>

      <div className={styles.btnGroup}>
        <Button id="reset-password-back" type="button" variant="outline" size="lg" onClick={hook.handlePrev}>
          이전
        </Button>
        <Button id="reset-password-submit" type="submit" variant="primary" size="lg" disabled={hook.loading}>
          {hook.loading ? '변경 중...' : '비밀번호 변경'}
        </Button>
      </div>
    </div>
  );
}
