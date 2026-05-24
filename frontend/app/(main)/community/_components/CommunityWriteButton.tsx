'use client';

import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button';
import ModalDialog from '@/components/common/Modal/ModalDialog';
import { useModalDialog } from '@/components/common/Modal/useModalDialog';

function getUserFromCookie() {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)fb-user=([^;]*)/);
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return null;
  }
}

export default function CommunityWriteButton() {
  const router = useRouter();
  const { dialog, showConfirm, handleConfirm, handleClose } = useModalDialog();

  const handleWriteClick = async () => {
    const user = getUserFromCookie();
    if (!user) {
      const isConfirmed = await showConfirm(
        '로그인이 필요한 서비스입니다.\n로그인 페이지로 이동하시겠습니까?',
        '로그인 안내'
      );
      if (isConfirmed) {
        router.push('/login?callbackUrl=/community/write');
      }
      return;
    }
    router.push('/community/write');
  };

  return (
    <>
      <Button
        variant="primary"
        size="md"
        onClick={handleWriteClick}
        data-guide="community-write"
        style={{ borderRadius: '50px' }}
      >
        지식 공유하기
      </Button>
      <ModalDialog
        {...dialog}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    </>
  );
}
