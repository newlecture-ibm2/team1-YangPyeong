'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api-fetch';
import styles from '../../(auth)/login/page.module.css';

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('구글 로그인이 취소되었습니다.');
      return;
    }

    if (!code) {
      setError('인증 코드가 없습니다.');
      return;
    }

    const redirectUri = `${window.location.origin}/auth/google/callback`;

    apiFetch('/api/auth/social-login/google', {
      method: 'POST',
      body: { code, redirectUri },
    }).then((result) => {
      if (result.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(result.error?.message || '구글 로그인에 실패했습니다.');
      }
    });
  }, [searchParams, router]);

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard} style={{ textAlign: 'center' }}>
        <div className={styles.logoArea}>
          <span className={styles.logoIcon}>🌱</span>
          <span className={styles.logoText}>Farm<em>Balance</em></span>
        </div>
        {error ? (
          <>
            <div className={styles.errorMsg}>{error}</div>
            <button className={styles.submitBtn} onClick={() => router.push('/login')}>
              로그인 페이지로 돌아가기
            </button>
          </>
        ) : (
          <p style={{ color: 'var(--color-text-secondary)', marginTop: 24 }}>
            구글 로그인 처리 중...
          </p>
        )}
      </div>
    </div>
  );
}
