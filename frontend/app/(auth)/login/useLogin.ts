'use client';

import { useState, FormEvent, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-fetch';

// ── OAuth 설정 ──
const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || '';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const REDIRECT_BASE = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

export default function useLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReactivate, setShowReactivate] = useState(false);
  const [reactivateEmail, setReactivateEmail] = useState('');

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      if (result.success) {
        router.push('/');
        router.refresh();
      } else {
        // 탈퇴 계정 감지
        if (result.error?.code === 'E-USER-004') {
          setReactivateEmail(email);
          setShowReactivate(true);
        } else {
          setError(result.error?.message || '로그인에 실패했습니다.');
        }
      }
    } catch {
      setError('서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [email, password, router]);

  /** 탈퇴 계정 재활성화 후 자동 로그인 */
  const handleReactivate = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const reactivateResult = await apiFetch('/api/users/reactivate', {
        method: 'POST',
        body: { email: reactivateEmail },
      });

      if (reactivateResult.success) {
        // 재활성화 성공 → 자동 로그인 시도
        const loginResult = await apiFetch('/api/auth/login', {
          method: 'POST',
          body: { email: reactivateEmail, password },
        });

        if (loginResult.success) {
          setShowReactivate(false);
          router.push('/');
          router.refresh();
        } else {
          setError('계정이 복구되었습니다. 다시 로그인해주세요.');
          setShowReactivate(false);
        }
      } else {
        setError(reactivateResult.error?.message || '계정 복구에 실패했습니다.');
      }
    } catch {
      setError('계정 복구 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [reactivateEmail, password, router]);

  const cancelReactivate = useCallback(() => {
    setShowReactivate(false);
    setReactivateEmail('');
  }, []);

  const handleKakaoLogin = useCallback(() => {
    const redirectUri = `${REDIRECT_BASE}/auth/kakao/callback`;
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
    window.location.href = kakaoAuthUrl;
  }, []);

  const handleGoogleLogin = useCallback(() => {
    const redirectUri = `${REDIRECT_BASE}/auth/google/callback`;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('email profile')}&access_type=offline&prompt=consent`;
    window.location.href = googleAuthUrl;
  }, []);

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    loading,
    showReactivate,
    handleSubmit,
    handleReactivate,
    cancelReactivate,
    handleKakaoLogin,
    handleGoogleLogin,
  };
}
