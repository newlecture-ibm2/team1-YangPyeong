'use client';

import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import PasswordStrength from '../../_components/PasswordStrength/PasswordStrength';
import type useSignUp from '../useSignUp';
import styles from '../page.module.css';

interface Step2Props {
  hook: ReturnType<typeof useSignUp>;
}

export default function Step2Password({ hook }: Step2Props) {
  // 필수 조건 충족 여부 계산
  const isStep2Valid =
    hook.password.length >= 8 &&
    hook.password === hook.confirmPassword &&
    hook.strength.level >= 2;

  return (
    <div className={styles.stepContent}>
      <div>
        <Input
          label="비밀번호" id="signup-password" type="password"
          placeholder="8자 이상, 영문자·숫자·특수문자 포함"
          value={hook.password}
          onChange={(e) => { hook.setPassword(e.target.value); if (hook.error) hook.setError(''); }}
          required autoComplete="new-password"
        />
        <PasswordStrength password={hook.password} strength={hook.strength} />
      </div>

      <div>
        <Input
          label="비밀번호 확인" id="signup-confirm" type="password"
          placeholder="비밀번호를 다시 입력해주세요"
          value={hook.confirmPassword}
          onChange={(e) => { hook.setConfirmPassword(e.target.value); if (hook.error) hook.setError(''); }}
          required autoComplete="new-password"
        />
        {hook.confirmPassword && hook.password !== hook.confirmPassword && (
          <div className={styles.fieldError}>비밀번호가 일치하지 않습니다.</div>
        )}
      </div>

      <div className={styles.btnGroup}>
        <Button type="button" variant="outline" size="lg" onClick={hook.handlePrev}>이전</Button>
        <Button 
          type="button" 
          variant="dark" 
          size="lg" 
          onClick={hook.handleNext}
          disabled={!isStep2Valid}
        >
          {isStep2Valid ? '다음' : '비밀번호 규칙을 확인해주세요'}
        </Button>
      </div>
    </div>
  );
}
