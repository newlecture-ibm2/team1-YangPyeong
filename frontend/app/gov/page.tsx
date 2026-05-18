'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import styles from './gov.module.css';
import { useGovUser, getTestHeaders } from './useGovUser';
import GovTabs from './_components/GovTabs';
import GovAiPanel from './_components/GovAiPanel/GovAiPanel';
import Modal from '@/components/common/Modal';
import Spinner from '@/components/common/Spinner/Spinner';
import Button from '@/components/common/Button/Button';

interface DashboardData {
  summary: { totalFarms: number; totalCrops: number; surplusCount: number; shortageCount: number };
  warningItems: { cropName: string; supplyRate: number; status: string; level: string; advice: string }[];
  monthlySupply: { label: string; supply: number; demand: number }[];
  regionDistribution: { region: string; count: number }[];
}

export default function GovDashboardPage() {
  const { user, loading: userLoading } = useGovUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);

  useEffect(() => {
    fetch('/api/gov/dashboard', { headers: getTestHeaders() })
      .then(r => r.json())
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (userLoading || loading) return <div className={styles.page}><Spinner /></div>;
  if (!user || user.role !== 'GOV') return <div className={styles.page}><p>지자체 관리자만 접근할 수 있습니다.</p></div>;
  if (!data) return <div className={styles.page}><p>데이터를 불러올 수 없습니다.</p></div>;

  const { summary, warningItems, monthlySupply, regionDistribution } = data;
  const region = user.regionName || '지자체';

  const topWarningItems = [...warningItems]
    .sort((a, b) => {
      const levelScore = { '긴급': 3, '주의': 2, '관심': 1 };
      const scoreA = levelScore[a.level as keyof typeof levelScore] || 0;
      const scoreB = levelScore[b.level as keyof typeof levelScore] || 0;
      return scoreB - scoreA;
    })
    .slice(0, 5);

  return (
    <div className={styles.page}>
      <div className={styles.headerWrapper}>
        <div className={styles.pageHeader}>
          <p className={styles.breadcrumb}>지자체 / 대시보드</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h1 className={styles.pageTitle}>{region} <em>대시보드</em></h1>
          </div>
          <div className={styles.tabsWrapper}>
            <GovTabs />
          </div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* 좌측/중앙 주요 데이터 영역 */}
        <div className={styles.dashboardContent}>
          {/* KPI */}
      <div className={styles.kpiRow}>
        <div className={styles.kpi}><p className={styles.kpiLabel}>등록 농가</p><p className={styles.kpiValue}>{summary.totalFarms.toLocaleString()}</p></div>
        <div className={styles.kpi}><p className={styles.kpiLabel}>관리 작물</p><p className={styles.kpiValue}>{summary.totalCrops}종</p></div>
        <div className={styles.kpi}><p className={styles.kpiLabel}>과잉 품목</p><p className={`${styles.kpiValue} ${styles.kpiValueDanger}`}>{summary.surplusCount}</p></div>
        <div className={styles.kpi}><p className={styles.kpiLabel}>부족 품목</p><p className={`${styles.kpiValue} ${styles.kpiValueDanger}`}>{summary.shortageCount}</p></div>
      </div>

      {/* Charts */}
      <div className={styles.chartsColumn}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>계절별 수급 추이</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlySupply}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={(value) => value.toLocaleString()} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="supply" name="공급" stroke="#2D6A4F" strokeWidth={2} />
              <Line type="monotone" dataKey="demand" name="수요" stroke="#DC2626" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>지역별 농가 분포</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={regionDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="region" type="category" width={60} />
              <Tooltip />
              <Bar dataKey="count" name="농가 수" fill="#52B788" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Warning Table */}
      <div className={styles.sectionHeader}>
        <h3>⚠️ 수급 경고 품목</h3>
        <Button variant="ghost" onClick={() => setIsBoardModalOpen(true)}>전체보기 →</Button>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table} style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th className={styles.colCrop}>작물</th>
              <th className={`${styles.numberCell} ${styles.colSupply}`}>현재 공급률</th>
              <th className={`${styles.statusCell} ${styles.colStatus}`}>상태</th>
              <th className={`${styles.statusCell} ${styles.colLevel}`}>경고 수준</th>
              <th className={styles.colAdvice}>권고 사항</th>
            </tr>
          </thead>
          <tbody>
            {topWarningItems.length === 0 && <tr><td colSpan={5}>경고 품목이 없습니다.</td></tr>}
            {topWarningItems.map((item, i) => (
              <tr key={i}>
                <td className={styles.tdBold} data-label="작물">{item.cropName}</td>
                <td className={styles.numberCell} data-label="현재 공급률">{Number(item.supplyRate).toFixed(2)}%</td>
                <td className={styles.statusCell} data-label="상태"><span className={`${styles.badge} ${item.status === '과잉' ? styles.badgeRed : styles.badgeOrange}`}>{item.status}</span></td>
                <td className={styles.statusCell} data-label="경고 수준"><span className={`${styles.badge} ${item.level === '긴급' ? styles.badgeRed : styles.badgeOrange}`}>{item.level}</span></td>
                <td className={styles.adviceCell} data-label="권고 사항">{item.advice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* 우측 AI 패널 영역 */}
    <div className={styles.aiPanelWrapper}>
      <GovAiPanel />
    </div>
  </div>

  {/* Balance Board Modal */}
      <Modal
        isOpen={isBoardModalOpen}
        onClose={() => setIsBoardModalOpen(false)}
        title="수급 경고 게시판"
        size="lg"
      >
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--color-text-secondary)', minHeight: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <h3 style={{ margin: 0, color: 'var(--color-text)' }}>수급 경고 상세 게시판</h3>
          <p>지자체 전용 수급 경고 게시판이 이 곳에 연동될 예정입니다.<br/>(추후 구현 시 본문 렌더링 영역)</p>
        </div>
      </Modal>
    </div>
  );
}
