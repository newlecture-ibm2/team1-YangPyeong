'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api-fetch';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';
import styles from './page.module.css';

// ── OAuth 설정 ──
const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID || '';
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const REDIRECT_BASE = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ── 일반 로그인 ──
  const handleSubmit = async (e: FormEvent) => {
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
  };

  // ── 카카오 로그인 (OAuth redirect) ──
  const handleKakaoLogin = () => {
    const redirectUri = `${REDIRECT_BASE}/auth/kakao/callback`;
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
    window.location.href = kakaoAuthUrl;
  };

  // ── 구글 로그인 (OAuth redirect) ──
  const handleGoogleLogin = () => {
    const redirectUri = `${REDIRECT_BASE}/auth/google/callback`;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('email profile')}&access_type=offline&prompt=consent`;
    window.location.href = googleAuthUrl;
  };

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        {/* 브랜드 */}
        <div className={styles.logoArea}>
          <Image src="/logo.png" alt="FarmBalance 로고" width={80} height={80} />
          <span className={styles.logoText}>Farm<em>Balance</em></span>
        </div>
        <p className={styles.authSub}>양평군 스마트 파밍 플랫폼</p>

        <h1 className={styles.authTitle}>로그인</h1>

        {/* 에러 메시지 */}
        {error && <div className={styles.errorMsg}>{error}</div>}

        {/* 로그인 폼 */}
        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="이메일"
            id="login-email"
            type="email"
            placeholder="example@farmbalance.kr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            label="비밀번호"
            id="login-password"
            type="password"
            placeholder="비밀번호를 입력해주세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <Button type="submit" variant="dark" size="lg" fullWidth disabled={loading}>
            {loading ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        {/* 소셜 로그인 */}
        <div className={styles.authDivider}>
          <span className={styles.dividerText}>또는 소셜 계정으로 로그인</span>
        </div>

        <div className={styles.socialBtns}>
          <Button variant="kakao" size="lg" fullWidth onClick={handleKakaoLogin}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3C6.48 3 2 6.36 2 10.5c0 2.67 1.78 5.01 4.44 6.34-.14.52-.92 3.34-.95 3.56 0 0-.02.16.08.22.1.06.22.03.22.03.29-.04 3.37-2.2 3.9-2.57.73.1 1.49.16 2.27.16h.04c5.52 0 10-3.36 10-7.5S17.52 3 12 3"/>
            </svg>
            카카오로 시작하기
          </Button>

          <Button variant="google" size="lg" fullWidth onClick={handleGoogleLogin}>
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google로 시작하기
          </Button>
        </div>

        {/* 회원가입 링크 */}
        <p className={styles.authFooter}>
          아직 계정이 없으신가요?{' '}
          <Link href="/signup" className={styles.footerLink}>회원가입</Link>
        </p>
      </div>
    </div>
  );
}
