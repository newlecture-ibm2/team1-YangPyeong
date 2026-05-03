'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal/Modal';
import AuthBrand from '../_components/AuthBrand';
import StepIndicator from '../_components/StepIndicator';
import Step1BasicInfo from './_components/Step1BasicInfo';
import Step2Password from './_components/Step2Password';
import Step3Security from './_components/Step3Security';
import styles from './page.module.css';
import useSignUp from './useSignUp';

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
          {hook.step === 1 && <Step1BasicInfo hook={hook} />}
          {hook.step === 2 && <Step2Password hook={hook} />}
          {hook.step === 3 && <Step3Security hook={hook} />}
        </form>

        <p className={styles.authFooter}>
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className={styles.footerLink}>로그인</Link>
        </p>
      </div>

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
            <Button variant="outline" size="lg" onClick={() => hook.setShowReactivateModal(false)}>취소</Button>
            <Button variant="primary" size="lg" onClick={hook.handleReactivate}>재활성화 후 로그인</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
