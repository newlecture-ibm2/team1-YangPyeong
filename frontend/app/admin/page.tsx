'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/common/Toast'
import styles from './Dashboard.module.css'
import type { AdminDashboard } from './_lib/dashboard.types'
import { fetchDashboard } from './_lib/dashboard.api'

/** KPI 항목 정의 */
const KPI_ITEMS: { key: keyof AdminDashboard; label: string; icon: string; warning?: boolean }[] = [
  { key: 'pendingApprovals', label: '가입 승인 대기', icon: '⏳', warning: true },
  { key: 'todayRegistrations', label: '오늘 등록 건수', icon: '📝' },
  { key: 'totalUsers', label: '전체 사용자', icon: '👥' },
  { key: 'totalFarmers', label: '농부 회원', icon: '🧑‍🌾' },
  { key: 'totalFarms', label: '등록 농장', icon: '🏡' },
  { key: 'totalCrops', label: '활성 작물', icon: '🌾' },
  { key: 'totalPosts', label: '게시글', icon: '💬' },
  { key: 'totalProducts', label: '상점 상품', icon: '🛒' },
  { key: 'totalOrders', label: '총 주문', icon: '📦' },
]

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  const loadData = useCallback(async () => {
    try {
      const data = await fetchDashboard()
      setDashboard(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '대시보드 조회 실패')
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { loadData() }, [loadData])

  if (loading) return <div className={styles.loadingWrap}>대시보드 로딩 중...</div>

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>⚙️ 관리자 <em>대시보드</em></h1>
        <p className={styles.pageSub}>FarmBalance 시스템 전체 현황을 한눈에 확인합니다.</p>
      </div>

      {/* KPI 카드 그리드 */}
      <div className={styles.kpiGrid}>
        {KPI_ITEMS.map(item => (
          <div key={item.key} className={`${styles.kpiCard} ${item.warning ? styles.kpiCardWarning : ''}`}>
            <p className={styles.kpiLabel}>{item.icon} {item.label}</p>
            <p className={`${styles.kpiValue} ${item.warning && dashboard && dashboard[item.key] > 0 ? styles.kpiValueWarning : ''}`}>
              {dashboard ? dashboard[item.key].toLocaleString() : '-'}
            </p>
          </div>
        ))}
      </div>

      {/* 차트 영역 (추후 구현) */}
      <div className={styles.chartGrid}>
        <div className={styles.chartCard}>
          <div className={styles.chartCardLabel}>일별 가입 추이</div>
          <div className={styles.chartPlaceholder}>📈 라인 차트 영역 (추후 구현)</div>
        </div>
        <div className={styles.chartCard}>
          <div className={styles.chartCardLabel}>작물별 선호도</div>
          <div className={styles.chartPlaceholder}>🥧 파이 차트 영역 (추후 구현)</div>
        </div>
      </div>
    </div>
  )
}
