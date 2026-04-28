'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Button from '@/components/common/Button/Button'
import Badge from '@/components/common/Badge/Badge'
import { useToast } from '@/components/common/Toast'
import styles from './Approvals.module.css'
import type { FarmApprovalView, ApprovalStatus } from '../_lib/approval.types'
import { APPROVAL_STATUS_LABELS } from '../_lib/approval.types'
import { fetchApprovals, approveFarm, rejectFarm } from '../_lib/approval.api'

type Tab = 'PENDING' | 'APPROVED' | 'REJECTED'

export default function ApprovalsPage() {
  const [tab, setTab] = useState<Tab>('PENDING')
  const [approvals, setApprovals] = useState<FarmApprovalView[]>([])
  const [loading, setLoading] = useState(true)

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
    if (!window.confirm(`"${item.farmName}" 농장을 승인하시겠습니까?\n${item.userName}님의 역할이 농부로 변경됩니다.`)) return
    try {
      await approveFarm(item.farmId)
      toast.success(`${item.farmName} 농장이 승인되었습니다.`)
      await loadApprovals()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '승인 처리에 실패했습니다.'
      toast.error(msg)
    }
  }

  // 반려 처리
  const handleReject = async (item: FarmApprovalView) => {
    if (!window.confirm(`"${item.farmName}" 농장을 반려하시겠습니까?`)) return
    try {
      await rejectFarm(item.farmId)
      toast.success(`${item.farmName} 농장이 반려되었습니다.`)
      await loadApprovals()
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '반려 처리에 실패했습니다.'
      toast.error(msg)
    }
  }

  // 탭별 배지 variant
  const getStatusBadgeVariant = (status: ApprovalStatus): 'orange' | 'green' | 'red' => {
    switch (status) {
      case 'PENDING': return 'orange'
      case 'APPROVED': return 'green'
      case 'REJECTED': return 'red'
    }
  }

  const tabs: Tab[] = ['PENDING', 'APPROVED', 'REJECTED']

  return (
    <div className={styles.container}>
      {/* 헤더 */}
      <div className={styles.header}>
        <h1 className={styles.title}>✅ 농부 승인/반려</h1>
        {tab === 'PENDING' && approvals.length > 0 && (
          <Badge variant="red">{approvals.length}건 대기</Badge>
        )}
      </div>

      {/* 탭 */}
      <div className={styles.tabs}>
        {tabs.map((t) => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
            onClick={() => setTab(t)}
          >
            {APPROVAL_STATUS_LABELS[t]}
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
                  <Badge variant={getStatusBadgeVariant(item.status)}>
                    {APPROVAL_STATUS_LABELS[item.status]}
                  </Badge>
                </div>
              </div>

              {/* 액션 버튼 (PENDING만 표시) */}
              {item.status === 'PENDING' && (
                <div className={styles.cardActions}>
                  <Button variant="outline" size="sm" onClick={() => handleReject(item)}>
                    반려
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => handleApprove(item)}>
                    ✅ 승인
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
