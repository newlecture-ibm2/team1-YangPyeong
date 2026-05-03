'use client';

import Link from 'next/link';
import AuthBrand from '../_components/AuthBrand/AuthBrand';
import StepIndicator from '../_components/StepIndicator/StepIndicator';
import Step1Email from './_components/Step1Email';
import Step2Answer from './_components/Step2Answer';
import Step3NewPassword from './_components/Step3NewPassword';
import ResetSuccess from './_components/ResetSuccess';
import { RESET_STEPS } from './_lib/constants';
import styles from './page.module.css';
import usePasswordReset from './usePasswordReset';

export default function ResetPasswordPage() {
  const hook = usePasswordReset();

  if (hook.success) return <ResetSuccess />;

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
