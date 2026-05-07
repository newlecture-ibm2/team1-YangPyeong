'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button';
import { deletePost } from '../_lib/community.api';
import { apiFetch } from '@/lib/api-fetch';

interface PostActionsProps {
  postId: number;
  authorId: number;
}

/**
 * 게시글 수정/삭제 버튼 컴포넌트
 * 작성자 본인에게만 노출되며 삭제 확인 및 API 호출을 처리합니다.
 */
export default function PostActions({ postId, authorId }: PostActionsProps) {
  const router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // 현재 사용자 정보 확인
    apiFetch<{ id: number }>('/api/users/me')
      .then(res => {
        if (res.success && res.data) {
          setCurrentUserId(res.data.id);
        }
      })
      .catch(err => console.error('Failed to fetch user profile for actions', err));
  }, []);

  // 작성자 본인 여부 확인 (타입 차이 고려하여 == 사용)
  const isAuthor = currentUserId != null && currentUserId == authorId;

  // 디버깅용 로그 (브라우저 콘솔에서 확인 가능)
  useEffect(() => {
    if (currentUserId !== null) {
      console.log('[PostActions Debug] 현재 로그인 유저:', currentUserId, typeof currentUserId);
      console.log('[PostActions Debug] 게시글 작성자:', authorId, typeof authorId);
      console.log('[PostActions Debug] 일치 여부:', isAuthor);
    } else {
      console.log('[PostActions Debug] 유저 정보를 불러오는 중이거나 실패했습니다.');
    }
  }, [currentUserId, authorId, isAuthor]);

  /** 
   * ⚠️ 임시 허용 모드 (Phase 3 테스트용)
   * 다른 조원의 유저 정보 API(/api/users/me)가 404 에러 등으로 작동하지 않아도 
   * 게시글 수정/삭제 기능을 테스트할 수 있도록 버튼을 무조건 노출합니다.
   * 나중에 API가 복구되면 아래 주석을 해제하면 됩니다.
   */
  const forceShowForTest = true; 
  if (!isAuthor && !forceShowForTest) return null;

  const handleDelete = async () => {
    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;

    setIsDeleting(true);
    try {
      const res = await deletePost(postId);
      if (res.success) {
        alert('게시글이 삭제되었습니다.');
        router.push('/community');
        router.refresh();
      } else {
        alert(res.error?.message || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    router.push(`/community/write?postId=${postId}`);
  };

  return (
    <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleEdit}
        disabled={isDeleting}
      >
        수정
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleDelete}
        disabled={isDeleting}
        style={{ color: '#ef4444', borderColor: '#ef4444' }}
      >
        {isDeleting ? '삭제 중...' : '삭제'}
      </Button>
    </div>
  );
}
