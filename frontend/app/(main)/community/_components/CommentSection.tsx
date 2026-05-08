'use client';

import { useState, useEffect } from 'react';
import styles from './CommentSection.module.css';
import Button from '@/components/common/Button';
import { createComment, acceptComment, updateComment, deleteComment } from '../_lib/community.api';
import { apiFetch } from '@/lib/api-fetch';
import { formatDate } from '../_lib/formatUtils';
import ReportButton from './ReportButton';

interface Comment {
  id: number;
  content: string;
  authorId: number;
  authorNickname?: string;
  accepted: boolean;
  createdAt: string;
}

interface CommentSectionProps {
  postId: number;
  initialComments: Comment[];
  postAuthorId: number;
  categoryName: string;
}

export default function CommentSection({ 
  postId, 
  initialComments,
  postAuthorId,
  categoryName 
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');

  useEffect(() => {
    // 현재 사용자 ID 가져오기
    apiFetch<{ id: number }>('/api/users/me')
      .then(res => {
        if (res.success && res.data) {
          setCurrentUserId(res.data.id);
        }
      })
      .catch(err => console.error('Failed to fetch user profile', err));
  }, []);

  const isPostAuthor = currentUserId === postAuthorId;
  const isQA = categoryName.includes('Q&A');
  const hasAccepted = comments.some(c => c.accepted);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await createComment(postId, newComment);
      if (res.success && res.data) {
        setComments([...comments, res.data]);
        setNewComment('');
      } else {
        alert('댓글 등록에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('에러가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (commentId: number) => {
    if (!editingContent.trim()) return;
    try {
      const res = await updateComment(commentId, editingContent);
      if (res.success && res.data) {
        setComments(comments.map(c => c.id === commentId ? res.data! : c));
        setEditingId(null);
      } else {
        alert(res.error?.message || '댓글 수정에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('에러가 발생했습니다.');
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      const res = await deleteComment(commentId);
      if (res.success) {
        setComments(comments.filter(c => c.id !== commentId));
      } else {
        alert(res.error?.message || '댓글 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('에러가 발생했습니다.');
    }
  };

  const handleAccept = async (commentId: number) => {
    if (!window.confirm('이 답변을 채택하시겠습니까? 채택 후에는 변경할 수 없습니다.')) return;

    try {
      const res = await acceptComment(commentId);
      if (res.success) {
        setComments(comments.map(c => 
          c.id === commentId ? { ...c, accepted: true } : c
        ));
        alert('답변이 채택되었습니다.');
      } else {
        alert(res.error?.message || '채택에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('에러가 발생했습니다.');
    }
  };

  return (
    <section className={styles.section}>
      <h3 className={styles.title}>댓글 {comments.length}</h3>
      
      <div className={styles.commentList}>
        {comments.map((comment) => (
          <div key={comment.id} className={`${styles.commentItem} ${comment.accepted ? styles.commentItemAccepted : ''}`}>
            <div className={styles.commentHeader}>
              <div className={styles.commentHeaderLeft}>
                <span className={styles.author}>{comment.authorNickname || '알 수 없음'} {comment.authorId === postAuthorId ? '(글쓴이)' : ''}</span>
                {comment.accepted && <span className={styles.acceptedBadge}>✅ 채택된 답변</span>}
              </div>
              <div className={styles.commentHeaderRight}>
                <span className={styles.date}>{formatDate(comment.createdAt)}</span>
                <div className={styles.actions}>
                  {comment.authorId === currentUserId && !comment.accepted && (
                    <>
                      <button 
                        className={styles.actionBtn} 
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditingContent(comment.content);
                        }}
                      >
                        수정
                      </button>
                      <button 
                        className={styles.actionBtn} 
                        onClick={() => handleDelete(comment.id)}
                      >
                        삭제
                      </button>
                    </>
                  ) : (
                    <ReportButton 
                      targetId={comment.id} 
                      targetType="COMMENT" 
                      className={styles.actionBtn}
                    />
                  )}
                  {isQA && isPostAuthor && !hasAccepted && !comment.accepted && comment.authorId !== currentUserId && (
                    <button 
                      className={styles.acceptBtn} 
                      onClick={() => handleAccept(comment.id)}
                    >
                      채택하기
                    </button>
                  )}
                </div>
              </div>
            </div>
            {editingId === comment.id ? (
              <div className={styles.editForm}>
                <textarea 
                  className={styles.editTextarea}
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                />
                <div className={styles.editActions}>
                  <button onClick={() => setEditingId(null)}>취소</button>
                  <button onClick={() => handleUpdate(comment.id)} className={styles.saveBtn}>저장</button>
                </div>
              </div>
            ) : (
              <p className={styles.content}>{comment.content}</p>
            )}
          </div>
        ))}
        {comments.length === 0 && (
          <p className={styles.empty}>첫 번째 댓글을 남겨보세요!</p>
        )}
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
        <textarea
          className={styles.textarea}
          placeholder="댓글을 입력하세요..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          maxLength={1000}
        />
        <div className={styles.submitArea}>
          <Button 
            type="submit" 
            variant="primary" 
            size="sm" 
            disabled={isSubmitting || !newComment.trim()}
          >
            {isSubmitting ? '등록 중...' : '댓글 등록'}
          </Button>
        </div>
      </form>
    </section>
  );
}
