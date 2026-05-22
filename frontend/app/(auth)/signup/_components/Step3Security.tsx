'use client';

import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import { SECURITY_QUESTIONS } from '../_lib/constants';
import type useSignUp from '../useSignUp';
import styles from '../page.module.css';

interface Step3Props {
  hook: ReturnType<typeof useSignUp>;
}

export default function Step3Security({ hook }: Step3Props) {
  const isStep3Valid =
    hook.securityQuestion !== '' &&
    hook.securityAnswer.trim() !== '';

  return (
    <div className={styles.stepContent}>
      <div className={styles.selectGroup}>
        <label className={styles.selectLabel} htmlFor="signup-security-q">보안질문</label>
        <select
          id="signup-security-q"
          className={styles.fieldSelect}
          value={hook.securityQuestion}
          onChange={(e) => hook.setSecurityQuestion(e.target.value)}
          required
        >
          <option value="">보안질문을 선택해주세요</option>
          {SECURITY_QUESTIONS.map((q) => (
            <option key={q} value={q}>{q}</option>
          ))}
        </select>
        <p className={styles.fieldHint}>비밀번호 분실 시 본인 확인에 사용됩니다.</p>
      </div>

      <Input
        label="답변" id="signup-security-a" placeholder="답변을 입력해주세요"
        value={hook.securityAnswer}
        onChange={(e) => { hook.setSecurityAnswer(e.target.value); if (hook.error) hook.setError(''); }}
        required
      />

      <div className={styles.btnGroup}>
        <Button type="button" variant="outline" size="lg" onClick={hook.handlePrev}>이전</Button>
        <Button 
          type="submit" 
          variant="primary" 
          size="lg" 
          disabled={hook.loading || !isStep3Valid}
        >
          {hook.loading ? '가입 중...' : (!isStep3Valid ? '보안질문을 작성해주세요' : '가입하기')}
        </Button>
      </div>
    </div>
  );
}
