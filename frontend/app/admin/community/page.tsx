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
import type { AdminPost, AdminGroupedReport } from '../_lib/community.types'
import { fetchPosts, deletePost, toggleNotice, createNotice, fetchReports, updateReportStatus, aiModeratePosts } from '../_lib/community.api'
import NoticeCreateModal from './_components/NoticeCreateModal'
import PostDetailModal from './_components/PostDetailModal'
import SanctionModal from './_components/SanctionModal'
import ReasonModal from './_components/ReasonModal'
import CommentTable from './_components/CommentTable'
import Button from '@/components/common/Button/Button'
import ResponsiveTable from '@/components/common/ResponsiveTable/ResponsiveTable'
import Pagination from '@/components/common/Pagination'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<'POSTS' | 'COMMENTS' | 'REPORTS'>('POSTS')

  // Posts State
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Reports State
  const [reports, setReports] = useState<AdminGroupedReport[]>([])
  const [reportTotalElements, setReportTotalElements] = useState(0)
  const [reportTotalPages, setReportTotalPages] = useState(0)
  const [reportStatusFilter, setReportStatusFilter] = useState('PENDING')
  const [reportPage, setReportPage] = useState(0)

  const pageSize = 20

  const [loading, setLoading] = useState(true)
  const toast = useToast()
  const { dialog, showConfirm, handleConfirm, handleClose } = useModalDialog()
  const [noticeModalOpen, setNoticeModalOpen] = useState(false)
  
  const [postDetailModalOpen, setPostDetailModalOpen] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null)
  const [isModerating, setIsModerating] = useState(false)

  const [sanctionModalOpen, setSanctionModalOpen] = useState(false)
  const [selectedTarget, setSelectedTarget] = useState<{ type: string, id: number } | null>(null)

  const [reasonModalOpen, setReasonModalOpen] = useState(false)
  const [targetForReason, setTargetForReason] = useState<{ type: 'POST' | 'COMMENT', id: number } | null>(null)
  
  const [selectedPostIds, setSelectedPostIds] = useState<number[]>([])

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedPostIds(posts.map(p => p.id))
    } else {
      setSelectedPostIds([])
    }
  }

  const handleSelectOne = (id: number) => {
    if (selectedPostIds.includes(id)) {
      setSelectedPostIds(prev => prev.filter(v => v !== id))
    } else {
      setSelectedPostIds(prev => [...prev, id])
    }
  }

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

  useEffect(() => { 
    setSelectedPostIds([])
    loadData() 
  }, [loadData])

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

  const handleRestorePost = async (postId: number) => {
    const confirmed = await showConfirm('게시글을 복구하시겠습니까?')
    if (!confirmed) return
    try {
      const { restorePost } = await import('../_lib/community.api')
      await restorePost(postId)
      toast.success('게시글이 복구되었습니다.')
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '게시글 복구 실패')
    }
  }

  const handleBulkDelete = async () => {
    if (selectedPostIds.length === 0) {
      toast.error('삭제할 게시글을 선택해주세요.')
      return
    }
    const confirmed = await showConfirm(`선택한 ${selectedPostIds.length}개의 숨김 처리된 게시글을 완전히 삭제하시겠습니까?`)
    if (!confirmed) return
    try {
      const { bulkDeletePosts } = await import('../_lib/community.api')
      await bulkDeletePosts(selectedPostIds)
      toast.success('일괄 삭제가 완료되었습니다.')
      setSelectedPostIds([])
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '일괄 삭제 실패')
    }
  }

  const handleHideConfirm = async (reason: string) => {
    if (!targetForReason) return
    try {
      const { hidePost } = await import('../_lib/community.api')
      if (targetForReason.type === 'POST') {
        await hidePost(targetForReason.id, reason)
        toast.success('게시글이 숨김 처리되었습니다.')
      }
      setReasonModalOpen(false)
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '숨김 처리 실패')
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

  const handleUpdateReportStatus = async (targetType: string, targetId: number, newStatus: string) => {
    try {
      await updateReportStatus(targetType, targetId, newStatus)
      toast.success('신고 상태가 일괄 변경되었습니다.')
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '신고 상태 변경 실패')
    }
  }

  const handleOpenSanctionModal = (targetType: string, targetId: number) => {
    setSelectedTarget({ type: targetType, id: targetId })
    setSanctionModalOpen(true)
  }

  const handleSanctionConfirm = async (data: { hideContent: boolean; deleteContent: boolean; suspendUser: boolean }) => {
    if (!selectedTarget) return
    try {
      const { sanctionReport } = await import('../_lib/community.api')
      await sanctionReport(selectedTarget.type, selectedTarget.id, data)
      toast.success('제재 처리가 일괄 완료되었습니다.')
      setSanctionModalOpen(false)
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '제재 처리 실패')
    }
  }

  const handleUndoSanction = async (targetType: string, targetId: number) => {
    if (!confirm('제재를 복구(취소)하시겠습니까? 게시물 복구 및 유저 정지가 해제됩니다.')) return
    try {
      const { undoSanctionReport } = await import('../_lib/community.api')
      await undoSanctionReport(targetType, targetId)
      toast.success('제재가 복구되었습니다.')
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '제재 복구 실패')
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
              className={`${styles.tabBtn} ${activeTab === 'COMMENTS' ? styles.activeTab : ''}`}
              onClick={() => { setActiveTab('COMMENTS') }}
            >
              댓글 관리
            </button>
            <button 
              className={`${styles.tabBtn} ${activeTab === 'REPORTS' ? styles.activeTab : ''}`}
              onClick={() => { setActiveTab('REPORTS'); setReportPage(0); }}
            >
              신고 관리
            </button>
          </div>
          {(activeTab === 'POSTS' || activeTab === 'COMMENTS') && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="outline" onClick={handleAiModerate} disabled={isModerating} style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
                {isModerating ? '스팸 청소 중...' : '🤖 AI 스팸 자동 청소'}
              </Button>
              {activeTab === 'POSTS' && (
                <Button variant="primary" onClick={() => setNoticeModalOpen(true)}>
                  + 공지사항 작성
                </Button>
              )}
              {activeTab === 'POSTS' && statusFilter === 'HIDDEN' && (
                <Button variant="primary" onClick={handleBulkDelete} style={{ backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
                  선택 일괄 삭제
                </Button>
              )}
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
                { label: '숨김(격리)', value: 'HIDDEN' },
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

      {activeTab === 'POSTS' && statusFilter === 'HIDDEN' && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-bg-sub)', borderBottom: '1px solid var(--color-border)', fontSize: '0.9rem', color: 'var(--color-text-sub)' }}>
          💡 숨김 처리된 게시물 및 댓글은 30일 후에 자동 삭제됩니다.
        </div>
      )}

      {loading && posts.length === 0 ? (
        <div className={styles.loadingWrap}>게시글 로딩 중...</div>
      ) : (
        <div className={styles.tableWrap}>
          <ResponsiveTable<AdminPost & Record<string, unknown>>
            columns={[
              ...(statusFilter === 'HIDDEN' ? [{
                key: 'select',
                label: '선택',
                render: (post: AdminPost) => <input type="checkbox" checked={selectedPostIds.includes(post.id)} onChange={() => handleSelectOne(post.id)} />
              }] : []),
              { key: 'id', label: 'ID', render: (post) => post.id },
              {
                key: 'title',
                label: '제목',
                render: (post) => (
                  <div className={styles.titleCell}>
                    {post.title} {post.commentCount > 0 && <span style={{ color: 'var(--color-primary-600)', fontWeight: 600, marginLeft: '4px' }}>[{post.commentCount}]</span>}
                  </div>
                )
              },
              {
                key: 'author',
                label: '작성자',
                render: (post) => (
                  <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 500 }}>{post.authorNickname || `User ${post.authorId}`}</span>
                    <span style={{ color: 'var(--color-text-tertiary)' }}>{post.authorEmail || '이메일 없음'}</span>
                  </div>
                )
              },
              { key: 'viewCount', label: '조회수', align: 'right', render: (post) => post.viewCount.toLocaleString() },
              {
                key: 'isNotice',
                label: '공지',
                align: 'center',
                render: (post) => post.isNotice ? <Badge variant="green">공지</Badge> : <Badge variant="gray">일반</Badge>
              },
              { key: 'createdAt', label: '작성일', render: (post) => formatDate(post.createdAt) },
              {
                key: 'status',
                label: '상태',
                render: (post) => (
                  <div>
                    {post.deletedAt
                      ? <Badge variant="red">삭제됨</Badge>
                      : post.isHidden 
                        ? <Badge variant="orange">숨김</Badge> 
                        : <Badge variant="green">활성</Badge>}
                    {post.statusReason && (post.deletedAt || post.isHidden) && (
                      <div style={{ marginTop: '4px', fontSize: '0.8rem', color: 'var(--color-text-tertiary)', wordBreak: 'keep-all' }}>
                        사유: {post.statusReason}
                      </div>
                    )}
                  </div>
                )
              },
              {
                key: 'actions',
                label: '액션',
                align: 'center',
                render: (post) => (
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
                    {post.deletedAt ? (
                      <button
                        className={styles.actionBtnNotice}
                        onClick={() => handleRestorePost(post.id)}
                      >
                        복구
                      </button>
                    ) : post.isHidden ? (
                      <>
                        <button
                          className={styles.actionBtnDanger}
                          onClick={() => handleDelete(post.id)}
                        >
                          삭제
                        </button>
                        <button
                          className={styles.actionBtnNotice}
                          onClick={() => handleRestorePost(post.id)}
                        >
                          복구
                        </button>
                      </>
                    ) : (
                      <button
                        className={styles.actionBtnDanger}
                        onClick={() => {
                          setTargetForReason({ type: 'POST', id: post.id })
                          setReasonModalOpen(true)
                        }}
                      >
                        숨김
                      </button>
                    )}
                  </div>
                )
              }
            ]}
            data={posts as any}
            rowKey={(post) => String(post.id)}
            emptyMessage="등록된 게시글이 없습니다."
          />
        </div>
      )}

      {activeTab === 'POSTS' && totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
      </>
      )}

      {activeTab === 'COMMENTS' && (
        <CommentTable />
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
          ) : (
            <div className={styles.tableWrap}>
              <ResponsiveTable<AdminGroupedReport & Record<string, unknown>>
                columns={[
                  {
                    key: 'targetType',
                    label: '대상',
                    render: (report) => report.targetType === 'POST' ? <Badge variant="blue">게시글</Badge> : <Badge variant="gray">댓글</Badge>
                  },
                  { key: 'targetId', label: '대상ID', render: (report) => report.targetId },
                  { key: 'reportCount', label: '누적 신고 수', render: (report) => `${report.reportCount}건` },
                  {
                    key: 'reason',
                    label: '사유 요약',
                    render: (report) => (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span>{report.recentReason}</span>
                        {report.reportCount > 1 && (
                          <span onClick={() => showConfirm(report.allReasons?.replace(/\|\|/g, '\n') || '')} style={{ cursor: 'pointer', display: 'inline-block', width: 'fit-content' }}>
                            <Badge variant="gray">[외 {report.reportCount - 1}건] 전체보기</Badge>
                          </span>
                        )}
                      </div>
                    )
                  },
                  { key: 'recentReportAt', label: '최근 신고일', render: (report) => formatDate(report.recentReportAt) },
                  {
                    key: 'status',
                    label: '상태 및 제재',
                    render: (report) => (
                      <div>
                        {report.status === 'PENDING' && <Badge variant="orange">대기중</Badge>}
                        {report.status === 'DISMISSED' && <Badge variant="gray">반려</Badge>}
                        {report.status === 'RESOLVED' && (
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {report.actionTaken ? report.actionTaken.split(', ').map((act, i) => (
                              <Badge key={i} variant="dark">{act}</Badge>
                            )) : <Badge variant="green">처리완료</Badge>}
                          </div>
                        )}
                      </div>
                    )
                  },
                  {
                    key: 'actions',
                    label: '액션',
                    align: 'center',
                    render: (report) => (
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
                              onClick={() => handleOpenSanctionModal(report.targetType, report.targetId)}
                              style={{ backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)', color: 'white' }}
                            >
                              🚨 제재 처리
                            </button>
                            <button
                              className={styles.actionBtnDanger}
                              onClick={() => handleUpdateReportStatus(report.targetType, report.targetId, 'DISMISSED')}
                            >
                              반려
                            </button>
                          </>
                        )}
                        {report.status === 'RESOLVED' && (
                          <button
                            className={styles.actionBtnNotice}
                            onClick={() => handleUndoSanction(report.targetType, report.targetId)}
                          >
                            제재 복구
                          </button>
                        )}
                      </div>
                    )
                  }
                ]}
                data={reports as any}
                rowKey={(report) => `${report.targetType}-${report.targetId}`}
                emptyMessage="신고 내역이 없습니다."
              />
            </div>
          )}

          {reportTotalPages > 1 && (
            <Pagination
              currentPage={reportPage}
              totalPages={reportTotalPages}
              onPageChange={setReportPage}
            />
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

      <SanctionModal
        isOpen={sanctionModalOpen}
        onClose={() => setSanctionModalOpen(false)}
        onConfirm={handleSanctionConfirm}
      />

      <ReasonModal
        isOpen={reasonModalOpen}
        title="게시물 숨김 처리"
        onClose={() => setReasonModalOpen(false)}
        onConfirm={handleHideConfirm}
      />
    </div>
  )
}
