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
import type { AdminPost, AdminReport } from '../_lib/community.types'
import { fetchPosts, deletePost, toggleNotice, createNotice, fetchReports, updateReportStatus, aiModeratePosts } from '../_lib/community.api'
import NoticeCreateModal from './_components/NoticeCreateModal'
import PostDetailModal from './_components/PostDetailModal'
import Button from '@/components/common/Button/Button'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'POSTS' | 'REPORTS'>('POSTS')

  // Posts State
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Reports State
  const [reports, setReports] = useState<AdminReport[]>([])
  const [reportTotalElements, setReportTotalElements] = useState(0)
  const [reportTotalPages, setReportTotalPages] = useState(0)
  const [reportPage, setReportPage] = useState(0)
  const [reportStatusFilter, setReportStatusFilter] = useState('PENDING')

  const pageSize = 20

  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const { dialog, showConfirm, handleConfirm, handleClose } = useModalDialog()
  const [noticeModalOpen, setNoticeModalOpen] = useState(false)
  
  const [postDetailModalOpen, setPostDetailModalOpen] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const [isModerating, setIsModerating] = useState(false)

  const loadData = useCallback(async () => {
    if (activeTab === 'POSTS') {
      setLoading(true)
      try {
        const data = await fetchPosts({ keyword, status: statusFilter, page, size: pageSize })
        setPosts(data.posts || data) 
        if ('totalElements' in data) {
          setTotalElements(data.totalElements)
          setTotalPages(data.totalPages)
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '게시글 조회 실패')
      } finally {
        setLoading(false)
      }
    } else {
      setLoading(true)
      try {
        const data = await fetchReports({ status: reportStatusFilter, page: reportPage, size: pageSize })
        setReports(data.reports)
        setReportTotalElements(data.totalElements)
        setReportTotalPages(data.totalPages)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '신고 내역 조회 실패')
      } finally {
        setLoading(false)
      }
    }
  }, [activeTab, keyword, statusFilter, page, reportStatusFilter, reportPage, toast])

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

  const handleUpdateReportStatus = async (reportId: number, newStatus: string) => {
    try {
      await updateReportStatus(reportId, newStatus)
      toast.success('신고 상태가 변경되었습니다.')
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '신고 상태 변경 실패')
    }
  }

  const handleOpenDetail = (postId: number) => {
    setSelectedPostId(postId)
    setPostDetailModalOpen(true)
  }

  const handleAiModerate = async () => {
    if (!confirm('현재 활성화된 최신 게시글들을 AI가 일괄 검사하여 스팸 및 부적절한 게시글을 삭제(차단) 처리합니다. 진행하시겠습니까?')) return
    setIsModerating(true)
    try {
      const res = await aiModeratePosts()
      toast.success(`총 ${res.hiddenCount}개의 스팸 및 부적절한 게시글이 숨김 처리되었습니다!`)
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI 자동 청소 실패')
    } finally {
      setIsModerating(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>💬 커뮤니티 관리</h1>
          <p className={styles.pageSub}>게시글 삭제, 공지 지정, 신고 처리를 관리합니다.</p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.tabs}>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'POSTS' ? styles.activeTab : ''}`}
              onClick={() => { setActiveTab('POSTS'); setPage(0); }}
            >
              게시글 관리
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'REPORTS' ? styles.activeTab : ''}`}
              onClick={() => { setActiveTab('REPORTS'); setReportPage(0); }}
            >
              신고 관리
            </button>
          </div>
          {activeTab === 'POSTS' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="outline" onClick={handleAiModerate} disabled={isModerating} style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
                {isModerating ? '스팸 청소 중...' : '🤖 AI 스팸 자동 청소'}
              </Button>
              <Button variant="primary" onClick={() => setNoticeModalOpen(true)}>
                + 공지사항 작성
              </Button>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'POSTS' && (
        <>
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
                  <td data-label="ID">{post.id}</td>
                  <td className={styles.titleCell} data-label="제목">{post.title}</td>
                  <td data-label="조회수">{post.viewCount.toLocaleString()}</td>
                  <td data-label="공지">
                    {post.isNotice
                      ? <Badge variant="green">공지</Badge>
                      : <Badge variant="gray">일반</Badge>}
                  </td>
                  <td data-label="작성일">{formatDate(post.createdAt)}</td>
                  <td data-label="상태">
                    {post.deletedAt
                      ? <Badge variant="red">삭제됨</Badge>
                      : <Badge variant="green">활성</Badge>}
                  </td>
                  <td data-label="">
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

      {activeTab === 'POSTS' && totalPages > 1 && (
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
      </>
      )}

      {activeTab === 'REPORTS' && (
        <>
          <div className={styles.filterSection}>
            <FilterBar
              dropdowns={[
                <Dropdown
                  key="reportStatus"
                  options={[
                    { label: '전체 상태', value: 'ALL' },
                    { label: '대기중', value: 'PENDING' },
                    { label: '처리완료', value: 'RESOLVED' },
                    { label: '반려', value: 'DISMISSED' }
                  ]}
                  value={reportStatusFilter}
                  onChange={(val) => { setReportStatusFilter(val); setReportPage(0); }}
                />
              ]}
              search={<div/>}
            />
          </div>

          {loading && reports.length === 0 ? (
            <div className={styles.loadingWrap}>신고 내역 로딩 중...</div>
          ) : reports.length === 0 ? (
            <div className={styles.emptyState}>신고 내역이 없습니다.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>대상</th>
                    <th>대상ID</th>
                    <th>신고자ID</th>
                    <th>사유</th>
                    <th>신고일</th>
                    <th>상태</th>
                    <th>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(report => (
                    <tr key={report.id}>
                      <td data-label="ID">{report.id}</td>
                      <td data-label="대상">
                        {report.targetType === 'POST' ? <Badge variant="blue">게시글</Badge> : <Badge variant="gray">댓글</Badge>}
                      </td>
                      <td data-label="대상ID">{report.targetId}</td>
                      <td data-label="신고자">{report.reporterId}</td>
                      <td className={styles.titleCell} data-label="사유">{report.reason}</td>
                      <td data-label="신고일">{formatDate(report.createdAt)}</td>
                      <td data-label="상태">
                        {report.status === 'PENDING' && <Badge variant="orange">대기중</Badge>}
                        {report.status === 'RESOLVED' && <Badge variant="green">처리완료</Badge>}
                        {report.status === 'DISMISSED' && <Badge variant="gray">반려</Badge>}
                      </td>
                      <td data-label="">
                        <div className={styles.actionGroup}>
                          {report.targetType === 'POST' && (
                            <button
                              className={styles.actionBtnNotice}
                              onClick={() => handleOpenDetail(report.targetId)}
                            >
                              게시글 보기
                            </button>
                          )}
                          {report.status === 'PENDING' && (
                            <>
                              <button
                                className={styles.actionBtnNotice}
                                onClick={() => handleUpdateReportStatus(report.id, 'RESOLVED')}
                              >
                                처리 완료
                              </button>
                              <button
                                className={styles.actionBtnDanger}
                                onClick={() => handleUpdateReportStatus(report.id, 'DISMISSED')}
                              >
                                반려
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportTotalPages > 1 && (
            <div className={styles.pagination}>
              <Button 
                variant="outline" 
                disabled={reportPage === 0} 
                onClick={() => setReportPage(p => p - 1)}
              >
                이전
              </Button>
              <span className={styles.pageInfo}>{reportPage + 1} / {reportTotalPages}</span>
              <Button 
                variant="outline" 
                disabled={reportPage >= reportTotalPages - 1} 
                onClick={() => setReportPage(p => p + 1)}
              >
                다음
              </Button>
            </div>
          )}
        </>
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
