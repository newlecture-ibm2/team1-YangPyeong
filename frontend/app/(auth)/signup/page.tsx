'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import Modal from '@/components/common/Modal/Modal';
import AuthBrand from '../_components/AuthBrand';
import StepIndicator from '../_components/StepIndicator';
import PasswordStrength from '../_components/PasswordStrength';
import styles from './page.module.css';

import useSignUp from './useSignUp';
import { SECURITY_QUESTIONS } from './_lib/constants';

const SIGNUP_STEPS = [
  { label: '기본 정보' },
  { label: '비밀번호' },
  { label: '보안질문' },
];

export default function SignUpPage() {
  const router = useRouter();
  const hook = useSignUp();

  // ── 재활성화 성공 화면 ──
  if (hook.reactivated) {
    return (
      <div className={styles.authPage}>
        <div className={styles.authCard}>
          <AuthBrand />
          <h1 className={styles.authTitle}>계정이 복구되었습니다! 🎉</h1>
          <div className={styles.successMsg}>
            <strong>{hook.email}</strong> 계정이 다시 활성화되었습니다.<br />
            기존 비밀번호로 로그인해주세요.
          </div>
          <Button variant="dark" size="lg" fullWidth onClick={() => router.push('/login')}>
            로그인하러 가기
          </Button>
        </div>
      </div>
    );
  }

  // ── 가입 성공 화면 ──
  if (hook.success) {
    return (
      <div className={styles.authPage}>
        <div className={styles.authCard}>
          <AuthBrand />
          <h1 className={styles.authTitle}>가입 완료! 🎉</h1>
          <div className={styles.successMsg}>
            <strong>{hook.name}</strong>님, 환영합니다!<br />
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
        <AuthBrand />
        <h1 className={styles.authTitle}>회원가입</h1>

        <StepIndicator steps={SIGNUP_STEPS} currentStep={hook.step} />

        {hook.error && <div className={styles.errorMsg}>{hook.error}</div>}

        <form className={styles.form} onSubmit={hook.handleSubmit}>
          {hook.step === 1 && <Step1BasicInfo hook={hook} styles={styles} />}
          {hook.step === 2 && <Step2Password hook={hook} styles={styles} />}
          {hook.step === 3 && <Step3Security hook={hook} styles={styles} />}
        </form>

        <p className={styles.authFooter}>
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className={styles.footerLink}>로그인</Link>
        </p>
      </div>

      {/* 탈퇴 계정 재가입 안내 모달 */}
      <Modal
        isOpen={hook.showReactivateModal}
        onClose={() => hook.setShowReactivateModal(false)}
        title="탈퇴 계정 안내"
      >
        <div className={styles.reactivateModal}>
          <p className={styles.reactivateText}>
            해당 이메일(<strong>{hook.email}</strong>)은 이전에 탈퇴한 계정입니다.<br />
            기존 계정을 재활성화하시겠습니까?
          </p>
          <p className={styles.reactivateHint}>
            재활성화하면 이전 정보로 다시 로그인할 수 있습니다.
          </p>
          <div className={styles.reactivateBtnGroup}>
            <Button variant="outline" size="lg" onClick={() => hook.setShowReactivateModal(false)}>
              취소
            </Button>
            <Button variant="primary" size="lg" onClick={hook.handleReactivate}>
              재활성화 후 로그인
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ── Step 1: 기본 정보 ── */
function Step1BasicInfo({ hook, styles }: { hook: ReturnType<typeof useSignUp>; styles: Record<string, string> }) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.fieldGroup}>
        <Input
          label="이름" id="signup-name" placeholder="홍길동"
          value={hook.name}
          onChange={(e) => { hook.setName(e.target.value); if (hook.error) hook.setError(''); }}
          onBlur={() => hook.handleBlur('name')}
          required autoComplete="name"
        />
        {hook.touched.name && hook.fieldErrors.name && (
          <div className={styles.fieldError}>{hook.fieldErrors.name}</div>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <Input
          label="이메일" id="signup-email" type="email" placeholder="example@farmbalance.kr"
          value={hook.email}
          onChange={(e) => hook.handleEmailChange(e.target.value)}
          required autoComplete="email"
        />
        {hook.emailStatus === 'checking' && <div className={styles.fieldChecking}>확인 중...</div>}
        {hook.emailStatus === 'available' && <div className={styles.fieldSuccess}>✓ 사용 가능한 이메일입니다.</div>}
        {hook.emailStatus === 'exists' && <div className={styles.fieldError}>이미 등록된 이메일입니다.</div>}
        {hook.emailStatus === 'invalid' && <div className={styles.fieldError}>올바른 이메일 형식을 입력해주세요.</div>}
        {hook.emailStatus !== 'exists' && hook.emailStatus !== 'invalid' && hook.touched.email && hook.fieldErrors.email && (
          <div className={styles.fieldError}>{hook.fieldErrors.email}</div>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <Input
          label="연락처" id="signup-phone" type="tel" placeholder="010-0000-0000"
          value={hook.phone}
          onChange={(e) => hook.handlePhoneChange(e.target.value)}
          onBlur={() => hook.handleBlur('phone')}
          required autoComplete="tel"
        />
        {hook.touched.phone && hook.fieldErrors.phone && (
          <div className={styles.fieldError}>{hook.fieldErrors.phone}</div>
        )}
      </div>

      <Button type="button" variant="dark" size="lg" fullWidth onClick={hook.handleNext}>
        다음
      </Button>
    </div>
  );
}

/* ── Step 2: 비밀번호 설정 ── */
function Step2Password({ hook, styles }: { hook: ReturnType<typeof useSignUp>; styles: Record<string, string> }) {
  return (
    <div className={styles.stepContent}>
      <div>
        <Input
          label="비밀번호" id="signup-password" type="password"
          placeholder="8자 이상, 영문자·숫자·특수문자 포함"
          value={hook.password}
          onChange={(e) => { hook.setPassword(e.target.value); if (hook.error) hook.setError(''); }}
          required autoComplete="new-password"
        />
        <PasswordStrength password={hook.password} strength={hook.strength} />
      </div>

      <div>
        <Input
          label="비밀번호 확인" id="signup-confirm" type="password"
          placeholder="비밀번호를 다시 입력해주세요"
          value={hook.confirmPassword}
          onChange={(e) => { hook.setConfirmPassword(e.target.value); if (hook.error) hook.setError(''); }}
          required autoComplete="new-password"
        />
        {hook.confirmPassword && hook.password !== hook.confirmPassword && (
          <div className={styles.fieldError}>비밀번호가 일치하지 않습니다.</div>
        )}
      </div>

      <div className={styles.btnGroup}>
        <Button type="button" variant="outline" size="lg" onClick={hook.handlePrev}>이전</Button>
        <Button type="button" variant="dark" size="lg" onClick={hook.handleNext}>다음</Button>
      </div>
    </div>
  );
}

/* ── Step 3: 보안질문 ── */
function Step3Security({ hook, styles }: { hook: ReturnType<typeof useSignUp>; styles: Record<string, string> }) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.selectGroup}>
        <label className={styles.selectLabel} htmlFor="signup-security-q">보안질문</label>
        <select
          id="signup-security-q"
          className={styles.fieldSelect}
          value={hook.securityQuestion}
          onChange={(e) => hook.setSecurityQuestion(e.target.value)}
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
        label="답변" id="signup-security-a" placeholder="답변을 입력해주세요"
        value={hook.securityAnswer}
        onChange={(e) => { hook.setSecurityAnswer(e.target.value); if (hook.error) hook.setError(''); }}
        required
      />

      <div className={styles.btnGroup}>
        <Button type="button" variant="outline" size="lg" onClick={hook.handlePrev}>이전</Button>
        <Button type="submit" variant="primary" size="lg" disabled={hook.loading}>
          {hook.loading ? '가입 중...' : '가입하기'}
        </Button>
      </div>
    </div>
  );
}
