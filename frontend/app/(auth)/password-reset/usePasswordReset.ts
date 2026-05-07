'use client';

import { useState, FormEvent, useCallback } from 'react';
import { apiFetch } from '@/lib/api-fetch';

export default function usePasswordReset() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [answerError, setAnswerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  // 데이터 상태
  const [email, setEmail] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');

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

  // Step 2: 답변 검증 → 임시 비밀번호 이메일 발송
  const handleAnswerSubmit = useCallback(async () => {
    if (!securityAnswer.trim()) { setAnswerError('보안질문 답변을 입력해주세요.'); return; }
    setAnswerError('');
    setError('');
    setLoading(true);

    try {
      const result = await apiFetch('/api/auth/password-reset', {
        method: 'POST',
        body: { email, securityAnswer },
      });

      if (result.success) {
        setSuccess(true);
      } else {
        const msg = result.error?.message || '';
        if (msg.includes('이메일 발송')) {
          setAnswerError('이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
        } else {
          setAnswerError(msg || '보안질문 답변이 일치하지 않습니다.');
        }
      }
    } catch {
      setAnswerError('서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [email, securityAnswer]);

  // 재발송 요청 (60초 쿨다운)
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;
    setResendLoading(true);
    setResendMessage('');

    try {
      const result = await apiFetch('/api/auth/password-reset', {
        method: 'POST',
        body: { email, securityAnswer },
      });

      if (result.success) {
        setResendMessage('새 임시 비밀번호가 발송되었습니다. 이전 비밀번호는 사용할 수 없습니다.');
        // 60초 쿨다운 시작
        setResendCooldown(60);
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) { clearInterval(timer); return 0; }
            return prev - 1;
          });
        }, 1000);
      } else {
        setResendMessage(result.error?.message || '재발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    } catch {
      setResendMessage('서버에 연결할 수 없습니다.');
    } finally {
      setResendLoading(false);
    }
  }, [email, securityAnswer, resendCooldown]);

  // form onSubmit 핸들러 (form submit 이벤트 방지용)
  const handleFormSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
  }, []);

  const handlePrev = useCallback(() => {
    setError('');
    setAnswerError('');
    setStep((prev) => Math.max(1, prev - 1));
  }, []);

  return {
    step,
    error, setError,
    success,
    loading,
    resendLoading,
    resendCooldown,
    resendMessage,
    email, setEmail,
    securityQuestion,
    securityAnswer, setSecurityAnswer,
    answerError, setAnswerError,
    handleEmailSubmit,
    handleAnswerSubmit,
    handleResend,
    handleFormSubmit,
    handlePrev,
  };
}

