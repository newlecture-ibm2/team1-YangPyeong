'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/common/Toast'
import Badge from '@/components/common/Badge/Badge'
import styles from './Dashboard.module.css'
import type { AdminDashboard } from './_lib/dashboard.types'
import { fetchDashboard } from './_lib/dashboard.api'
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'

/** KPI 항목 정의 */
const KPI_ITEMS: { key: keyof AdminDashboard; label: string; icon: string; warning?: boolean; suffix?: string }[] = [
  { key: 'pendingFarmApprovals', label: '농장 승인 대기', icon: '⏳', warning: true },
  { key: 'pendingReports', label: '미처리 신고', icon: '🚨', warning: true },
  { key: 'activeUsers', label: '활성 유저', icon: '👥' },
  { key: 'weeklyNewOrders', label: '금주 신규 주문', icon: '🛒' }
]

function renderBalanceBadge(status: string) {
  switch (status) {
    case 'EXCESS_WARN': return <Badge variant="red">과잉 경고</Badge>
    case 'EXCESS_CAUTION': return <Badge variant="orange">과잉 주의</Badge>
    case 'BALANCED': return <Badge variant="green">수급 적정</Badge>
    case 'SHORT_CAUTION': return <Badge variant="orange">부족 주의</Badge>
    case 'SHORT_WARN': return <Badge variant="red">부족 경고</Badge>
    default: return <Badge variant="gray">알 수 없음</Badge>
  }
}

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
  if (!dashboard) return <div className={styles.emptyState}>데이터를 불러오지 못했습니다.</div>

  // Recharts 데이터 매핑
  const balancePieData = [
    { name: '적정', value: dashboard.balanceStatusDistribution['BALANCED'] || 0, fill: '#10b981' },
    { name: '과잉 주의', value: dashboard.balanceStatusDistribution['EXCESS_CAUTION'] || 0, fill: '#f59e0b' },
    { name: '부족 주의', value: dashboard.balanceStatusDistribution['SHORT_CAUTION'] || 0, fill: '#f59e0b' },
    { name: '과잉 경고', value: dashboard.balanceStatusDistribution['EXCESS_WARN'] || 0, fill: '#ef4444' },
    { name: '부족 경고', value: dashboard.balanceStatusDistribution['SHORT_WARN'] || 0, fill: '#ef4444' }
  ].filter(d => d.value > 0);

  const areaData = dashboard.topCropsByArea.map(c => ({
    name: c.cropName,
    '재배 면적(㎡)': c.totalArea
  })).reverse(); // 가로 바차트 상단에 1위 배치 위해 reverse

  const salesData = dashboard.topSeedsBySales.map(s => ({
    name: s.seedName,
    '판매 건수': s.salesCount
  })).reverse();

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>대시보드</h1>
        <p className={styles.pageSub}>FarmBalance 시스템 전체 현황을 한눈에 확인합니다.</p>
      </div>

      {/* KPI 카드 그리드 */}
      <div className={styles.kpiGrid}>
        {KPI_ITEMS.map(item => {
          const val = dashboard[item.key] as number
          return (
            <div key={item.key} className={`${styles.kpiCard} ${item.warning && val > 0 ? styles.kpiCardWarning : ''}`}>
              <p className={styles.kpiLabel}>{item.icon} {item.label}</p>
              <p className={`${styles.kpiValue} ${item.warning && val > 0 ? styles.kpiValueWarning : ''}`}>
                {val.toLocaleString()} {item.suffix}
              </p>
            </div>
          )
        })}
      </div>

      <div className={styles.chartGrid}>
        {/* 양평군 수급 적정성 분포 (도넛 차트) */}
        <div className={styles.chartCard}>
          <div className={styles.chartCardLabel}>양평군 수급 적정성 분포</div>
          <div style={{ width: '100%', height: 280 }}>
            {balancePieData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={balancePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {balancePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${value}개 작물`, '']} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : <div className={styles.emptyState}>데이터 없음</div>}
          </div>
        </div>

        {/* 위험 작물 리스트 (기존 유지, 텍스트 형태가 더 직관적) */}
        <div className={styles.chartCard}>
          <div className={styles.chartCardLabel}>수급 위험 작물 리스트</div>
          <div className={styles.riskList}>
            <div className={styles.riskColumn}>
              <h4 className={styles.riskTitle}>과잉 위험 Top 3</h4>
              {dashboard.excessRiskCrops.length > 0 ? dashboard.excessRiskCrops.map(crop => (
                <div key={crop.cropName} className={styles.riskItem}>
                  <span>{crop.cropName}</span>
                  <div>
                    <span className={styles.ratioText}>{crop.ratio.toFixed(1)}%</span>
                    {renderBalanceBadge(crop.status)}
                  </div>
                </div>
              )) : <div className={styles.emptyRisk}>위험 작물 없음</div>}
            </div>
            <div className={styles.riskColumn}>
              <h4 className={styles.riskTitle}>부족 위험 Top 3</h4>
              {dashboard.shortageRiskCrops.length > 0 ? dashboard.shortageRiskCrops.map(crop => (
                <div key={crop.cropName} className={styles.riskItem}>
                  <span>{crop.cropName}</span>
                  <div>
                    <span className={styles.ratioText}>{crop.ratio.toFixed(1)}%</span>
                    {renderBalanceBadge(crop.status)}
                  </div>
                </div>
              )) : <div className={styles.emptyRisk}>위험 작물 없음</div>}
            </div>
          </div>
        </div>

        {/* 지역 내 재배 면적 TOP 5 작물 (가로 막대 차트) */}
        <div className={styles.chartCard}>
          <div className={styles.chartCardLabel}>지역 내 재배 면적 TOP 5 (㎡)</div>
          <div style={{ width: '100%', height: 300 }}>
            {areaData.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={areaData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 13 }} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="재배 면적(㎡)" fill="#2d6a4f" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className={styles.emptyState}>데이터 없음</div>}
          </div>
        </div>

        {/* 인기 판매 종자 TOP 5 (가로 막대 차트) */}
        <div className={styles.chartCard}>
          <div className={styles.chartCardLabel}>인기 판매 종자 TOP 5</div>
          <div style={{ width: '100%', height: 300 }}>
            {salesData.length > 0 ? (
              <ResponsiveContainer>
                <BarChart data={salesData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 13 }} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="판매 건수" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className={styles.emptyState}>데이터 없음</div>}
          </div>
        </div>

      </div>
    </div>
  )
}
