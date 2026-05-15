'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from '../gov.module.css';
import { useGovUser, getTestHeaders } from '../useGovUser';
import GovTabs from '../_components/GovTabs';
import Spinner from '@/components/common/Spinner/Spinner';

interface SalesData {
  summary: { totalAmount: string; txCount: number; activeSellers: number; momRate: string };
  topProducts: { rank: number; productName: string; seller: string; salesVolume: number; revenue: string }[];
  monthlySales: { month: string; amount: number }[];
}



export default function SalesPage() {
  const pathname = usePathname();
  const [data, setData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, loading: userLoading } = useGovUser();

  useEffect(() => {
    fetch('/api/gov/sales' + (window.location.search || ''), { headers: getTestHeaders() }) //')
      .then(r => r.json())
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

    if (userLoading || loading) return <div className={styles.page}><Spinner /></div>;
  if (!user || user.role !== 'GOV') return <div className={styles.page}><p>지자체 관리자만 접근할 수 있습니다.</p></div>;

  if (!data) return <div className={styles.page}><p>데이터를 불러올 수 없습니다.</p></div>;

  const { summary, topProducts, monthlySales } = data;

  const region = user?.regionName || "지자체";

  return (
    <div className={styles.page}>
      <div className={styles.headerWrapper}>
        <div className={styles.pageHeader}>
          <p className={styles.breadcrumb}>지자체 / 판매 현황</p>
          <h1 className={styles.pageTitle}>💰 판매 현황</h1>
          <div className={styles.tabsWrapper}>
            <GovTabs />
          </div>
        </div>
      </div>



      <div className={styles.kpiRow}>
        <div className={styles.kpi}><div className={styles.kpiLabel}>이번달 총 거래액</div><div className={styles.kpiValue}>₩{summary.totalAmount.toLocaleString()}</div></div>
        <div className={styles.kpi}><div className={styles.kpiLabel}>거래 건수</div><div className={styles.kpiValue}>{summary.txCount.toLocaleString()}</div></div>
        <div className={styles.kpi}><div className={styles.kpiLabel}>활성 판매자</div><div className={styles.kpiValue}>{summary.activeSellers}</div></div>
        <div className={styles.kpi}><div className={styles.kpiLabel}>전월 대비</div><div className={styles.kpiValue} style={{ color: 'var(--color-primary)' }}>{summary.momRate}</div></div>
      </div>

      <div className={styles.compareGrid}>
        
        {/* 좌측: 월별 거래액 추이 그래프 */}
        <div className={`${styles.card} ${styles.chartCard}`}>
          <div className={styles.cardHeaderRow}>
            <h2 className={styles.cardTitle}>월별 거래액 추이</h2>
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis width={80} />
                <Tooltip formatter={(value) => `₩${Number(value).toLocaleString()}`} />
                <Line type="monotone" dataKey="amount" name="거래액" stroke="#2D6A4F" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 우측 50%: 인기 상품 TOP 5 (높이를 좌측과 동일하게 고정) */}
        <div className={`${styles.card} ${styles.chartCard}`}>
          <div className={styles.cardHeaderRow}>
            <h2 className={styles.cardTitle}>인기 상품 TOP 5</h2>
          </div>
          <div className={styles.compareTableWrap} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <table className={styles.table} style={{ marginBottom: 0 }}>
              <thead>
                <tr>
                  <th className={`${styles.statusCell} ${styles.col60}`}>순위</th>
                  <th className={styles.colAuto}>상품</th>
                  <th className={styles.col80}>판매자</th>
                  <th className={`${styles.numberCell} ${styles.col100}`}>판매량</th>
                  <th className={`${styles.numberCell} ${styles.col120}`}>매출액</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>데이터가 없습니다.</td></tr>}
                {topProducts.map(p => (
                  <tr key={p.rank}>
                    <td className={styles.statusCell}>{p.rank}</td>
                    <td className={styles.tdBold}>{p.productName}</td>
                    <td>{p.seller}</td>
                    <td className={styles.numberCell}>{p.salesVolume.toLocaleString()}개</td>
                    <td className={styles.numberCell}>{Number(p.revenue).toLocaleString()}원</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
