'use client';

import { useState, FormEvent, useCallback, useMemo } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import { getPasswordStrength } from '@/lib/utils';

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

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  // 유효성 검사 로직
  const validateStep1 = useCallback(() => {
    if (!name.trim()) { setError('이름을 입력해주세요.'); return false; }
    if (!email.trim()) { setError('이메일을 입력해주세요.'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('올바른 이메일 형식을 입력해주세요.'); return false; }
    setError('');
    return true;
  }, [name, email]);

  const validateStep2 = useCallback(() => {
    if (password.length < 8) { setError('비밀번호는 8자 이상이어야 합니다.'); return false; }
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
          phone: phone || null,
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
    email, setEmail,
    phone, setPhone,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    securityQuestion, setSecurityQuestion,
    securityAnswer, setSecurityAnswer,
    strength,
    handleNext,
    handlePrev,
    handleSubmit,
  };
}
