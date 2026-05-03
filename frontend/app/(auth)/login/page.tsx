'use client';

import Link from 'next/link';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import AuthBrand from '../_components/AuthBrand';
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

        {/* 로그인 폼 */}
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

        {/* 소셜 로그인 */}
        <SocialButtons
          onKakao={hook.handleKakaoLogin}
          onGoogle={hook.handleGoogleLogin}
        />

        <p className={styles.authFooter}>
          아직 계정이 없으신가요?{' '}
          <Link href="/signup" className={styles.footerLink}>회원가입</Link>
        </p>
      </div>

      {/* 탈퇴 계정 재활성화 모달 */}
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

/* ── 소셜 로그인 버튼 ── */
function SocialButtons({ onKakao, onGoogle }: { onKakao: () => void; onGoogle: () => void }) {
  return (
    <>
      <div className={styles.authDivider}>
        <span className={styles.dividerText}>또는 소셜 계정으로 로그인</span>
      </div>
      <div className={styles.socialBtns}>
        <Button variant="kakao" size="lg" fullWidth onClick={onKakao}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C6.48 3 2 6.36 2 10.5c0 2.67 1.78 5.01 4.44 6.34-.14.52-.92 3.34-.95 3.56 0 0-.02.16.08.22.1.06.22.03.22.03.29-.04 3.37-2.2 3.9-2.57.73.1 1.49.16 2.27.16h.04c5.52 0 10-3.36 10-7.5S17.52 3 12 3"/>
          </svg>
          카카오로 시작하기
        </Button>
        <Button variant="google" size="lg" fullWidth onClick={onGoogle}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google로 시작하기
        </Button>
      </div>
    </>
  );
}

/* ── 계정 복구 모달 ── */
function ReactivateModal({ loading, onReactivate, onCancel }: {
  loading: boolean;
  onReactivate: () => void;
  onCancel: () => void;
}) {
  return (
    <div className={styles.reactivateOverlay}>
      <div className={styles.reactivateModal}>
        <h2 className={styles.reactivateTitle}>계정 복구</h2>
        <p className={styles.reactivateDesc}>
          이전에 탈퇴한 계정입니다.<br />
          다시 FarmBalance를 이용하시겠습니까?
        </p>
        <p className={styles.reactivateNote}>
          계정을 복구하면 기존 프로필 정보로 다시 로그인됩니다.
        </p>
        <div className={styles.reactivateActions}>
          <Button variant="outline" onClick={onCancel} disabled={loading}>취소</Button>
          <Button variant="dark" onClick={onReactivate} disabled={loading}>
            {loading ? '복구 중...' : '다시 시작하기'}
          </Button>
        </div>
      </div>
    </div>
  );
}
