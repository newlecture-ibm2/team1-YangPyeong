'use client';

import Link from 'next/link';
import AuthBrand from '../_components/AuthBrand/AuthBrand';
import LoginForm from './_components/LoginForm';
import SocialButtons from './_components/SocialButtons';
import ReactivateModal from './_components/ReactivateModal';
import styles from './page.module.css';
import useLogin from './useLogin';

export default function LoginPage() {
  const hook = useLogin();

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <AuthBrand />
        <h1 className={styles.authTitle}>로그인</h1>

        {hook.error && <div className={styles.errorMsg}>{hook.error}</div>}

        <LoginForm hook={hook} />

        <div className={styles.forgotPassword}>
          <Link href="/password-reset" className={styles.footerLink}>비밀번호를 잊으셨나요?</Link>
        </div>

        <SocialButtons onKakao={hook.handleKakaoLogin} onGoogle={hook.handleGoogleLogin} />

        <p className={styles.authFooter}>
          아직 계정이 없으신가요?{' '}
          <Link href="/signup" className={styles.footerLink}>회원가입</Link>
        </p>
      </div>

      {hook.showReactivate && (
        <ReactivateModal
          loading={hook.loading}
          onReactivate={hook.handleReactivate}
          onCancel={hook.cancelReactivate}
        />
      )}
    </div>
  );
}
