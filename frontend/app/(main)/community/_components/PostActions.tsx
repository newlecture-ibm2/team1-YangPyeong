'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/common/Button';
import { deletePost } from '../_lib/community.api';
import { apiFetch } from '@/lib/api-fetch';
import ReportButton from './ReportButton';

interface PostActionsProps {
  postId: number;
  authorId: number;
}

/**
 * 게시글 수정/삭제 버튼 컴포넌트
 * 작성자 본인에게만 노출되며 삭제 확인 및 API 호출을 처리합니다.
 * 작성자가 아닌 경우 신고 버튼이 노출됩니다.
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
    <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', alignItems: 'center' }}>
      {isAuthor ? (
        <>
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
        </>
      ) : (
        <ReportButton 
          targetId={postId} 
          targetType="POST" 
          style={{ 
            padding: '4px 12px', 
            fontSize: '0.8125rem',
            color: '#666',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#fff'
          }}
        />
      )}
    </div>
  );
}
