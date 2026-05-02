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
        setError(result.error?.message || '로그인에 실패했습니다.');
      }
    } catch {
      setError('서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [email, password, router]);

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
    handleSubmit,
    handleKakaoLogin,
    handleGoogleLogin,
  };
}
