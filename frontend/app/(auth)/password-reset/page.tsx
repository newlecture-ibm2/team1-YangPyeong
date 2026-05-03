'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button';
import AuthBrand from '../_components/AuthBrand/AuthBrand';
import StepIndicator from '../_components/StepIndicator/StepIndicator';
import Step1Email from './_components/Step1Email';
import Step2Answer from './_components/Step2Answer';
import Step3NewPassword from './_components/Step3NewPassword';
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
          {hook.step === 1 && <Step1Email hook={hook} />}
          {hook.step === 2 && <Step2Answer hook={hook} />}
          {hook.step === 3 && <Step3NewPassword hook={hook} />}
        </form>

        <p className={styles.authFooter}>
          비밀번호가 기억나셨나요?{' '}
          <Link href="/login" className={styles.footerLink}>로그인</Link>
        </p>
      </div>
    </div>
  );
}
