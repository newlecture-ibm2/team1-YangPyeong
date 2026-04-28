'use client';

import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import styles from './gov.module.css';

interface DashboardData {
  summary: { totalFarms: number; totalCrops: number; surplusCount: number; shortageCount: number };
  warningItems: { cropName: string; supplyRate: number; status: string; level: string; advice: string }[];
  monthlySupply: { label: string; supply: number; demand: number }[];
  regionDistribution: { region: string; count: number }[];
}

export default function GovDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/gov/dashboard')
      .then(r => r.json())
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className={styles.page}><p>로딩 중...</p></div>;
  if (!data) return <div className={styles.page}><p>데이터를 불러올 수 없습니다.</p></div>;

  const { summary, warningItems, monthlySupply, regionDistribution } = data;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <p className={styles.breadcrumb}>지자체 / 대시보드</p>
        <h1 className={styles.pageTitle}>양평군 <em>대시보드</em></h1>
        <p className={styles.pageSub}>양평군 전체 농업 현황과 수급 밸런스를 모니터링합니다.</p>
      </div>

      {/* KPI */}
      <div className={styles.kpiRow}>
        <div className={styles.kpi}><p className={styles.kpiLabel}>등록 농가</p><p className={styles.kpiValue}>{summary.totalFarms.toLocaleString()}</p></div>
        <div className={styles.kpi}><p className={styles.kpiLabel}>관리 작물</p><p className={styles.kpiValue}>{summary.totalCrops}종</p></div>
        <div className={styles.kpi}><p className={styles.kpiLabel}>과잉 품목</p><p className={`${styles.kpiValue} ${styles.kpiValueDanger}`}>{summary.surplusCount}</p></div>
        <div className={styles.kpi}><p className={styles.kpiLabel}>부족 품목</p><p className={`${styles.kpiValue} ${styles.kpiValueDanger}`}>{summary.shortageCount}</p></div>
      </div>

      {/* Charts */}
      <div className={styles.bento}>
        <div className={styles.col8}>
          <div className={styles.card} style={{ height: '100%', marginBottom: 0 }}>
            <h3 className={styles.cardTitle}>계절별 수급 추이</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlySupply}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="supply" name="공급" stroke="#2D6A4F" strokeWidth={2} />
                <Line type="monotone" dataKey="demand" name="수요" stroke="#DC2626" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className={styles.col4}>
          <div className={styles.card} style={{ height: '100%', marginBottom: 0 }}>
            <h3 className={styles.cardTitle}>지역별 농가 분포</h3>
            <ResponsiveContainer width="100%" height={300}>
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
      </div>

      {/* Warning Table */}
      <div className={styles.sectionHeader}>
        <h3>⚠️ 수급 경고 품목</h3>
        <a className={styles.btnGhost} href="/balance">전체보기 →</a>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>작물</th>
              <th className={styles.thRight}>현재 공급률</th>
              <th className={styles.thCenter}>상태</th>
              <th className={styles.thCenter}>경고 수준</th>
              <th>권고 사항</th>
            </tr>
          </thead>
          <tbody>
            {warningItems.length === 0 && <tr><td colSpan={5}>경고 품목이 없습니다.</td></tr>}
            {warningItems.map((item, i) => (
              <tr key={i}>
                <td className={styles.tdBold}>{item.cropName}</td>
                <td className={styles.tdRight}>{item.supplyRate.toLocaleString()}%</td>
                <td className={styles.tdCenter}><span className={`${styles.badge} ${item.status === '과잉' ? styles.badgeRed : styles.badgeOrange}`}>{item.status}</span></td>
                <td className={styles.tdCenter}><span className={`${styles.badge} ${item.level === '긴급' ? styles.badgeRed : styles.badgeOrange}`}>{item.level}</span></td>
                <td>{item.advice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
