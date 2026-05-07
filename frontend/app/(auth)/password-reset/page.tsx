'use client';

import Link from 'next/link';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import AuthBrand from '../_components/AuthBrand/AuthBrand';
import StepIndicator from '../_components/StepIndicator/StepIndicator';
import ResetSuccess from './_components/ResetSuccess';
import { RESET_STEPS } from './_lib/constants';
import styles from './page.module.css';
import usePasswordReset from './usePasswordReset';

export default function ResetPasswordPage() {
  const hook = usePasswordReset();

  if (hook.success) return <ResetSuccess hook={hook} />;

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <AuthBrand />
        <h1 className={styles.authTitle}>비밀번호 찾기</h1>

        <StepIndicator steps={RESET_STEPS} currentStep={hook.step} />
        {hook.error && <div className={styles.errorMsg}>{hook.error}</div>}

        <form className={styles.form} onSubmit={hook.handleFormSubmit}>
          {/* Step 1: 이메일 입력 */}
          {hook.step === 1 && (
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
          )}

          {/* Step 2: 보안질문 답변 → 임시 비밀번호 발송 */}
          {hook.step === 2 && (
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
                <div className={styles.fieldError}>{hook.answerError}</div>
              )}

              <div className={styles.stepDescription} style={{ marginTop: '16px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 7l-10 7L2 7" />
                </svg>
                <p>답변이 확인되면 임시 비밀번호를 이메일로 보내드립니다.</p>
              </div>

              <div className={styles.btnGroup}>
                <Button id="reset-answer-back" type="button" variant="outline" size="lg" onClick={hook.handlePrev}>
                  이전
                </Button>
                <Button
                  id="reset-answer-submit" type="button" variant="dark" size="lg"
                  disabled={hook.loading} onClick={hook.handleAnswerSubmit}
                >
                  {hook.loading ? '발송 중...' : '임시 비밀번호 발송'}
                </Button>
              </div>
            </div>
          )}
        </form>

        <p className={styles.authFooter}>
          비밀번호가 기억나셨나요?{' '}
          <Link href="/login" className={styles.footerLink}>로그인</Link>
        </p>
      </div>
    </div>
  );
}
