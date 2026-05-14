'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Button from '@/components/common/Button/Button'
import Badge from '@/components/common/Badge/Badge'
import Modal from '@/components/common/Modal/Modal'
import ModalDialog from '@/components/common/Modal/ModalDialog'
import { useModalDialog } from '@/components/common/Modal/useModalDialog'
import { useToast } from '@/components/common/Toast'
import styles from './Farms.module.css'
import type { FarmApprovalView, ApprovalStatus } from '../_lib/farmApproval.types'
import { APPROVAL_STATUS_LABELS } from '../_lib/farmApproval.types'
import { fetchApprovals, approveFarm, rejectFarm, deleteFarm } from '../_lib/farmApproval.api'

type Tab = 'PENDING' | 'APPROVED' | 'REJECTED'

export default function FarmsPage() {
  const [tab, setTab] = useState<Tab>('PENDING')
  const [approvals, setApprovals] = useState<FarmApprovalView[]>([])
  const [loading, setLoading] = useState(true)

  // 반려 사유 모달 상태
  const [rejectTarget, setRejectTarget] = useState<FarmApprovalView | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const { dialog, showConfirm, handleConfirm, handleClose } = useModalDialog()

  const toast = useToast()
  const toastRef = useRef(toast)
  toastRef.current = toast

  // 데이터 로드
  const loadApprovals = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchApprovals(tab)
      setApprovals(data)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '승인 목록을 불러오지 못했습니다.'
      toastRef.current.error(msg)
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => {
    loadApprovals()
  }, [loadApprovals])

  // 승인 처리
  const handleApprove = async (item: FarmApprovalView) => {
    const confirmed = await showConfirm(`"${item.farmName}" 농장을 승인하시겠습니까?\n${item.userName}님의 역할이 농부로 변경됩니다.`)
    if (!confirmed) return
    try {
      await approveFarm(item.farmId)
      toast.success(`${item.farmName} 농장이 승인되었습니다.`)
      await loadApprovals()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '승인 처리에 실패했습니다.'
      toast.error(msg)
    }
  }

  // 반려 모달 열기
  const openRejectModal = (item: FarmApprovalView) => {
    setRejectTarget(item)
    setRejectReason('')
  }

  // 반려 처리
  const handleRejectConfirm = async () => {
    if (!rejectTarget) return
    if (!rejectReason.trim()) {
      toast.error('반려 사유를 입력해주세요.')
      return
    }

    setRejecting(true)
    try {
      await rejectFarm(rejectTarget.farmId, rejectReason.trim())
      toast.success(`${rejectTarget.farmName} 농장이 반려되었습니다.`)
      setRejectTarget(null)
      setRejectReason('')
      await loadApprovals()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '반려 처리에 실패했습니다.'
      toast.error(msg)
    } finally {
      setRejecting(false)
    }
  }

  // 삭제 처리
  const handleDelete = async (farmId: number) => {
    const confirmed = await showConfirm('정말로 이 농장을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')
    if (!confirmed) return
    try {
      await deleteFarm(farmId)
      toast.success('농장이 삭제되었습니다.')
      await loadApprovals()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '삭제 처리에 실패했습니다.'
      toast.error(msg)
    }
  }

  const tabs: Tab[] = ['PENDING', 'APPROVED', 'REJECTED']

  // 탭 라벨 (대기중 건수 표시)
  const getTabLabel = (t: Tab): string => {
    if (t === 'PENDING' && tab === 'PENDING' && approvals.length > 0) {
      return `${APPROVAL_STATUS_LABELS[t]} (${approvals.length})`
    }
    return APPROVAL_STATUS_LABELS[t]
  }

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <h1 className={styles.title}>🌾 농장 관리</h1>
        {tab === 'PENDING' && approvals.length > 0 && (
          <Badge variant="red">{approvals.length}건 대기</Badge>
        )}
      </div>
      <p className={styles.subtitle}>농장 등록 신청을 검토하고 승인 또는 반려합니다.</p>

      {/* 탭 (pill 스타일) */}
      <div className={styles.tabs}>
        {tabs.map((t) => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
            onClick={() => setTab(t)}
          >
            {getTabLabel(t)}
          </button>
        ))}
      </div>

      {/* 로딩 */}
      {loading ? (
        <div className={styles.loading}>데이터를 불러오는 중...</div>
      ) : approvals.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          {tab === 'PENDING'
            ? '승인 대기 중인 신청이 없습니다.'
            : `${APPROVAL_STATUS_LABELS[tab]} 내역이 없습니다.`}
        </div>
      ) : (
        /* 카드 목록 */
        <div className={styles.cardList}>
          {approvals.map((item) => (
            <div key={item.farmId} className={styles.approvalCard}>
              {/* 카드 헤더 */}
              <div className={styles.cardHeader}>
                <span className={styles.farmName}>
                  {item.userName} — {item.farmName}
                </span>
                <span className={styles.applyDate}>
                  신청일: {new Date(item.createdAt).toLocaleDateString('ko-KR')}
                </span>
              </div>

              {/* 정보 그리드 */}
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>이름</span>
                  <span className={styles.infoValue}>{item.userName}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>이메일</span>
                  <span className={styles.infoValue}>{item.userEmail}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>주소</span>
                  <span className={styles.infoValue}>{item.address}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>면적</span>
                  <span className={styles.infoValue}>{item.areaSize?.toLocaleString()}㎡</span>
                </div>
                {item.businessNumber && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>사업자</span>
                    <span className={styles.infoValue}>{item.businessNumber}</span>
                  </div>
                )}
                {item.landCertImageUrl && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>증명서</span>
                    <a
                      href={item.landCertImageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.certLink}
                    >
                      토지증명서 보기
                    </a>
                  </div>
                )}
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>상태</span>
                  <Badge variant={item.status === 'APPROVED' ? 'green' : item.status === 'REJECTED' ? 'red' : 'orange'}>
                    {APPROVAL_STATUS_LABELS[item.status as ApprovalStatus]}
                  </Badge>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className={styles.cardActions} style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                {item.status === 'PENDING' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => openRejectModal(item)}>
                      반려
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => handleApprove(item)}>
                      승인
                    </Button>
                  </>
                )}
                <Button variant="outline" size="sm" onClick={() => handleDelete(item.farmId)} style={{ borderColor: '#ef4444', color: '#ef4444' }}>
                  삭제
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 반려 사유 입력 모달 */}
      {rejectTarget && (
        <Modal
          isOpen={true}
          onClose={() => setRejectTarget(null)}
          title="농장 반려"
        >
          <div className={styles.rejectModal}>
            <p className={styles.rejectModalDesc}>
              <strong>{rejectTarget.farmName}</strong> 농장을 반려합니다.
              <br />반려 사유를 입력해주세요.
            </p>
            <textarea
              className={styles.rejectTextarea}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="반려 사유를 입력해주세요."
              rows={4}
              maxLength={500}
            />
            <div className={styles.rejectModalActions}>
              <Button variant="outline" size="sm" onClick={() => setRejectTarget(null)}>
                취소
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRejectConfirm}
                disabled={rejecting || !rejectReason.trim()}
              >
                {rejecting ? '처리 중...' : '반려 확인'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      <ModalDialog
        {...dialog}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    </div>
  )
}
