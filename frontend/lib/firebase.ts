import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage, MessagePayload } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// 필수 설정값이 있는지 확인 (없으면 초기화 스킵)
const isFirebaseConfigValid = !!firebaseConfig.apiKey && !!firebaseConfig.projectId && firebaseConfig.projectId !== 'dummy';

// [DEBUG] Firebase 초기화 상태 로깅 (디버그 완료 후 제거)
if (typeof window !== 'undefined') {
  console.log('[Firebase Debug] config:', {
    apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.slice(0, 10)}...` : 'MISSING',
    projectId: firebaseConfig.projectId || 'MISSING',
    messagingSenderId: firebaseConfig.messagingSenderId || 'MISSING',
    appId: firebaseConfig.appId ? `${firebaseConfig.appId.slice(0, 15)}...` : 'MISSING',
  });
  console.log('[Firebase Debug] VAPID key:', process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ? `${process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY.slice(0, 10)}...` : 'MISSING');
  console.log('[Firebase Debug] isFirebaseConfigValid:', isFirebaseConfigValid);
}

// SSR 환경에서는 Firebase 초기화를 건너뜁니다
const app = typeof window !== 'undefined' && isFirebaseConfigValid
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : null;

if (typeof window !== 'undefined') {
  console.log('[Firebase Debug] app initialized:', app ? 'YES' : 'NO (null)');
}

export const requestForToken = async () => {
  console.log('[FCM Debug] requestForToken 시작');
  if (typeof window === 'undefined') {
    console.log('[FCM Debug] window undefined → return null');
    return null;
  }

  try {
    const supported = await isSupported();
    console.log('[FCM Debug] isSupported:', supported);
    if (!supported) {
      console.warn('이 브라우저는 FCM을 지원하지 않습니다.');
      return null;
    }

    if (!app) {
      console.warn('[FCM Debug] app이 null → Firebase 초기화 실패. return null');
      return null;
    }
    console.log('[FCM Debug] getMessaging 호출');
    const messaging = getMessaging(app);
    console.log('[FCM Debug] Notification.requestPermission 호출');
    const permission = await Notification.requestPermission();
    console.log('[FCM Debug] permission:', permission);

    if (permission === 'granted') {
      console.log('[FCM Debug] getToken 호출 시작');
      const currentToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });
      console.log('[FCM Debug] getToken 결과:', currentToken ? `${currentToken.slice(0, 20)}...` : 'EMPTY');
      if (currentToken) {
        return currentToken;
      } else {
        console.warn('토큰을 가져올 수 없습니다.');
        return null;
      }
    } else {
      console.warn('알림 권한이 거부되었습니다.');
      return null;
    }
  } catch (err) {
    console.error('푸시 알림 권한 요청 및 토큰 발급 오류:', err);
    return null;
  }
};

export const onMessageListener = (callback: (payload: MessagePayload) => void) => {
  if (typeof window === 'undefined' || !app) return null;
  const messaging = getMessaging(app);
  return onMessage(messaging, callback);
};
