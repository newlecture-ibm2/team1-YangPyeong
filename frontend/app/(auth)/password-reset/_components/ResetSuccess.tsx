'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button';
import AuthBrand from '../../_components/AuthBrand/AuthBrand';
import type usePasswordReset from '../usePasswordReset';
import styles from '../page.module.css';

interface ResetSuccessProps {
  hook: ReturnType<typeof usePasswordReset>;
}

/** 임시 비밀번호 발송 성공 화면 */
export default function ResetSuccess({ hook }: ResetSuccessProps) {
  const router = useRouter();

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <AuthBrand />
        <h1 className={styles.authTitle}>발송 완료! ✉️</h1>
        <div className={styles.successMsg}>
          입력하신 이메일로 임시 비밀번호를 발송했습니다.<br />
          이메일을 확인하시고, 임시 비밀번호로 로그인해주세요.<br />
          <strong>로그인 후 마이페이지에서 비밀번호를 변경해주세요.</strong>
        </div>

        {hook.resendMessage && (
          <div className={
            hook.resendMessage.includes('발송되었습니다')
              ? styles.successMsg
              : styles.errorMsg
          }>
            {hook.resendMessage}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Button
            id="reset-go-login" variant="dark" size="lg" fullWidth
            onClick={() => router.push('/login')}
          >
            로그인하러 가기
          </Button>
          <Button
            id="reset-resend" variant="outline" size="lg" fullWidth
            disabled={hook.resendLoading || hook.resendCooldown > 0}
            onClick={hook.handleResend}
          >
            {hook.resendLoading
              ? '재발송 중...'
              : hook.resendCooldown > 0
                ? `재발송 대기 (${hook.resendCooldown}초)`
                : '임시 비밀번호 재발송'}
          </Button>
        </div>
      </div>
    </div>
  );
}
