'use client';

import Input from '@/components/common/Input';
import Button from '@/components/common/Button';
import type useSignUp from '../useSignUp';
import styles from '../page.module.css';
import LegalModal from '@/components/common/LegalModal/LegalModal';
import { useState } from 'react';

interface Step1Props {
  hook: ReturnType<typeof useSignUp>;
}

export default function Step1BasicInfo({ hook }: Step1Props) {
  const [legalModal, setLegalModal] = useState<{ open: boolean; type: 'terms' | 'privacy' }>({
    open: false,
    type: 'terms',
  });

  return (
    <div className={styles.stepContent}>
      <div className={styles.fieldGroup}>
        <Input
          label="이름" id="signup-name" placeholder="홍길동"
          value={hook.name}
          onChange={(e) => { hook.setName(e.target.value); if (hook.error) hook.setError(''); }}
          onBlur={() => hook.handleBlur('name')}
          required autoComplete="name"
        />
        {hook.touched.name && hook.fieldErrors.name && (
          <div className={styles.fieldError}>{hook.fieldErrors.name}</div>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <Input
          label="이메일" id="signup-email" type="email" placeholder="example@farmbalance.kr"
          value={hook.email}
          onChange={(e) => hook.handleEmailChange(e.target.value)}
          required autoComplete="email"
        />
        {hook.emailStatus === 'checking' && <div className={styles.fieldChecking}>확인 중...</div>}
        {hook.emailStatus === 'available' && <div className={styles.fieldSuccess}>✓ 사용 가능한 이메일입니다.</div>}
        {hook.emailStatus === 'exists' && <div className={styles.fieldError}>이미 등록된 이메일입니다.</div>}
        {hook.emailStatus === 'invalid' && <div className={styles.fieldError}>올바른 이메일 형식을 입력해주세요.</div>}
        {hook.emailStatus !== 'exists' && hook.emailStatus !== 'invalid' && hook.touched.email && hook.fieldErrors.email && (
          <div className={styles.fieldError}>{hook.fieldErrors.email}</div>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <Input
          label="연락처" id="signup-phone" type="tel" placeholder="010-0000-0000"
          value={hook.phone}
          onChange={(e) => hook.handlePhoneChange(e.target.value)}
          onBlur={() => hook.handleBlur('phone')}
          required autoComplete="tel"
        />
        {hook.touched.phone && hook.fieldErrors.phone && (
          <div className={styles.fieldError}>{hook.fieldErrors.phone}</div>
        )}
      </div>
      
      <div className={styles.agreementGroup}>
        <div className={`${styles.agreementItem} ${styles.allAgreement}`}>
          <input 
            type="checkbox" 
            id="all-agree" 
            checked={hook.agreements.termsOfService && hook.agreements.privacyPolicy && hook.agreements.marketing}
            onChange={(e) => hook.toggleAllAgreements(e.target.checked)}
          />
          <label htmlFor="all-agree" className={styles.agreementLabel}>약관에 모두 동의합니다</label>
        </div>

        <div className={styles.agreementItem}>
          <input 
            type="checkbox" 
            id="agree-terms" 
            checked={hook.agreements.termsOfService}
            onChange={() => hook.toggleAgreement('termsOfService')}
          />
          <label htmlFor="agree-terms" className={styles.agreementLabel}>
            <em>[필수]</em> 이용약관 동의
          </label>
          <button type="button" className={styles.viewLink} onClick={() => setLegalModal({ open: true, type: 'terms' })}>
            보기
          </button>
        </div>

        <div className={styles.agreementItem}>
          <input 
            type="checkbox" 
            id="agree-privacy" 
            checked={hook.agreements.privacyPolicy}
            onChange={() => hook.toggleAgreement('privacyPolicy')}
          />
          <label htmlFor="agree-privacy" className={styles.agreementLabel}>
            <em>[필수]</em> 개인정보 수집 및 이용 동의
          </label>
          <button type="button" className={styles.viewLink} onClick={() => setLegalModal({ open: true, type: 'privacy' })}>
            보기
          </button>
        </div>

        <div className={styles.agreementItem}>
          <input 
            type="checkbox" 
            id="agree-marketing" 
            checked={hook.agreements.marketing}
            onChange={() => hook.toggleAgreement('marketing')}
          />
          <label htmlFor="agree-marketing" className={styles.agreementLabel}>
            <span>[선택]</span> 마케팅 정보 수신 동의
          </label>
        </div>

        {hook.touched.agreements && hook.fieldErrors.agreements && (
          <div className={styles.fieldError}>{hook.fieldErrors.agreements}</div>
        )}
      </div>

      <Button type="button" variant="dark" size="lg" fullWidth onClick={hook.handleNext}>
        다음
      </Button>

      <LegalModal 
        isOpen={legalModal.open}
        onClose={() => setLegalModal({ ...legalModal, open: false })}
        type={legalModal.type}
      />
    </div>
  );
}
