'use client'

import { useState, useEffect, useCallback } from 'react'
import Badge from '@/components/common/Badge/Badge'
import { useToast } from '@/components/common/Toast'
import ModalDialog from '@/components/common/Modal/ModalDialog'
import { useModalDialog } from '@/components/common/Modal/useModalDialog'
import SearchInput from '@/components/common/SearchInput/SearchInput'
import FilterBar from '@/components/common/FilterBar/FilterBar'
import Dropdown from '@/components/common/Dropdown/Dropdown'
import styles from './Community.module.css'
import type { AdminPost } from '../_lib/community.types'
import { fetchPosts, deletePost, toggleNotice, createNotice } from '../_lib/community.api'
import NoticeCreateModal from './_components/NoticeCreateModal'
import PostDetailModal from './_components/PostDetailModal'
import Button from '@/components/common/Button/Button'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const pageSize = 20

  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const { dialog, showConfirm, handleConfirm, handleClose } = useModalDialog()
  const [noticeModalOpen, setNoticeModalOpen] = useState(false)
  
  const [postDetailModalOpen, setPostDetailModalOpen] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchPosts({ keyword, status: statusFilter, page, size: pageSize })
      setPosts(data.posts || data) // fallback for legacy api if needed, but data is now PaginatedAdminPosts
      if ('totalElements' in data) {
        setTotalElements(data.totalElements)
        setTotalPages(data.totalPages)
      } else {
        setTotalElements((data as any).length || 0)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '게시글 조회 실패')
    } finally {
      setLoading(false)
    }
  }, [keyword, statusFilter, page, toast])

  useEffect(() => { loadData() }, [loadData])

  const handleDelete = async (postId: number) => {
    const confirmed = await showConfirm('이 게시글을 삭제하시겠습니까?')
    if (!confirmed) return
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

  const handleCreateNotice = async (data: { title: string; content: string; categoryId: number }) => {
    try {
      await createNotice(data)
      toast.success('공지사항이 등록되었습니다.')
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '공지 작성 실패')
    }
  }

  const handleOpenDetail = (postId: number) => {
    setSelectedPostId(postId)
    setPostDetailModalOpen(true)
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>💬 커뮤니티 관리</h1>
          <p className={styles.pageSub}>게시글 삭제, 공지 지정, 신고 처리를 관리합니다. 총 {totalElements}건</p>
        </div>
        <Button variant="primary" onClick={() => setNoticeModalOpen(true)}>
          + 공지사항 작성
        </Button>
      </div>

      <div className={styles.filterSection}>
        <FilterBar
          dropdowns={[
            <Dropdown
              key="status"
              options={[
                { label: '전체 상태', value: 'ALL' },
                { label: '활성', value: 'ACTIVE' },
                { label: '삭제됨', value: 'DELETED' }
              ]}
              value={statusFilter}
              onChange={(val) => { setStatusFilter(val); setPage(0); }}
            />
          ]}
          search={
            <SearchInput
              placeholder="게시글 제목 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={() => setPage(0)}
            />
          }
        />
      </div>

      {loading && posts.length === 0 ? (
        <div className={styles.loadingWrap}>게시글 로딩 중...</div>
      ) : posts.length === 0 ? (
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
                        onClick={() => handleOpenDetail(post.id)}
                      >
                        상세보기
                      </button>
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

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <Button 
            variant="outline" 
            disabled={page === 0} 
            onClick={() => setPage(p => p - 1)}
          >
            이전
          </Button>
          <span className={styles.pageInfo}>{page + 1} / {totalPages}</span>
          <Button 
            variant="outline" 
            disabled={page >= totalPages - 1} 
            onClick={() => setPage(p => p + 1)}
          >
            다음
          </Button>
        </div>
      )}

      <ModalDialog
        {...dialog}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />

      <NoticeCreateModal
        isOpen={noticeModalOpen}
        onClose={() => setNoticeModalOpen(false)}
        onConfirm={handleCreateNotice}
      />

      <PostDetailModal
        postId={selectedPostId}
        isOpen={postDetailModalOpen}
        onClose={() => setPostDetailModalOpen(false)}
      />
    </div>
  )
}
