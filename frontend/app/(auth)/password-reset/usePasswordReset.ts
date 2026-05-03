'use client';

import { useState, FormEvent, useCallback, useMemo } from 'react';
import { apiFetch } from '@/lib/api-fetch';
import { getPasswordStrength } from '@/lib/utils';

export default function usePasswordReset() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // 데이터 상태
  const [email, setEmail] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  // Step 1: 이메일로 보안질문 조회
  const handleEmailSubmit = useCallback(async () => {
    if (!email.trim()) { setError('이메일을 입력해주세요.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('올바른 이메일 형식을 입력해주세요.'); return; }

    setError('');
    setLoading(true);

    try {
      const result = await apiFetch<{ question: string }>('/api/auth/password-reset/question', {
        method: 'POST',
        body: { email },
      });

      if (result.success && result.data) {
        setSecurityQuestion(result.data.question);
        setStep(2);
      } else {
        setError(result.error?.message || '등록된 계정을 찾을 수 없습니다.');
      }
    } catch {
      setError('서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [email]);

  // Step 2: 답변 제출 (서버에서 검증 후 다음 단계)
  const [answerError, setAnswerError] = useState('');

  const handleAnswerSubmit = useCallback(async () => {
    if (!securityAnswer.trim()) { setAnswerError('보안질문 답변을 입력해주세요.'); return; }
    setAnswerError('');
    setError('');
    setLoading(true);

    try {
      const result = await apiFetch<boolean>('/api/auth/password-reset/verify-answer', {
        method: 'POST',
        body: { email, securityAnswer },
      });

      if (result.success && result.data === true) {
        setStep(3);
      } else {
        setAnswerError('보안질문 답변이 일치하지 않습니다.');
      }
    } catch {
      setAnswerError('서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [email, securityAnswer]);

  // Step 3: 비밀번호 재설정 제출
  const handleResetSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) { setError('비밀번호는 8자 이상이어야 합니다.'); return; }
    if (strength.level < 2) { setError('보안을 위해 더 강력한 비밀번호를 설정해주세요.'); return; }
    if (newPassword !== confirmPassword) { setError('비밀번호가 일치하지 않습니다.'); return; }

    setError('');
    setLoading(true);

    try {
      const result = await apiFetch('/api/auth/password-reset', {
        method: 'PUT',
        body: {
          email,
          securityAnswer,
          newPassword,
        },
      });

      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error?.message || '비밀번호 재설정에 실패했습니다.');
      }
    } catch {
      setError('서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [email, securityAnswer, newPassword, confirmPassword, strength]);

  const handlePrev = useCallback(() => {
    setError('');
    setStep((prev) => Math.max(1, prev - 1));
  }, []);

  return {
    step,
    error, setError,
    success,
    loading,
    email, setEmail,
    securityQuestion,
    securityAnswer, setSecurityAnswer,
    answerError, setAnswerError,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    strength,
    handleEmailSubmit,
    handleAnswerSubmit,
    handleResetSubmit,
    handlePrev,
  };
}
