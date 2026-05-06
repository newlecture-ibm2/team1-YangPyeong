'use client';

import { useState, FormEvent, useCallback, useMemo, useRef } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import { getPasswordStrength } from '@/lib/utils';
import { formatPhone, validatePhone } from '@/lib/phone';

export type EmailStatus = 'idle' | 'checking' | 'available' | 'exists' | 'withdrawn' | 'invalid';

export default function useSignUp() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // 데이터 상태
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');

  // 유효성 검사 상태
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [emailStatus, setEmailStatus] = useState<EmailStatus>('idle');

  // 탈퇴 계정 재가입 모달
  const [showReactivateModal, setShowReactivateModal] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  // 이메일 체크 debounce
  const emailCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** 이메일 실시간 체크 */
  const checkEmail = useCallback(async (emailValue: string) => {
    if (!emailValue.trim()) {
      setEmailStatus('idle');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setEmailStatus('invalid');
      setFieldErrors(prev => ({ ...prev, email: '올바른 이메일 형식을 입력해주세요.' }));
      return;
    }

    setEmailStatus('checking');
    setFieldErrors(prev => ({ ...prev, email: '' }));

    try {
      const result = await apiFetch<{ status: string }>(`/api/users/check-email?email=${encodeURIComponent(emailValue)}`);
      if (result.success && result.data) {
        const status = result.data.status as EmailStatus;
        setEmailStatus(status);
        if (status === 'exists') {
          setFieldErrors(prev => ({ ...prev, email: '이미 등록된 이메일입니다.' }));
        } else if (status === 'withdrawn') {
          setFieldErrors(prev => ({ ...prev, email: '' }));
          setShowReactivateModal(true);
        } else {
          setFieldErrors(prev => ({ ...prev, email: '' }));
        }
      }
    } catch {
      setEmailStatus('idle');
    }
  }, []);

  /** 이메일 변경 핸들러 (debounce 적용) */
  const handleEmailChange = useCallback((value: string) => {
    setEmail(value);
    setEmailStatus('idle');
    setFieldErrors(prev => ({ ...prev, email: '' }));

    if (emailCheckTimer.current) clearTimeout(emailCheckTimer.current);

    if (value.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      emailCheckTimer.current = setTimeout(() => checkEmail(value), 500);
    }
  }, [checkEmail]);

  /** 전화번호 변경 핸들러 */
  const handlePhoneChange = useCallback((value: string) => {
    const formatted = formatPhone(value);
    setPhone(formatted);
    if (touched.phone) {
      const err = validatePhone(formatted);
      setFieldErrors(prev => ({ ...prev, phone: err || '' }));
    }
  }, [touched.phone]);

  /** 필드 blur 핸들러 */
  const handleBlur = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));

    switch (field) {
      case 'name':
        setFieldErrors(prev => ({
          ...prev,
          name: name.trim().length < 2 ? '이름은 2자 이상 입력해주세요.' : '',
        }));
        break;
      case 'email':
        if (!email.trim()) {
          setFieldErrors(prev => ({ ...prev, email: '이메일을 입력해주세요.' }));
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setFieldErrors(prev => ({ ...prev, email: '올바른 이메일 형식을 입력해주세요.' }));
          setEmailStatus('invalid');
        }
        break;
      case 'phone': {
        const phoneErr = validatePhone(phone);
        setFieldErrors(prev => ({ ...prev, phone: phoneErr || '' }));
        break;
      }
    }
  }, [name, email, phone]);

  // Step 1 유효성 검사
  const validateStep1 = useCallback(() => {
    const errors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      errors.name = '이름은 2자 이상 입력해주세요.';
    }
    if (!email.trim()) {
      errors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = '올바른 이메일 형식을 입력해주세요.';
    } else if (emailStatus === 'exists') {
      errors.email = '이미 등록된 이메일입니다.';
    } else if (emailStatus === 'withdrawn') {
      errors.email = '탈퇴한 계정입니다. 재가입 안내를 확인해주세요.';
    }

    const phoneErr = validatePhone(phone);
    if (phoneErr) errors.phone = phoneErr;

    setFieldErrors(prev => ({ ...prev, ...errors }));
    setTouched({ name: true, email: true, phone: true });

    if (Object.values(errors).some(e => !!e)) {
      setError('');
      return false;
    }

    if (emailStatus === 'checking') {
      setError('이메일 확인 중입니다. 잠시 후 다시 시도해주세요.');
      return false;
    }

    setError('');
    return true;
  }, [name, email, phone, emailStatus]);

  const validateStep2 = useCallback(() => {
    if (password.length < 8) { setError('비밀번호는 8자 이상이어야 합니다.'); return false; }
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    if (!hasLetter || !hasNumber || !hasSpecial) {
      setError('비밀번호는 영문자, 숫자, 특수문자를 모두 포함해야 합니다.');
      return false;
    }
    if (password !== confirmPassword) { setError('비밀번호가 일치하지 않습니다.'); return false; }
    if (strength.level < 2) { setError('보안을 위해 더 강력한 비밀번호를 설정해주세요.'); return false; }
    setError('');
    return true;
  }, [password, confirmPassword, strength]);

  const handleNext = useCallback(() => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  }, [step, validateStep1, validateStep2]);

  const handlePrev = useCallback(() => {
    setError('');
    setStep((prev) => Math.max(1, prev - 1));
  }, []);

  /** 탈퇴 계정 재활성화 후 로그인 페이지로 안내 */
  const [reactivated, setReactivated] = useState(false);
  const handleReactivate = useCallback(async () => {
    try {
      const result = await apiFetch('/api/users/reactivate', {
        method: 'POST',
        body: { email },
      });
      if (result.success) {
        setShowReactivateModal(false);
        setReactivated(true);
      } else {
        setError('계정 재활성화에 실패했습니다.');
      }
    } catch {
      setError('서버에 연결할 수 없습니다.');
    }
  }, [email]);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!securityQuestion) { setError('보안질문을 선택해주세요.'); return; }
    if (!securityAnswer.trim()) { setError('보안질문 답변을 입력해주세요.'); return; }

    setError('');
    setLoading(true);

    try {
      const result = await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: {
          email,
          password,
          name,
          phone: phone.replace(/[\s-]/g, '') || null,
          securityQuestion,
          securityAnswer,
        },
      });

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error?.message || '회원가입에 실패했습니다.');
      }
    } catch {
      setError('서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [email, password, name, phone, securityQuestion, securityAnswer]);

  return {
    step,
    error,
    setError,
    success,
    loading,
    name, setName,
    email, handleEmailChange,
    phone, handlePhoneChange,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    securityQuestion, setSecurityQuestion,
    securityAnswer, setSecurityAnswer,
    strength,
    fieldErrors,
    touched,
    emailStatus,
    handleBlur,
    handleNext,
    handlePrev,
    handleSubmit,
    showReactivateModal,
    setShowReactivateModal,
    handleReactivate,
    reactivated,
  };
}
