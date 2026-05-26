'use client'

import { useState, useEffect, useCallback } from 'react'
import Modal from '@/components/common/Modal/Modal'
import Button from '@/components/common/Button/Button'
import { useToast } from '@/components/common/Toast'
import ResponsiveTable from '@/components/common/ResponsiveTable/ResponsiveTable'
import { useModalDialog } from '@/components/common/Modal/useModalDialog'
import ModalDialog from '@/components/common/Modal/ModalDialog'
import styles from './Policy.module.css'
import type { AdminPolicyData, PolicyDataRequest } from '../_lib/policy.types'
import { fetchPolicies, createPolicy, updatePolicy, deletePolicy } from '../_lib/policy.api'
import { fetchApiSyncStatuses, triggerApiSync } from '../_lib/apiSync.api'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// parsePolicyData removed as we use explicit fields now

export default function PolicyPage() {
  const [policies, setPolicies] = useState<AdminPolicyData[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPolicy, setEditingPolicy] = useState<AdminPolicyData | null>(null)
  const [formData, setFormData] = useState<PolicyDataRequest>({ externalId: '', title: '', category: '', organization: '', regionCode: '', target: '', supportAmount: '', applyStart: '', applyEnd: '', contentSummary: '', sourceUrl: '' })
  const [parsedData, setParsedData] = useState<Record<string, any>>({})
  const [syncing, setSyncing] = useState(false)
  const [showSyncModal, setShowSyncModal] = useState(false)
  const toast = useToast()
  const { dialog, showConfirm, handleConfirm, handleClose } = useModalDialog()

  const loadData = useCallback(async () => {
    try {
      const data = await fetchPolicies()
      setPolicies(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '정책 조회 실패')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { loadData() }, [loadData])

  const openCreateModal = () => {
    setEditingPolicy(null)
    setFormData({ externalId: '', title: '', category: '', organization: '', regionCode: '', target: '', supportAmount: '', applyStart: '', applyEnd: '', contentSummary: '', sourceUrl: '' })
    setParsedData({ title: '', regionName: '', category: '', organization: '', target: '', supportAmount: '', applyStart: '', applyEnd: '', contentSummary: '', sourceUrl: '' })
    setShowModal(true)
  }

  const openEditModal = (policy: AdminPolicyData) => {
    setEditingPolicy(policy)
    setFormData({ 
      externalId: policy.externalId, 
      title: policy.title,
      category: policy.category,
      organization: policy.organization,
      regionCode: policy.regionCode,
      target: policy.target || '',
      supportAmount: policy.supportAmount || '',
      applyStart: policy.applyStart || '',
      applyEnd: policy.applyEnd || '',
      contentSummary: policy.contentSummary,
      sourceUrl: policy.sourceUrl 
    })
    setParsedData({ 
      title: policy.title || '', 
      regionName: policy.regionCode || '', 
      category: policy.category || '', 
      organization: policy.organization || '',
      target: policy.target || '',
      supportAmount: policy.supportAmount || '',
      applyStart: policy.applyStart || '',
      applyEnd: policy.applyEnd || '',
      contentSummary: policy.contentSummary || '', 
      sourceUrl: policy.sourceUrl || '' 
    })
    setShowModal(true)
  }

  const handleSubmit = async () => {
    const payload: PolicyDataRequest = { 
      externalId: formData.externalId,
      title: parsedData.title,
      category: parsedData.category,
      organization: parsedData.organization,
      regionCode: parsedData.regionName,
      target: parsedData.target,
      supportAmount: parsedData.supportAmount,
      applyStart: parsedData.applyStart || null,
      applyEnd: parsedData.applyEnd || null,
      contentSummary: parsedData.contentSummary,
      sourceUrl: parsedData.sourceUrl
    }

    if (!payload.externalId.trim()) {
      toast.error('외부 ID를 입력해주세요.')
      return
    }

    try {
      if (editingPolicy) {
        await updatePolicy(editingPolicy.id, payload)
        toast.success('정책이 수정되었습니다.')
      } else {
        await createPolicy(payload)
        toast.success('정책이 등록되었습니다.')
      }
      setShowModal(false)
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '저장 실패')
    }
  }

  const handleDelete = async (id: number) => {
    const confirmed = await showConfirm('정말로 이 정책을 삭제하시겠습니까?')
    if (!confirmed) return
    
    try {
      await deletePolicy(id)
      toast.success('정책이 삭제되었습니다.')
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '삭제 실패')
    }
  }

  const handleSyncPolicy = async (syncMode: 'MERGE' | 'FORCE') => {
    setShowSyncModal(false)
    setSyncing(true)
    try {
      const statuses = await fetchApiSyncStatuses()
      const policyStatus = statuses.find(s => s.apiName === 'POLICY_DATA')
      
      if (!policyStatus) {
        throw new Error('데이터베이스에 POLICY_DATA 동기화 설정이 없습니다.')
      }
      
      if (!policyStatus.isActive) {
        throw new Error('외부 정책 API 수집이 비활성화되어 있습니다. 관리자 데이터 탭에서 활성화해주세요.')
      }

      await triggerApiSync(policyStatus.id, syncMode)
      toast.success(`외부 정책 데이터 동기화가 성공적으로 실행되었습니다. (${syncMode} 모드)`)
      
      loadData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '동기화 실패')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) return <div className={styles.loadingWrap}>정책 데이터 로딩 중...</div>

  return (
    <div>
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>정책 관리</h1>
          <p className={styles.pageSub}>지자체 농업 지원 정책 DB를 등록/갱신합니다. 총 {policies.length}건</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button 
            variant="outline" 
            onClick={() => setShowSyncModal(true)} 
            disabled={syncing}
          >
            {syncing ? '동기화 중...' : '🔄 외부 정책 데이터 동기화'}
          </Button>
          <button className={styles.addBtn} onClick={openCreateModal}>+ 정책 등록</button>
        </div>
      </div>

      {policies.length === 0 ? (
        <div className={styles.emptyState}>등록된 정책이 없습니다.</div>
      ) : (
        <div className={styles.tableWrap}>
          <ResponsiveTable<AdminPolicyData & Record<string, unknown>>
            columns={[
              { key: 'externalId', label: '외부 ID', render: (p) => <div className={styles.externalId}>{p.externalId}</div> },
              { key: 'policyInfo', label: '정책 기본정보 (미리보기)', render: (p) => {
                const title = p.title || '제목 없음'
                const category = p.category || '기타'
                const region = p.regionName || p.regionCode || '전국'
                return (
                  <div className={styles.policyPreviewInfo}>
                    <div className={styles.policyPreviewBadges}>
                      <span className={styles.previewBadge}>{region}</span>
                      <span className={styles.previewBadge}>{category}</span>
                    </div>
                    <div className={styles.policyPreviewTitle}>{title}</div>
                  </div>
                )
              }},
              { key: 'organization', label: '지원기관', render: (p) => p.organization || '-' },
              { key: 'dates', label: '수집일 / 등록일', render: (p) => (
                <div className={styles.dateBlock}>
                  <span><small>수집:</small> {formatDate(p.fetchedAt)}</span>
                  <span><small>등록:</small> {formatDate(p.createdAt)}</span>
                </div>
              )},
              { key: 'actions', label: '액션', render: (p) => (
                <div className={styles.actionGroup}>
                  {p.sourceUrl && (
                    <button className={styles.editBtn} style={{ background: '#3b82f6', color: '#fff', border: 'none' }} onClick={() => window.open(p.sourceUrl!, '_blank')}>원문 보기</button>
                  )}
                  <button className={styles.editBtn} onClick={() => openEditModal(p)}>수정</button>
                  <button className={styles.deleteBtn} onClick={() => handleDelete(p.id)}>삭제</button>
                </div>
              )}
            ]}
            data={policies as any}
            rowKey={(p) => String(p.id)}
            emptyMessage="등록된 정책이 없습니다."
          />
        </div>
      )}

      {/* 등록/수정 모달 */}
      {showModal && (
        <Modal
          isOpen={showModal}
          title={editingPolicy ? '정책 데이터 수정' : '정책 데이터 등록'}
          onClose={() => setShowModal(false)}
        >
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>외부 정책 ID</label>
            <input
              className={styles.formInput}
              value={formData.externalId}
              onChange={e => setFormData(prev => ({ ...prev, externalId: e.target.value }))}
              placeholder="예: POLICY-YP-2026-001"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>정책명 (제목)</label>
            <input
              className={styles.formInput}
              value={parsedData.title || ''}
              onChange={e => setParsedData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="예: 양평군 친환경 농업 지원"
            />
          </div>
          <div className={styles.formRow3}>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.formLabel}>지역명</label>
              <input
                className={styles.formInput}
                value={parsedData.regionName || ''}
                onChange={e => setParsedData(prev => ({ ...prev, regionName: e.target.value }))}
                placeholder="예: 양평군"
              />
            </div>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.formLabel}>분야 (카테고리)</label>
              <input
                className={styles.formInput}
                value={parsedData.category || ''}
                onChange={e => setParsedData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="예: 금융/세제"
              />
            </div>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.formLabel}>지원기관</label>
              <input
                className={styles.formInput}
                value={parsedData.organization || ''}
                onChange={e => setParsedData(prev => ({ ...prev, organization: e.target.value }))}
                placeholder="예: 농림축산식품부"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.formLabel}>지원 대상</label>
              <input
                className={styles.formInput}
                value={parsedData.target || ''}
                onChange={e => setParsedData(prev => ({ ...prev, target: e.target.value }))}
                placeholder="예: 청년 창업농"
              />
            </div>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.formLabel}>지원 금액/규모</label>
              <input
                className={styles.formInput}
                value={parsedData.supportAmount || ''}
                onChange={e => setParsedData(prev => ({ ...prev, supportAmount: e.target.value }))}
                placeholder="예: 최대 1,000만원"
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.formLabel}>신청 시작일</label>
              <input
                type="date"
                className={styles.formInput}
                value={parsedData.applyStart || ''}
                onChange={e => setParsedData(prev => ({ ...prev, applyStart: e.target.value }))}
              />
            </div>
            <div className={styles.formGroup} style={{ flex: 1 }}>
              <label className={styles.formLabel}>신청 마감일</label>
              <input
                type="date"
                className={styles.formInput}
                value={parsedData.applyEnd || ''}
                onChange={e => setParsedData(prev => ({ ...prev, applyEnd: e.target.value }))}
              />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>주요 내용 요약</label>
            <textarea
              className={styles.formTextarea}
              style={{ minHeight: '80px' }}
              value={parsedData.contentSummary || ''}
              onChange={e => setParsedData(prev => ({ ...prev, contentSummary: e.target.value }))}
              placeholder="정책의 주요 내용을 요약해서 입력하세요."
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>상세 원문 URL</label>
            <input
              className={styles.formInput}
              value={parsedData.sourceUrl || ''}
              onChange={e => setParsedData(prev => ({ ...prev, sourceUrl: e.target.value }))}
              placeholder="예: https://www.yp21.go.kr/..."
            />
          </div>
          <div className={styles.modalFooter}>
            <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>취소</button>
            <Button variant="primary" onClick={handleSubmit}>
              {editingPolicy ? '수정' : '등록'}
            </Button>
          </div>
        </Modal>
      )}

      <ModalDialog
        {...dialog}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />

      {/* 동기화 옵션 모달 */}
      {showSyncModal && (
        <SyncOptionsModal
          onSubmit={handleSyncPolicy}
          onClose={() => setShowSyncModal(false)}
        />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════ */
/*  동기화 옵션 모달                                     */
/* ═══════════════════════════════════════════════════ */
interface SyncOptionsModalProps {
  onSubmit: (syncMode: 'MERGE' | 'FORCE') => void
  onClose: () => void
}

function SyncOptionsModal({ onSubmit, onClose }: SyncOptionsModalProps) {
  const [syncMode, setSyncMode] = useState<'MERGE' | 'FORCE'>('MERGE')

  return (
    <Modal
      isOpen={true}
      title="🔄 외부 정책 데이터 동기화 옵션"
      onClose={onClose}
    >
      <div className={styles.syncOptions}>
        <label className={styles.syncOption}>
          <input 
            type="radio" 
            name="syncMode" 
            value="MERGE" 
            checked={syncMode === 'MERGE'} 
            onChange={() => setSyncMode('MERGE')} 
          />
          <div>
            <strong className={styles.syncOptionTitle}>새로운 데이터만 추가 (기본값)</strong>
            <p className={styles.syncOptionDesc}>
              기존에 관리자가 수정한 이름이나 상태 변경 내역을 <strong>유지</strong>합니다.
            </p>
          </div>
        </label>

        <label className={styles.syncOption}>
          <input 
            type="radio" 
            name="syncMode" 
            value="FORCE" 
            checked={syncMode === 'FORCE'} 
            onChange={() => setSyncMode('FORCE')} 
          />
          <div>
            <strong className={styles.syncOptionTitle}>API 원본 데이터로 전체 덮어쓰기</strong>
            <p className={styles.syncOptionDesc}>
              수동 변경사항을 무시하고 API가 제공하는 원본 데이터로 <strong>강제 덮어쓰기</strong>합니다. (수동 추가 정책은 제외)
            </p>
          </div>
        </label>
      </div>

      <div className={styles.modalFooter}>
        <button className={styles.cancelBtn} onClick={onClose}>취소</button>
        <Button variant="primary" onClick={() => onSubmit(syncMode)}>동기화 시작</Button>
      </div>
    </Modal>
  )
}
