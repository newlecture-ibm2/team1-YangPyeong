'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiFetch } from '@/lib/api-fetch';

/**
 * 30분 무활동 시 자동 로그아웃 매니저
 */
export default function SessionManager() {
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 자동 로그아웃 시간 (30분)
  const TIMEOUT_MS = 30 * 60 * 1000;

  const handleLogout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
      // 쿠키 삭제 (클라이언트 사이드에서도 시도)
      document.cookie = 'fb-user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      alert('30분 동안 활동이 없어 자동 로그아웃 되었습니다.');
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Auto logout failed', error);
      window.location.href = '/login';
    }
  }, [router]);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // 로그인/회원가입 페이지 등 인증이 필요 없는 페이지에서는 타이머 작동 안 함
    const isPublicPage = pathname === '/login' || pathname === '/signup' || pathname === '/password-reset';
    if (isPublicPage) return;

    timeoutRef.current = setTimeout(handleLogout, TIMEOUT_MS);
  }, [handleLogout, pathname, TIMEOUT_MS]);

  useEffect(() => {
    // 활동 감지 이벤트 리스너 등록
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    // 초기 타이머 시작
    resetTimer();

    return () => {
      // 클린업
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [resetTimer]);

  return null; // UI는 없음
}
