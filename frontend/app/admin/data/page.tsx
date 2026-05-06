'use client'

import { useState, useEffect, useCallback } from 'react'
import Badge from '@/components/common/Badge/Badge'
import { useToast } from '@/components/common/Toast'
import styles from './DataPage.module.css'
import type { ApiSyncStatus } from '../_lib/apiSync.types'
import {
  fetchApiSyncStatuses,
  toggleApiSync,
  triggerApiSync,
} from '../_lib/apiSync.api'

/** 동기화 상태별 Badge variant 매핑 */
function getStatusBadge(status: ApiSyncStatus['syncStatus']): {
  variant: 'green' | 'red' | 'blue' | 'orange'
  label: string
} {
  switch (status) {
    case 'SUCCESS': return { variant: 'green', label: '정상' }
    case 'FAILED': return { variant: 'red', label: '실패' }
    case 'RUNNING': return { variant: 'blue', label: '수집 중' }
    case 'PENDING': return { variant: 'orange', label: '대기' }
    default: return { variant: 'orange', label: status }
  }
}

/** 날짜 포맷팅 */
function formatDate(dateStr: string | null): string {
  if (!dateStr) return '수집 이력 없음'
  const date = new Date(dateStr)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}`
}

export default function DataPage() {
  const [statuses, setStatuses] = useState<ApiSyncStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<Set<number>>(new Set())
  const toast = useToast()

  const loadData = useCallback(async () => {
    try {
      const data = await fetchApiSyncStatuses()
      setStatuses(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'API 상태 조회 실패')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  /** On/Off 토글 */
  const handleToggle = async (id: number, currentActive: boolean) => {
    try {
      await toggleApiSync(id, !currentActive)
      setStatuses(prev =>
        prev.map(s => s.id === id ? { ...s, isActive: !currentActive } : s)
      )
      toast.success(!currentActive ? 'API 수집이 활성화되었습니다.' : 'API 수집이 비활성화되었습니다.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '상태 변경 실패')
    }
  }

  /** 수동 동기화 트리거 */
  const handleSync = async (id: number, displayName: string) => {
    setSyncing(prev => new Set(prev).add(id))
    try {
      await triggerApiSync(id)
      toast.success(`${displayName} 수동 수집을 시작했습니다.`)
      // 상태 갱신을 위해 잠시 후 다시 로드
      setTimeout(() => loadData(), 1500)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '동기화 트리거 실패')
    } finally {
      setSyncing(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  // 요약 통계
  const activeCount = statuses.filter(s => s.isActive).length
  const successCount = statuses.filter(s => s.syncStatus === 'SUCCESS').length
  const failedCount = statuses.filter(s => s.syncStatus === 'FAILED').length
  const inactiveCount = statuses.filter(s => !s.isActive).length

  if (loading) {
    return <div className={styles.loadingWrap}>데이터 로딩 중...</div>
  }

  return (
    <div>
      {/* 페이지 헤더 */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>🗄️ 데이터 수집 관리</h1>
        <p className={styles.pageSub}>
          외부 API(KOSIS, 기상청, KAMIS 등) 데이터 수집 상태를 관리합니다.
        </p>
      </div>

      {/* 요약 바 */}
      {statuses.length > 0 && (
        <div className={styles.summaryBar}>
          <div className={styles.summaryItem}>
            <span className={`${styles.summaryDot} ${styles.dotSuccess}`} />
            정상 {successCount}
          </div>
          <div className={styles.summaryItem}>
            <span className={`${styles.summaryDot} ${styles.dotFailed}`} />
            실패 {failedCount}
          </div>
          <div className={styles.summaryItem}>
            <span className={`${styles.summaryDot} ${styles.dotInactive}`} />
            비활성 {inactiveCount}
          </div>
          <div className={styles.summaryItem}>
            전체 {statuses.length}개 / 활성 {activeCount}개
          </div>
        </div>
      )}

      {/* API 카드 그리드 */}
      {statuses.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📡</div>
          <p className={styles.emptyText}>등록된 API 동기화 정보가 없습니다.</p>
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {statuses.map(status => {
            const badge = getStatusBadge(status.syncStatus)
            const isSyncing = syncing.has(status.id)

            return (
              <div
                key={status.id}
                className={`${styles.syncCard} ${!status.isActive ? styles.syncCardDisabled : ''}`}
              >
                {/* 카드 헤더: API명 + 토글 */}
                <div className={styles.cardHeader}>
                  <div>
                    <div className={styles.apiLabel}>{status.apiName}</div>
                    <div className={styles.apiName}>{status.displayName}</div>
                  </div>
                  <label className={styles.toggleSwitch}>
                    <input
                      type="checkbox"
                      checked={status.isActive}
                      onChange={() => handleToggle(status.id, status.isActive)}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>

                {/* 카드 본문 */}
                <div className={styles.cardBody}>
                  <div className={styles.lastSynced}>
                    {formatDate(status.lastSynced)}
                  </div>
                  <div className={styles.infoRow}>
                    <span className={styles.infoLabel}>상태</span>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                  {status.lastRecordCount !== null && (
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>수집 건수</span>
                      <span className={styles.infoValue}>{status.lastRecordCount}건</span>
                    </div>
                  )}
                </div>

                {/* 에러 메시지 */}
                {status.syncStatus === 'FAILED' && status.errorMessage && (
                  <div className={styles.errorMessage}>
                    ⚠️ {status.errorMessage}
                  </div>
                )}

                {/* 카드 푸터: 수동 수집 버튼 */}
                <div className={styles.cardFooter}>
                  <button
                    className={styles.syncBtn}
                    onClick={() => handleSync(status.id, status.displayName)}
                    disabled={isSyncing || !status.isActive}
                  >
                    {isSyncing ? '⏳ 수집 중...' : '🔄 수동 수집'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
