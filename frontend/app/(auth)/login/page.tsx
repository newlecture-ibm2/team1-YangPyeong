'use client';

import Link from 'next/link';
import AuthBrand from '../_components/AuthBrand/AuthBrand';
import SocialButtons from './_components/SocialButtons';
import ReactivateModal from './_components/ReactivateModal';
import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
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

        <form className={styles.form} onSubmit={hook.handleSubmit}>
          <Input
            label="이메일" id="login-email" type="email"
            placeholder="example@farmbalance.kr"
            value={hook.email} onChange={(e) => hook.setEmail(e.target.value)}
            required autoComplete="email"
          />
          <Input
            label="비밀번호" id="login-password" type="password"
            placeholder="비밀번호를 입력해주세요"
            value={hook.password} onChange={(e) => hook.setPassword(e.target.value)}
            required autoComplete="current-password"
          />
          <Button type="submit" variant="dark" size="lg" fullWidth disabled={hook.loading}>
            {hook.loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>

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
