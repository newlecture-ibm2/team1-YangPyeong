'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button/Button';
import { useToast } from '@/components/common/Toast';

export default function AdminLogoutButton() {
  const router = useRouter();
  const toast = useToast();

  const handleLogout = async () => {
    try {
      // 로그아웃 BFF 라우트 호출 (쿠키 삭제)
      await fetch('/api/auth/logout', { method: 'POST' });
      // 로그인 페이지로 리다이렉트
      router.push('/login');
      router.refresh(); // 상태 갱신
    } catch (error) {
      console.error('로그아웃 실패:', error);
      toast.error('로그아웃 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <Button 
      variant="outline" 
      style={{ width: '100%', borderColor: '#ef4444', color: '#ef4444', marginTop: '12px' }} 
      onClick={handleLogout}
    >
      로그아웃
    </Button>
  );
}
