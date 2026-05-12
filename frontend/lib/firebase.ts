import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// SSR 환경에서는 Firebase 초기화를 건너뜁니다
const app = typeof window !== 'undefined' 
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : null;

export const requestForToken = async () => {
  if (typeof window === 'undefined') return null;

  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('이 브라우저는 FCM을 지원하지 않습니다.');
      return null;
    }

    if (!app) return null;
    const messaging = getMessaging(app);
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      const currentToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });
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

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (typeof window === 'undefined' || !app) return;
    try {
      const messaging = getMessaging(app);
      onMessage(messaging, (payload) => {
        resolve(payload);
      });
    } catch (e) {
      // ignore
    }
  });
