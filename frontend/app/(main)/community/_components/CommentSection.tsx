'use client';

import { useState, useEffect } from 'react';
import styles from './CommentSection.module.css';
import Button from '@/components/common/Button';
import { createComment, acceptComment, updateComment, deleteComment } from '../_lib/community.api';
import { apiFetch } from '@/lib/api-fetch';
import { formatDate } from '../_lib/formatUtils';
import ReportButton from './ReportButton';
import { useToast } from '@/components/common/Toast/ToastContext';
import ModalDialog from '@/components/common/Modal/ModalDialog';
import { useModalDialog } from '@/components/common/Modal/useModalDialog';
import Badge from '@/components/common/Badge/Badge';
import Input from '@/components/common/Input/Input';

import { Comment } from '../_lib/community.types';

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
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const { success: toastSuccess, error: toastError } = useToast();
  const { dialog, showConfirm, handleConfirm, handleClose } = useModalDialog();

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

  const handleSubmit = async (e: React.FormEvent, parentId?: number) => {
    e.preventDefault();
    const content = parentId ? replyContent : newComment;
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await createComment(postId, content, parentId);
      if (res.success && res.data) {
        setComments([...comments, res.data]);
        if (parentId) {
          setReplyContent('');
          setReplyingToId(null);
        } else {
          setNewComment('');
        }
        toastSuccess('댓글이 등록되었습니다.');
      } else {
        toastError('댓글 등록에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      toastError('에러가 발생했습니다.');
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
        toastSuccess('댓글이 수정되었습니다.');
      } else {
        toastError(res.error?.message || '댓글 수정에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      toastError('에러가 발생했습니다.');
    }
  };

  const handleDelete = async (commentId: number) => {
    const ok = await showConfirm('댓글을 삭제하시겠습니까?');
    if (!ok) return;

    try {
      const res = await deleteComment(commentId);
      if (res.success) {
        setComments(comments.map(c => 
          c.id === commentId 
            ? { ...c, isDeleted: true, content: '삭제된 메시지입니다.', authorNickname: '(삭제됨)', authorId: 0 } 
            : c
        ));
        toastSuccess('댓글이 삭제되었습니다.');
      } else {
        toastError(res.error?.message || '댓글 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      toastError('에러가 발생했습니다.');
    }
  };

  const handleAccept = async (commentId: number) => {
    const ok = await showConfirm('이 답변을 채택하시겠습니까? 채택 후에는 변경할 수 없습니다.');
    if (!ok) return;

    try {
      const res = await acceptComment(commentId);
      if (res.success) {
        setComments(comments.map(c => 
          c.id === commentId ? { ...c, accepted: true } : c
        ));
        toastSuccess('답변이 채택되었습니다.');
      } else {
        toastError(res.error?.message || '채택에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      toastError('에러가 발생했습니다.');
    }
  };

  return (
    <section className={styles.section}>
      <h3 className={styles.title}>댓글 {comments.filter(c => !c.isDeleted).length}</h3>
      
      <div className={styles.commentList}>
        {comments.filter(c => !c.parentId).map((comment) => (
          <div key={comment.id} className={styles.commentContainer}>
            {/* 부모 댓글 */}
            <div className={`${styles.commentItem} ${comment.accepted ? styles.commentItemAccepted : ''}`}>
              <div className={styles.commentHeader}>
                <div className={styles.commentHeaderLeft}>
                  <span className={styles.author}>
                    {comment.authorNickname || '알 수 없음'} 
                    {comment.authorId === postAuthorId && (
                      <Badge variant="dark" className={styles.authorBadge}>글쓴이</Badge>
                    )}
                  </span>
                  {comment.accepted && <Badge variant="green" className={styles.acceptedBadge}>채택된 답변</Badge>}
                </div>
                <div className={styles.commentHeaderRight}>
                  <span className={styles.date}>{formatDate(comment.createdAt)}</span>
                  <div className={styles.actions}>
                    {!comment.isDeleted && (
                      <>
                        {comment.authorId === currentUserId && !comment.accepted ? (
                          <>
                            <Button 
                              variant="ghost"
                              size="sm"
                              className={styles.actionBtn} 
                              onClick={() => {
                                setEditingId(comment.id);
                                setEditingContent(comment.content);
                              }}
                            >
                              수정
                            </Button>
                            <Button 
                              variant="ghost"
                              size="sm"
                              className={styles.actionBtn} 
                              onClick={() => handleDelete(comment.id)}
                            >
                              삭제
                            </Button>
                          </>
                        ) : (
                          <ReportButton 
                            targetId={comment.id} 
                            targetType="COMMENT" 
                            className={styles.actionBtn}
                          />
                        )}
                        <Button 
                          variant="ghost"
                          size="sm"
                          className={styles.actionBtn}
                          onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                        >
                          답글
                        </Button>
                      </>
                    )}
                    {isQA && isPostAuthor && !hasAccepted && !comment.accepted && !comment.isDeleted && comment.authorId !== currentUserId && (
                      <Button 
                        variant="outline"
                        size="sm"
                        className={styles.acceptBtn} 
                        onClick={() => handleAccept(comment.id)}
                      >
                        채택하기
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {editingId === comment.id ? (
                <div className={styles.editForm}>
                  <Input 
                    as="textarea"
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    rows={3}
                  />
                  <div className={styles.editActions}>
                    <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>취소</Button>
                    <Button variant="primary" size="sm" onClick={() => handleUpdate(comment.id)}>저장</Button>
                  </div>
                </div>
              ) : (
                <p className={`${styles.content} ${comment.isDeleted ? styles.deletedContent : ''}`}>
                  {comment.content}
                </p>
              )}

              {/* 답글 입력창 (인라인) */}
              {replyingToId === comment.id && (
                <div className={styles.replyForm}>
                  <Input
                    as="textarea"
                    placeholder="답글을 입력하세요..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={3}
                  />
                  <div className={styles.editActions}>
                    <Button variant="ghost" size="sm" onClick={() => setReplyingToId(null)}>취소</Button>
                    <Button 
                      variant="primary"
                      size="sm"
                      onClick={(e) => handleSubmit(e as any, comment.id)} 
                      disabled={isSubmitting || !replyContent.trim()}
                    >
                      {isSubmitting ? '등록 중...' : '답글 등록'}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 자식 댓글 (답글) */}
            {comments.filter(child => child.parentId === comment.id).map((child) => (
              <div key={child.id} className={`${styles.commentItem} ${styles.replyItem}`}>
                <div className={styles.commentHeader}>
                  <div className={styles.commentHeaderLeft}>
                    <span className={styles.author}>
                      {child.authorNickname || '알 수 없음'} 
                      {child.authorId === postAuthorId && (
                        <Badge variant="dark" className={styles.authorBadge}>글쓴이</Badge>
                      )}
                    </span>
                  </div>
                  <div className={styles.commentHeaderRight}>
                    <span className={styles.date}>{formatDate(child.createdAt)}</span>
                    <div className={styles.actions}>
                      {!child.isDeleted && (
                        <>
                          {child.authorId === currentUserId ? (
                            <>
                              <Button 
                                variant="ghost"
                                size="sm"
                                className={styles.actionBtn} 
                                onClick={() => {
                                  setEditingId(child.id);
                                  setEditingContent(child.content);
                                }}
                              >
                                수정
                              </Button>
                              <Button 
                                variant="ghost"
                                size="sm"
                                className={styles.actionBtn} 
                                onClick={() => handleDelete(child.id)}
                              >
                                삭제
                              </Button>
                            </>
                          ) : (
                            <ReportButton 
                              targetId={child.id} 
                              targetType="COMMENT" 
                              className={styles.actionBtn}
                            />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                {editingId === child.id ? (
                  <div className={styles.editForm}>
                    <Input 
                      as="textarea"
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={3}
                    />
                    <div className={styles.editActions}>
                      <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>취소</Button>
                      <Button variant="primary" size="sm" onClick={() => handleUpdate(child.id)}>저장</Button>
                    </div>
                  </div>
                ) : (
                  <p className={`${styles.content} ${child.isDeleted ? styles.deletedContent : ''}`}>
                    {child.content}
                  </p>
                )}
              </div>
            ))}
          </div>
        ))}
        {comments.length === 0 && (
          <p className={styles.empty}>첫 번째 댓글을 남겨보세요!</p>
        )}
      </div>

      <form className={styles.form} onSubmit={(e) => handleSubmit(e)}>
        <Input
          as="textarea"
          placeholder="댓글을 입력하세요..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={4}
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

      <ModalDialog {...dialog} onConfirm={handleConfirm} onClose={handleClose} />
    </section>
  );
}
