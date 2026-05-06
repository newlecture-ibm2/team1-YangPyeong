'use client'

import { useState, useEffect, useCallback } from 'react'
import Badge from '@/components/common/Badge/Badge'
import { useToast } from '@/components/common/Toast'
import styles from './Community.module.css'
import type { AdminPost } from '../_lib/community.types'
import { fetchPosts, deletePost, toggleNotice } from '../_lib/community.api'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const loadData = useCallback(async () => {
    try {
      const data = await fetchPosts()
      setPosts(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '게시글 조회 실패')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { loadData() }, [loadData])

  const handleDelete = async (postId: number) => {
    if (!confirm('이 게시글을 삭제하시겠습니까?')) return
    try {
      await deletePost(postId)
      toast.success('게시글이 삭제되었습니다.')
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '삭제 실패')
    }
  }

  const handleToggleNotice = async (postId: number, currentNotice: boolean) => {
    try {
      await toggleNotice(postId, !currentNotice)
      toast.success(!currentNotice ? '공지로 설정되었습니다.' : '공지가 해제되었습니다.')
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isNotice: !currentNotice } : p))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '공지 설정 실패')
    }
  }

  if (loading) return <div className={styles.loadingWrap}>게시글 로딩 중...</div>

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>💬 커뮤니티 관리</h1>
          <p className={styles.pageSub}>게시글 삭제, 공지 지정, 신고 처리를 관리합니다. 총 {posts.length}건</p>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className={styles.emptyState}>등록된 게시글이 없습니다.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>제목</th>
                <th>조회수</th>
                <th>공지</th>
                <th>작성일</th>
                <th>상태</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id} className={post.deletedAt ? styles.deletedRow : ''}>
                  <td>{post.id}</td>
                  <td className={styles.titleCell}>{post.title}</td>
                  <td>{post.viewCount.toLocaleString()}</td>
                  <td>
                    {post.isNotice
                      ? <Badge variant="green">공지</Badge>
                      : <Badge variant="gray">일반</Badge>}
                  </td>
                  <td>{formatDate(post.createdAt)}</td>
                  <td>
                    {post.deletedAt
                      ? <Badge variant="red">삭제됨</Badge>
                      : <Badge variant="green">활성</Badge>}
                  </td>
                  <td>
                    <div className={styles.actionGroup}>
                      <button
                        className={styles.actionBtnNotice}
                        onClick={() => handleToggleNotice(post.id, post.isNotice)}
                        disabled={!!post.deletedAt}
                      >
                        {post.isNotice ? '공지 해제' : '공지 설정'}
                      </button>
                      <button
                        className={styles.actionBtnDanger}
                        onClick={() => handleDelete(post.id)}
                        disabled={!!post.deletedAt}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
