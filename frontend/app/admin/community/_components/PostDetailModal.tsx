import { useState, useEffect } from 'react'
import Modal from '@/components/common/Modal/Modal'
import Button from '@/components/common/Button/Button'
import Badge from '@/components/common/Badge/Badge'
import { fetchPostDetail, fetchComments, deleteComment } from '../../_lib/community.api'
import type { AdminPost, AdminComment } from '../../_lib/community.types'
import styles from './PostDetailModal.module.css'

interface PostDetailModalProps {
  postId: number | null
  isOpen: boolean
  onClose: () => void
}

export default function PostDetailModal({ postId, isOpen, onClose }: PostDetailModalProps) {
  const [post, setPost] = useState<AdminPost | null>(null)
  const [comments, setComments] = useState<AdminComment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen && postId) {
      loadPostDetail(postId)
    } else {
      setPost(null)
      setComments([])
      setError('')
    }
  }, [isOpen, postId])

  const loadPostDetail = async (id: number) => {
    setLoading(true)
    setError('')
    try {
      const [postData, commentsData] = await Promise.all([
        fetchPostDetail(id),
        fetchComments(id)
      ])
      setPost(postData)
      setComments(commentsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : '정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return
    try {
      await deleteComment(commentId)
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, deletedAt: new Date().toISOString() } : c))
    } catch (err) {
      alert(err instanceof Error ? err.message : '댓글 삭제 실패')
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="게시글 상세 및 댓글 관리" size="lg">
      <div className={styles.container}>
        {loading && <div className={styles.centerText}>로딩 중...</div>}
        {error && <div className={styles.errorText}>{error}</div>}
        
        {!loading && !error && post && (
          <div className={styles.postSection}>
            <div className={styles.postHeader}>
              <div className={styles.titleRow}>
                {post.isNotice && <Badge variant="green">공지</Badge>}
                <h2 className={styles.title}>{post.title}</h2>
              </div>
              <div className={styles.postMeta}>
                <span>작성자 ID: {post.authorId}</span>
                <span>조회수: {post.viewCount}</span>
                <span>작성일: {new Date(post.createdAt).toLocaleString()}</span>
              </div>
            </div>
            <div className={styles.postContent}>
              {post.content}
            </div>
          </div>
        )}

        {!loading && !error && post && (
          <div className={styles.commentSection}>
            <h3 className={styles.commentTitle}>댓글 목록 ({comments.length}개)</h3>
            {comments.length === 0 ? (
              <div className={styles.centerText}>작성된 댓글이 없습니다.</div>
            ) : (
              <div className={styles.commentList}>
                {comments.map(comment => (
                  <div key={comment.id} className={`${styles.commentItem} ${comment.deletedAt ? styles.deleted : ''}`}>
                    <div className={styles.commentMeta}>
                      <span className={styles.commentAuthor}>작성자 ID: {comment.authorId}</span>
                      <span className={styles.commentDate}>{new Date(comment.createdAt).toLocaleString()}</span>
                      {comment.deletedAt && <Badge variant="red">삭제됨</Badge>}
                    </div>
                    <div className={styles.commentBody}>
                      <div className={styles.commentContent}>{comment.content}</div>
                      <div className={styles.commentAction}>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          disabled={!!comment.deletedAt}
                          onClick={() => handleDeleteComment(comment.id)}
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose}>닫기</Button>
        </div>
      </div>
    </Modal>
  )
}
