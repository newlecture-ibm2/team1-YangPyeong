import { useState, useEffect, useCallback } from 'react'
import { Button, Badge, SearchInput, Dropdown, FilterBar, useToast } from '@/components'
import { fetchAllComments, hideComment, restoreComment, deleteComment, bulkDeleteComments } from '../../_lib/community.api'
import type { AdminComment } from '../../_lib/community.types'
import ReasonModal from './ReasonModal'
import CommentDetailModal from './CommentDetailModal'
import styles from '../Community.module.css'

function formatDate(dateString: string) {
  if (!dateString) return ''
  const d = new Date(dateString)
  return d.toLocaleString()
}

export default function CommentTable() {
  const [comments, setComments] = useState<AdminComment[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [reasonModalOpen, setReasonModalOpen] = useState(false)
  const [targetCommentId, setTargetCommentId] = useState<number | null>(null)
  
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedComment, setSelectedComment] = useState<AdminComment | null>(null)
  
  const toast = useToast()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchAllComments({ keyword, status: statusFilter, page, size: 20 })
      setComments(data.comments || [])
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '댓글 목록 조회 실패')
    } finally {
      setLoading(false)
    }
  }, [keyword, statusFilter, page, toast])

  useEffect(() => { loadData() }, [loadData])

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(comments.map(c => c.id))
    else setSelectedIds([])
  }

  const handleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(x => x !== id))
    else setSelectedIds(prev => [...prev, id])
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`선택한 댓글 ${selectedIds.length}개를 완전히 삭제하시겠습니까?\n(이 작업은 취소할 수 없습니다.)`)) return
    try {
      await bulkDeleteComments(selectedIds)
      toast.success('일괄 삭제가 완료되었습니다.')
      setSelectedIds([])
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '일괄 삭제 실패')
    }
  }

  const handleRestore = async (id: number) => {
    if (!confirm('숨겨진 댓글을 복구하시겠습니까?')) return
    try {
      await restoreComment(id)
      toast.success('댓글이 복구되었습니다.')
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '댓글 복구 실패')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('이 댓글을 완전히 삭제하시겠습니까?')) return
    try {
      await deleteComment(id)
      toast.success('댓글이 삭제되었습니다.')
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '댓글 삭제 실패')
    }
  }

  const handleHideConfirm = async (reason: string) => {
    if (!targetCommentId) return
    try {
      await hideComment(targetCommentId, reason)
      toast.success('댓글이 숨김 처리되었습니다.')
      setReasonModalOpen(false)
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '댓글 숨김 처리 실패')
    }
  }

  const handleOpenDetail = (comment: AdminComment) => {
    setSelectedComment(comment)
    setDetailModalOpen(true)
  }

  return (
    <>
      <div className={styles.filterSection} style={{ marginTop: '20px' }}>
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
              placeholder="댓글 내용 검색"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={() => setPage(0)}
            />
          }
        />
      </div>
      
      {statusFilter === 'HIDDEN' && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-bg-sub)', borderBottom: '1px solid var(--color-border)', fontSize: '0.9rem', color: 'var(--color-text-sub)' }}>
          💡 숨김 처리된 댓글은 선택하여 일괄 삭제할 수 있습니다. 
          <div style={{ marginTop: '8px' }}>
            <Button variant="primary" onClick={handleBulkDelete} style={{ backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} disabled={selectedIds.length === 0}>
              선택 일괄 삭제
            </Button>
          </div>
        </div>
      )}

      {loading && comments.length === 0 ? (
        <div className={styles.loadingWrap}>댓글 로딩 중...</div>
      ) : comments.length === 0 ? (
        <div className={styles.emptyState}>검색된 댓글이 없습니다.</div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                {statusFilter === 'HIDDEN' && (
                  <th style={{ width: '40px' }}>
                    <input type="checkbox" checked={selectedIds.length > 0 && selectedIds.length === comments.length} onChange={handleSelectAll} />
                  </th>
                )}
                <th>ID</th>
                <th>원본 게시글</th>
                <th>작성자</th>
                <th>내용</th>
                <th>작성일</th>
                <th>상태</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {comments.map(comment => (
                <tr key={comment.id} className={comment.deletedAt ? styles.deletedRow : (comment.isHidden ? styles.hiddenRow : '')}>
                  {statusFilter === 'HIDDEN' && (
                    <td>
                      <input type="checkbox" checked={selectedIds.includes(comment.id)} onChange={() => handleSelectOne(comment.id)} />
                    </td>
                  )}
                  <td data-label="ID">{comment.id}</td>
                  <td data-label="원본 게시글">
                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 500, maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{comment.postTitle || '알 수 없는 게시글'}</span>
                      <span style={{ color: 'var(--color-text-tertiary)' }}>ID: {comment.postId}</span>
                    </div>
                  </td>
                  <td data-label="작성자">
                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 500 }}>{comment.authorNickname || `User ${comment.authorId}`}</span>
                      <span style={{ color: 'var(--color-text-tertiary)' }}>{comment.authorEmail || '이메일 없음'}</span>
                    </div>
                  </td>
                  <td className={styles.titleCell} data-label="내용" style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {comment.content}
                  </td>
                  <td data-label="작성일">{formatDate(comment.createdAt)}</td>
                  <td data-label="상태">
                    {comment.deletedAt
                      ? <Badge variant="red">삭제됨</Badge>
                      : comment.isHidden 
                        ? <Badge variant="orange">숨김</Badge> 
                        : <Badge variant="green">활성</Badge>}
                    {comment.statusReason && (comment.deletedAt || comment.isHidden) && (
                      <div style={{ marginTop: '4px', fontSize: '0.8rem', color: 'var(--color-text-tertiary)', wordBreak: 'keep-all' }}>
                        사유: {comment.statusReason}
                      </div>
                    )}
                  </td>
                  <td data-label="">
                    <div className={styles.actionGroup}>
                      <button className={styles.actionBtnNotice} onClick={() => handleOpenDetail(comment)}>
                        상세보기
                      </button>
                      {comment.deletedAt ? (
                        <button className={styles.actionBtnNotice} onClick={() => handleRestore(comment.id)}>
                          복구
                        </button>
                      ) : comment.isHidden ? (
                        <>
                          <button className={styles.actionBtnDanger} onClick={() => handleDelete(comment.id)}>
                            삭제
                          </button>
                          <button className={styles.actionBtnNotice} onClick={() => handleRestore(comment.id)}>
                            복구
                          </button>
                        </>
                      ) : (
                        <button className={styles.actionBtnDanger} onClick={() => {
                          setTargetCommentId(comment.id)
                          setReasonModalOpen(true)
                        }}>
                          숨김
                        </button>
                      )}
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
          <Button variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            이전
          </Button>
          <span className={styles.pageInfo}>{page + 1} / {totalPages}</span>
          <Button variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
            다음
          </Button>
        </div>
      )}

      <ReasonModal
        isOpen={reasonModalOpen}
        title="댓글 숨김 처리"
        onClose={() => setReasonModalOpen(false)}
        onConfirm={handleHideConfirm}
      />

      <CommentDetailModal
        comment={selectedComment}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onUpdate={() => loadData()}
      />
    </>
  )
}
