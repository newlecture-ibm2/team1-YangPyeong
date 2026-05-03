'use client';

import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import type usePasswordReset from '../usePasswordReset';
import styles from '../page.module.css';

interface Step2Props {
  hook: ReturnType<typeof usePasswordReset>;
}

export default function Step2Answer({ hook }: Step2Props) {
  return (
    <div className={styles.stepContent}>
      <div className={styles.questionCard}>
        <div className={styles.questionIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <span className={styles.questionLabel}>보안질문</span>
        <p className={styles.questionText}>{hook.securityQuestion}</p>
      </div>

      <Input
        label="답변" id="reset-security-answer"
        placeholder="보안질문에 대한 답변을 입력해주세요"
        value={hook.securityAnswer}
        onChange={(e) => { hook.setSecurityAnswer(e.target.value); hook.setError(''); hook.setAnswerError(''); }}
        required
      />
      {hook.answerError && (
        <p style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '4px', fontWeight: 500 }}>
          {hook.answerError}
        </p>
      )}

      <div className={styles.btnGroup}>
        <Button id="reset-answer-back" type="button" variant="outline" size="lg" onClick={hook.handlePrev}>
          이전
        </Button>
        <Button
          id="reset-answer-submit" type="button" variant="dark" size="lg"
          disabled={hook.loading} onClick={hook.handleAnswerSubmit}
        >
          {hook.loading ? '확인 중...' : '다음'}
        </Button>
      </div>
    </div>
  );
}
