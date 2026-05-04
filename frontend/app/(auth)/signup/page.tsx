'use client';

import Link from 'next/link';
import AuthBrand from '../_components/AuthBrand/AuthBrand';
import StepIndicator from '../_components/StepIndicator/StepIndicator';
import Step1BasicInfo from './_components/Step1BasicInfo';
import Step2Password from './_components/Step2Password';
import Step3Security from './_components/Step3Security';
import SignUpSuccess from './_components/SignUpSuccess';
import ReactivateModal from './_components/ReactivateModal';
import { SIGNUP_STEPS } from './_lib/constants';
import styles from './page.module.css';
import useSignUp from './useSignUp';

export default function SignUpPage() {
  const hook = useSignUp();

  if (hook.reactivated) {
    return (
      <SignUpSuccess
        title="계정이 복구되었습니다! 🎉"
        message={<><strong>{hook.email}</strong> 계정이 다시 활성화되었습니다.<br />기존 비밀번호로 로그인해주세요.</>}
      />
    );
  }

  if (hook.success) {
    return (
      <SignUpSuccess
        title="가입 완료! 🎉"
        message={<><strong>{hook.name}</strong>님, 환영합니다!<br />이제 로그인하여 FarmBalance를 이용할 수 있습니다.</>}
      />
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
          {hook.step === 1 && <Step1BasicInfo hook={hook} />}
          {hook.step === 2 && <Step2Password hook={hook} />}
          {hook.step === 3 && <Step3Security hook={hook} />}
        </form>

        <p className={styles.authFooter}>
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className={styles.footerLink}>로그인</Link>
        </p>
      </div>

      <ReactivateModal
        isOpen={hook.showReactivateModal}
        email={hook.email}
        onClose={() => hook.setShowReactivateModal(false)}
        onReactivate={hook.handleReactivate}
      />
    </div>
  );
}
