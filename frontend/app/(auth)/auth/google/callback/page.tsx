'use client';

import { Suspense, useEffect, useState, useRef } from 'react';
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

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState('');
  const [isWithdrawn, setIsWithdrawn] = useState(false);
  const [withdrawnEmail, setWithdrawnEmail] = useState('');
  const [isReactivating, setIsReactivating] = useState(false);
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
      } else if (result.error?.code === 'E-USER-004') {
        const msg = result.error?.message || '';
        const emailMatch = msg.startsWith('WITHDRAWN:') ? msg.replace('WITHDRAWN:', '') : '';
        setIsWithdrawn(true);
        setWithdrawnEmail(emailMatch);
      } else {
        setError(result.error?.message || '구글 로그인에 실패했습니다.');
      }
    });
  }, [searchParams, router]);

  /** 계정 재활성화 후 로그인 페이지로 이동 */
  const handleReactivate = async () => {
    setIsReactivating(true);
    try {
      if (withdrawnEmail) {
        const result = await apiFetch('/api/users/reactivate', {
          method: 'POST',
          body: { email: withdrawnEmail },
        });
        if (result.success) {
          router.push('/login');
          return;
        }
      }
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <p style={{ fontSize: 32, marginBottom: 8 }}>🌱</p>
        <p style={{ fontWeight: 700, fontSize: 22, marginBottom: 24 }}>
          Farm<em>Balance</em>
        </p>
        {isWithdrawn ? (
          <>
            <p style={{ color: '#334155', fontSize: 16, lineHeight: 1.6, marginBottom: 8 }}>
              이전에 탈퇴한 계정입니다.<br />
              다시 FarmBalance를 이용하시겠습니까?
            </p>
            <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 24 }}>
              계정을 복구하면 기존 정보로 다시 이용할 수 있습니다.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => router.push('/login')}
                disabled={isReactivating}
                style={{
                  padding: '12px 24px', borderRadius: 999, border: '1px solid #d1d5db',
                  background: '#fff', color: '#374151', fontWeight: 600, cursor: 'pointer',
                }}
              >
                취소
              </button>
              <button
                onClick={handleReactivate}
                disabled={isReactivating}
                style={{
                  padding: '12px 24px', borderRadius: 999, border: 'none',
                  background: '#2D6A4F', color: '#fff', fontWeight: 600, cursor: 'pointer',
                }}
              >
                {isReactivating ? '복구 중...' : '다시 시작하기'}
              </button>
            </div>
          </>
        ) : error ? (
          <>
            <p style={{ color: '#dc2626', marginBottom: 16 }}>{error}</p>
            <button
              onClick={() => router.push('/login')}
              style={{
                padding: '12px 28px', borderRadius: 999, border: 'none',
                background: '#2D6A4F', color: '#fff', fontWeight: 600, cursor: 'pointer',
              }}
            >
              로그인 페이지로 돌아가기
            </button>
          </>
        ) : (
          <p style={{ color: '#888', marginTop: 24 }}>
            구글 로그인 처리 중...
          </p>
        )}
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div style={containerStyle}>
        <div style={cardStyle}>
          <p style={{ color: '#888' }}>로딩 중...</p>
        </div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}
