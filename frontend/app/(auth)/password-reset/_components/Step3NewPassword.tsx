'use client';

import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import PasswordStrength from '../../_components/PasswordStrength/PasswordStrength';
import type usePasswordReset from '../usePasswordReset';
import styles from '../page.module.css';

interface Step3Props {
  hook: ReturnType<typeof usePasswordReset>;
}

export default function Step3NewPassword({ hook }: Step3Props) {
  return (
    <div className={styles.stepContent}>
      <div>
        <Input
          label="새 비밀번호" id="reset-new-password" type="password"
          placeholder="8자 이상, 대문자·숫자·특수문자 포함"
          value={hook.newPassword}
          onChange={(e) => { hook.setNewPassword(e.target.value); hook.setError(''); }}
          required autoComplete="new-password"
        />
        <PasswordStrength password={hook.newPassword} strength={hook.strength} />
      </div>

      <div>
        <Input
          label="새 비밀번호 확인" id="reset-confirm-password" type="password"
          placeholder="비밀번호를 다시 입력해주세요"
          value={hook.confirmPassword}
          onChange={(e) => { hook.setConfirmPassword(e.target.value); hook.setError(''); }}
          required autoComplete="new-password"
        />
        {hook.confirmPassword && hook.newPassword !== hook.confirmPassword && (
          <div className={styles.fieldError}>비밀번호가 일치하지 않습니다.</div>
        )}
      </div>

      <div className={styles.btnGroup}>
        <Button id="reset-password-back" type="button" variant="outline" size="lg" onClick={hook.handlePrev}>
          이전
        </Button>
        <Button id="reset-password-submit" type="submit" variant="primary" size="lg" disabled={hook.loading}>
          {hook.loading ? '변경 중...' : '비밀번호 변경'}
        </Button>
      </div>
    </div>
  );
}
