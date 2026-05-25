import { useEffect, useRef } from 'react';
import { requestForToken, onMessageListener } from '@/lib/firebase';

export function useFCM(userPresent: boolean) {
  const isRegistered = useRef(false);

  useEffect(() => {
    console.log('[useFCM Debug] effect 실행, userPresent:', userPresent);
    // 유저가 로그인 상태일 때만 FCM 토큰 발급 및 등록 진행
    if (!userPresent) {
      console.log('[useFCM Debug] userPresent=false → 종료');
      isRegistered.current = false;
      return;
    }

    const initFCM = async () => {
      console.log('[useFCM Debug] initFCM 시작, isRegistered:', isRegistered.current);
      if (isRegistered.current) {
        console.log('[useFCM Debug] 이미 등록됨 → 종료');
        return;
      }
      isRegistered.current = true;

      // 1. 서비스 워커 등록
      if ('serviceWorker' in navigator) {
        try {
          console.log('[useFCM Debug] SW 등록 시도');
          await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('[useFCM Debug] SW 등록 성공');
        } catch (err) {
          console.error('Service Worker 등록 실패:', err);
        }
      }

      // 2. 알림 권한 및 토큰 요청
      console.log('[useFCM Debug] requestForToken 호출');
      const token = await requestForToken();
      console.log('[useFCM Debug] requestForToken 결과:', token ? `${token.slice(0, 20)}...` : 'null');
      if (token) {
        const savedToken = localStorage.getItem('fcm-token');

        // 이미 같은 토큰이 등록되어 있으면 서버 전송 생략
        if (savedToken === token) {
          console.log('[FCM] 기존 토큰과 동일 — 서버 등록 생략');
          return;
        }

        // localStorage에 저장 (로그아웃 시 DELETE 호출용)
        localStorage.setItem('fcm-token', token);

        // 3. 발급받은 토큰을 백엔드로 전송
        try {
          await fetch('/api/fcm/tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, deviceType: 'WEB' }),
          });
          console.log('[FCM] 토큰 서버 등록 성공');
        } catch (e) {
          console.error('[FCM] 토큰 서버 등록 실패', e);
        }
      }
    };

    initFCM();

    // 4. 포그라운드 메시지 수신 시 처리
    const unsubscribe = onMessageListener((payload: any) => {
      console.log('[FCM] 포그라운드 메시지 수신:', payload);
      window.dispatchEvent(new Event('notif-received'));

      // 탭이 비활성(다른 탭/사이트를 보고 있을 때)일 때만 브라우저 알림을 띄웁니다.
      // 탭이 활성 상태(우리 사이트를 보고 있을 때)에는 벨 아이콘 배지 갱신만 합니다.
      if (document.hidden && Notification.permission === 'granted' && payload.notification) {
        new Notification(payload.notification.title || '알림', {
          body: payload.notification.body || '',
          icon: '/logo.png',
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [userPresent]);
}
