'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-fetch';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import styles from './page.module.css';
import { getPasswordStrength } from '@/lib/utils';

import useSignUp from './useSignUp';
import { SECURITY_QUESTIONS } from './_lib/constants';

export default function SignUpPage() {
  const router = useRouter();
  const {
    step,
    error,
    setError,
    success,
    loading,
    name, setName,
    email, setEmail,
    phone, setPhone,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    securityQuestion, setSecurityQuestion,
    securityAnswer, setSecurityAnswer,
    strength,
    handleNext,
    handlePrev,
    handleSubmit,
  } = useSignUp();

  // ── 가입 성공 화면 ──
  if (success) {
    return (
      <div className={styles.authPage}>
        <div className={styles.authCard}>
          <div className={styles.logoArea}>
            <Image src="/logo.png" alt="FarmBalance 로고" width={80} height={80} />
            <span className={styles.logoText}>Farm<em>Balance</em></span>
          </div>

          <h1 className={styles.authTitle}>가입 완료! 🎉</h1>

          <div className={styles.successMsg}>
            <strong>{name}</strong>님, 환영합니다!<br />
            이제 로그인하여 FarmBalance를 이용할 수 있습니다.
          </div>

          <Button variant="dark" size="lg" fullWidth onClick={() => router.push('/login')}>
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

        <h1 className={styles.authTitle}>회원가입</h1>

        {/* 스텝 인디케이터 */}
        <div className={styles.stepper}>
          <div className={`${styles.step} ${step >= 1 ? styles.stepActive : ''} ${step > 1 ? styles.stepDone : ''}`}>
            <div className={styles.stepCircle}>{step > 1 ? '✓' : '1'}</div>
            <span className={styles.stepLabel}>기본 정보</span>
          </div>
          <div className={`${styles.stepLine} ${step > 1 ? styles.stepLineDone : ''}`} />
          <div className={`${styles.step} ${step >= 2 ? styles.stepActive : ''} ${step > 2 ? styles.stepDone : ''}`}>
            <div className={styles.stepCircle}>{step > 2 ? '✓' : '2'}</div>
            <span className={styles.stepLabel}>비밀번호</span>
          </div>
          <div className={`${styles.stepLine} ${step > 2 ? styles.stepLineDone : ''}`} />
          <div className={`${styles.step} ${step >= 3 ? styles.stepActive : ''}`}>
            <div className={styles.stepCircle}>3</div>
            <span className={styles.stepLabel}>보안질문</span>
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && <div className={styles.errorMsg}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>

          {/* ── Step 1: 기본 정보 ── */}
          {step === 1 && (
            <div className={styles.stepContent}>
              <Input
                label="이름 *"
                id="signup-name"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />

              <Input
                label="이메일 *"
                id="signup-email"
                type="email"
                placeholder="example@farmbalance.kr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <Input
                label="연락처 (선택)"
                id="signup-phone"
                type="tel"
                placeholder="010-0000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />

              <Button type="button" variant="dark" size="lg" fullWidth onClick={handleNext}>
                다음
              </Button>
            </div>
          )}

          {/* ── Step 2: 비밀번호 설정 ── */}
          {step === 2 && (
            <div className={styles.stepContent}>
              <div>
                <Input
                  label="비밀번호 *"
                  id="signup-password"
                  type="password"
                  placeholder="8자 이상, 대문자·숫자·특수문자 포함"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
                  required
                  autoComplete="new-password"
                />
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
              </div>

              <div>
                <Input
                  label="비밀번호 확인 *"
                  id="signup-confirm"
                  type="password"
                  placeholder="비밀번호를 다시 입력해주세요"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); if (error) setError(''); }}
                  required
                  autoComplete="new-password"
                />
                {confirmPassword && password !== confirmPassword && (
                  <div className={styles.fieldError}>비밀번호가 일치하지 않습니다.</div>
                )}
              </div>

              <div className={styles.btnGroup}>
                <Button type="button" variant="outline" size="lg" onClick={handlePrev}>
                  이전
                </Button>
                <Button type="button" variant="dark" size="lg" onClick={handleNext}>
                  다음
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: 보안질문 ── */}
          {step === 3 && (
            <div className={styles.stepContent}>
              <div className={styles.selectGroup}>
                <label className={styles.selectLabel} htmlFor="signup-security-q">보안질문 *</label>
                <select
                  id="signup-security-q"
                  className={styles.fieldSelect}
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  required
                >
                  <option value="">보안질문을 선택해주세요</option>
                  {SECURITY_QUESTIONS.map((q) => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
                <p className={styles.fieldHint}>비밀번호 분실 시 본인 확인에 사용됩니다.</p>
              </div>

              <Input
                label="답변 *"
                id="signup-security-a"
                placeholder="답변을 입력해주세요"
                value={securityAnswer}
                onChange={(e) => { setSecurityAnswer(e.target.value); if (error) setError(''); }}
                required
              />

              <div className={styles.btnGroup}>
                <Button type="button" variant="outline" size="lg" onClick={handlePrev}>
                  이전
                </Button>
                <Button type="submit" variant="primary" size="lg" disabled={loading}>
                  {loading ? '가입 중...' : '가입하기'}
                </Button>
              </div>
            </div>
          )}
        </form>

        {/* 로그인 링크 */}
        <p className={styles.authFooter}>
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className={styles.footerLink}>로그인</Link>
        </p>
      </div>
    </div>
  );
}
