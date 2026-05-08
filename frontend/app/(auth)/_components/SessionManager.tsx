'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiFetch } from '@/lib/api-fetch';
import ModalDialog from '@/components/common/Modal/ModalDialog';
import { useModalDialog } from '@/components/common/Modal/useModalDialog';

/**
 * 30분 무활동 시 자동 로그아웃 매니저
 */
export default function SessionManager() {
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { dialog, showAlert, handleConfirm, handleClose } = useModalDialog();

  // 자동 로그아웃 시간 (30분)
  const TIMEOUT_MS = 30 * 60 * 1000;

  const handleLogout = useCallback(async () => {
    try {
      // 1. 서버 세션 종료 시도 (실패해도 무시하고 진행)
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Auto logout API failed', error);
    } finally {
      // 2. 클라이언트 쿠키 강제 삭제
      document.cookie = 'fb-user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // 3. 인증 상태 변경 이벤트 발생 (Header 등 UI 갱신용)
      window.dispatchEvent(new Event('auth-changed'));
      
      showAlert('30분 동안 활동이 없어 자동 로그아웃 되었습니다.', '자동 로그아웃');
      router.push('/login');
      router.refresh();
    }
  }, [router, showAlert]);

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

  return (
    <ModalDialog
      {...dialog}
      onConfirm={handleConfirm}
      onClose={handleClose}
    />
  );
}
