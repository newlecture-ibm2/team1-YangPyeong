'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api-fetch';

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(160deg, #F5F3EF 0%, #EBFBEE 50%, #F5F3EF 100%)',
  padding: 24,
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: '48px 40px',
  maxWidth: 440,
  width: '100%',
  boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  textAlign: 'center',
};

export default function KakaoCallbackPage() {
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
      setError('카카오 로그인이 취소되었습니다.');
      return;
    }

    if (!code) {
      setError('인증 코드가 없습니다.');
      return;
    }

    const redirectUri = `${window.location.origin}/auth/kakao/callback`;

    apiFetch('/api/auth/social-login/kakao', {
      method: 'POST',
      body: { code, redirectUri },
    }).then((result) => {
      if (result.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(result.error?.message || '카카오 로그인에 실패했습니다.');
      }
    });
  }, [searchParams, router]);

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <p style={{ fontSize: 32, marginBottom: 8 }}>🌱</p>
        <p style={{ fontWeight: 700, fontSize: 22, marginBottom: 24 }}>
          Farm<em>Balance</em>
        </p>
        {error ? (
          <>
            <p style={{ color: '#dc2626', marginBottom: 16 }}>{error}</p>
            <button
              onClick={() => router.push('/login')}
              style={{
                padding: '12px 28px',
                borderRadius: 999,
                border: 'none',
                background: '#2D6A4F',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              로그인 페이지로 돌아가기
            </button>
          </>
        ) : (
          <p style={{ color: '#888', marginTop: 24 }}>
            카카오 로그인 처리 중...
          </p>
        )}
      </div>
    </div>
  );
}
