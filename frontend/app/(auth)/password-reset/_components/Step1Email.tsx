'use client';

import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import type usePasswordReset from '../usePasswordReset';
import styles from '../page.module.css';

interface Step1Props {
  hook: ReturnType<typeof usePasswordReset>;
}

export default function Step1Email({ hook }: Step1Props) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.stepDescription}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        <p>가입 시 사용한 이메일을 입력해주세요.<br />등록된 보안질문으로 본인 확인을 진행합니다.</p>
      </div>

      <Input
        label="이메일" id="reset-email" type="email"
        placeholder="example@farmbalance.kr"
        value={hook.email}
        onChange={(e) => { hook.setEmail(e.target.value); hook.setError(''); }}
        required autoComplete="email"
      />

      <Button
        id="reset-email-submit" type="button" variant="dark" size="lg" fullWidth
        disabled={hook.loading} onClick={hook.handleEmailSubmit}
      >
        {hook.loading ? '확인 중...' : '다음'}
      </Button>
    </div>
  );
}
