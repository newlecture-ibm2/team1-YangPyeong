'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import styles from './page.module.css';

import usePasswordReset from './usePasswordReset';

export default function ResetPasswordPage() {
  const router = useRouter();
  const {
    step,
    error,
    setError,
    success,
    loading,
    email, setEmail,
    securityQuestion,
    securityAnswer, setSecurityAnswer,
    answerError, setAnswerError,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    strength,
    handleEmailSubmit,
    handleAnswerSubmit,
    handleResetSubmit,
    handlePrev,
  } = usePasswordReset();

  // ── 재설정 성공 화면 ──
  if (success) {
    return (
      <div className={styles.authPage}>
        <div className={styles.authCard}>
          <div className={styles.logoArea}>
            <Image src="/logo.png" alt="FarmBalance 로고" width={80} height={80} />
            <span className={styles.logoText}>Farm<em>Balance</em></span>
          </div>

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
        {/* 브랜드 */}
        <div className={styles.logoArea}>
          <Image src="/logo.png" alt="FarmBalance 로고" width={80} height={80} />
          <span className={styles.logoText}>Farm<em>Balance</em></span>
        </div>
        <p className={styles.authSub}>양평군 스마트 파밍 플랫폼</p>

        <h1 className={styles.authTitle}>비밀번호 재설정</h1>

        {/* 스텝 인디케이터 */}
        <div className={styles.stepper}>
          <div className={`${styles.step} ${step >= 1 ? styles.stepActive : ''} ${step > 1 ? styles.stepDone : ''}`}>
            <div className={styles.stepCircle}>{step > 1 ? '✓' : '1'}</div>
            <span className={styles.stepLabel}>이메일 확인</span>
          </div>
          <div className={`${styles.stepLine} ${step > 1 ? styles.stepLineDone : ''}`} />
          <div className={`${styles.step} ${step >= 2 ? styles.stepActive : ''} ${step > 2 ? styles.stepDone : ''}`}>
            <div className={styles.stepCircle}>{step > 2 ? '✓' : '2'}</div>
            <span className={styles.stepLabel}>본인 확인</span>
          </div>
          <div className={`${styles.stepLine} ${step > 2 ? styles.stepLineDone : ''}`} />
          <div className={`${styles.step} ${step >= 3 ? styles.stepActive : ''}`}>
            <div className={styles.stepCircle}>3</div>
            <span className={styles.stepLabel}>새 비밀번호</span>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && <div className={styles.errorMsg}>{error}</div>}

        <form className={styles.form} onSubmit={handleResetSubmit}>

          {/* ── Step 1: 이메일 입력 ── */}
          {step === 1 && (
            <div className={styles.stepContent}>
              <div className={styles.stepDescription}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                <p>가입 시 사용한 이메일을 입력해주세요.<br />등록된 보안질문으로 본인 확인을 진행합니다.</p>
              </div>

              <Input
                label="이메일"
                id="reset-email"
                type="email"
                placeholder="example@farmbalance.kr"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                required
                autoComplete="email"
              />

              <Button
                id="reset-email-submit"
                type="button"
                variant="dark"
                size="lg"
                fullWidth
                disabled={loading}
                onClick={handleEmailSubmit}
              >
                {loading ? '확인 중...' : '다음'}
              </Button>
            </div>
          )}

          {/* ── Step 2: 보안질문 답변 ── */}
          {step === 2 && (
            <div className={styles.stepContent}>
              <div className={styles.questionCard}>
                <div className={styles.questionIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <span className={styles.questionLabel}>보안질문</span>
                <p className={styles.questionText}>{securityQuestion}</p>
              </div>

              <Input
                label="답변"
                id="reset-security-answer"
                placeholder="보안질문에 대한 답변을 입력해주세요"
                value={securityAnswer}
                onChange={(e) => { setSecurityAnswer(e.target.value); setError(''); setAnswerError(''); }}
                required
              />
              {answerError && (
                <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '4px', fontWeight: 500 }}>
                  {answerError}
                </p>
              )}

              <div className={styles.btnGroup}>
                <Button
                  id="reset-answer-back"
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handlePrev}
                >
                  이전
                </Button>
                <Button
                  id="reset-answer-submit"
                  type="button"
                  variant="dark"
                  size="lg"
                  disabled={loading}
                  onClick={handleAnswerSubmit}
                >
                  {loading ? '확인 중...' : '다음'}
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: 새 비밀번호 설정 ── */}
          {step === 3 && (
            <div className={styles.stepContent}>
              <div>
                <Input
                  label="새 비밀번호"
                  id="reset-new-password"
                  type="password"
                  placeholder="8자 이상, 대문자·숫자·특수문자 포함"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                  required
                  autoComplete="new-password"
                />
                {newPassword.length >= 6 && (
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
              </div>

              <div>
                <Input
                  label="새 비밀번호 확인"
                  id="reset-confirm-password"
                  type="password"
                  placeholder="비밀번호를 다시 입력해주세요"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  required
                  autoComplete="new-password"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <div className={styles.fieldError}>비밀번호가 일치하지 않습니다.</div>
                )}
              </div>

              <div className={styles.btnGroup}>
                <Button
                  id="reset-password-back"
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handlePrev}
                >
                  이전
                </Button>
                <Button
                  id="reset-password-submit"
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? '변경 중...' : '비밀번호 변경'}
                </Button>
              </div>
            </div>
          )}
        </form>

        {/* 로그인 링크 */}
        <p className={styles.authFooter}>
          비밀번호가 기억나셨나요?{' '}
          <Link href="/login" className={styles.footerLink}>로그인</Link>
        </p>
      </div>
    </div>
  );
}
