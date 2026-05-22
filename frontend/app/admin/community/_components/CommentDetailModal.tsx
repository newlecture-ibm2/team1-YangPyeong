import { useState, useEffect } from 'react'
import Modal from '@/components/common/Modal/Modal'
import Button from '@/components/common/Button/Button'
import Badge from '@/components/common/Badge/Badge'
import ReasonModal from './ReasonModal'
import { fetchPostDetail, deleteComment, hideComment, restoreComment } from '../../_lib/community.api'
import type { AdminPost, AdminComment } from '../../_lib/community.types'
import styles from './CommentDetailModal.module.css'
import { useToast } from '@/components'

interface CommentDetailModalProps {
  comment: AdminComment | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export default function CommentDetailModal({ comment, isOpen, onClose, onUpdate }: CommentDetailModalProps) {
  const [post, setPost] = useState<AdminPost | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [reasonModalOpen, setReasonModalOpen] = useState(false)
  
  const toast = useToast()

  useEffect(() => {
    if (isOpen && comment?.postId) {
      loadPostDetail(comment.postId)
    } else {
      setPost(null)
      setError('')
    }
  }, [isOpen, comment])

  const loadPostDetail = async (id: number) => {
    setLoading(true)
    setError('')
    try {
      const postData = await fetchPostDetail(id)
      setPost(postData)
    } catch (err) {
      setError(err instanceof Error ? err.message : '원본 게시글 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!comment) return
    if (!confirm('이 댓글을 완전 삭제하시겠습니까? (복구 불가)')) return
    try {
      await deleteComment(comment.id)
      toast.success('댓글이 완전히 삭제되었습니다.')
      onUpdate()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '댓글 삭제 실패')
    }
  }

  const handleRestore = async () => {
    if (!comment) return
    if (!confirm('숨겨진 댓글을 다시 복구하시겠습니까?')) return
    try {
      await restoreComment(comment.id)
      toast.success('댓글이 복구되었습니다.')
      onUpdate()
      onClose()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? (e as Error).message : '복구 실패')
    }
  }

  const handleHideConfirm = async (reason: string) => {
    if (!comment) return
    try {
      await hideComment(comment.id, reason)
      toast.success('댓글이 숨김 처리되었습니다.')
      setReasonModalOpen(false)
      onUpdate()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '댓글 숨김 실패')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="댓글 전체보기 및 문맥 확인" size="lg">
      <div className={styles.container}>
        {loading && <div className={styles.centerText}>로딩 중...</div>}
        {error && <div className={styles.errorText}>{error}</div>}
        
        {/* Original Post Section (Subtle background) */}
        {!loading && !error && post && (
          <div className={styles.postSection}>
            <div className={styles.postLabel}>원본 게시글 참고</div>
            <div className={styles.postHeader}>
              <h3 className={styles.postTitle}>{post.title}</h3>
              <span className={styles.postAuthor}>작성자: {post.authorNickname || `User ${post.authorId}`}</span>
            </div>
            <div className={styles.postContent}>
              {post.content}
            </div>
          </div>
        )}

        {/* Target Comment Section (Highlighted) */}
        {comment && (
          <div className={styles.commentSection}>
            <div className={styles.commentLabel}>검수 대상 댓글</div>
            <div className={styles.commentBox}>
              <div className={styles.commentHeader}>
                <div>
                  <span className={styles.commentAuthor}>{comment.authorNickname || `User ${comment.authorId}`}</span>
                  <span className={styles.commentEmail}>{comment.authorEmail}</span>
                </div>
                <div className={styles.commentMeta}>
                  <span>작성일: {new Date(comment.createdAt).toLocaleString()}</span>
                  <div style={{ marginTop: '4px', textAlign: 'right' }}>
                    {comment.deletedAt
                      ? <Badge variant="red">삭제됨</Badge>
                      : comment.isHidden 
                        ? <Badge variant="orange">숨김</Badge> 
                        : <Badge variant="green">활성</Badge>}
                  </div>
                </div>
              </div>
              <div className={styles.commentContent}>
                {comment.content}
              </div>
            </div>
          </div>
        )}
        
        <div className={styles.actions}>
          <div className={styles.leftActions}>
            {comment && (
              <>
                {comment.deletedAt ? (
                  <Button variant="outline" onClick={handleRestore}>복구</Button>
                ) : comment.isHidden ? (
                  <>
                    <Button variant="outline" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} onClick={handleDelete}>완전 삭제</Button>
                    <Button variant="outline" onClick={handleRestore}>복구</Button>
                  </>
                ) : (
                  <Button variant="outline" style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} onClick={() => setReasonModalOpen(true)}>
                    숨김 처리
                  </Button>
                )}
              </>
            )}
          </div>
          <Button variant="primary" onClick={onClose}>닫기</Button>
        </div>
      </div>

      <ReasonModal
        isOpen={reasonModalOpen}
        title="댓글 숨김 처리"
        onClose={() => setReasonModalOpen(false)}
        onConfirm={handleHideConfirm}
      />
    </Modal>
  )
}
