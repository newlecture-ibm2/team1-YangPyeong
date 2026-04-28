'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from '../gov.module.css';
import { useGovUser, getTestHeaders } from '../_hooks/useGovUser';
import GovTabs from '../_components/GovTabs';

interface SalesData {
  summary: { totalAmount: string; txCount: number; activeSellers: number; momRate: string };
  topProducts: { rank: number; productName: string; seller: string; salesVolume: number; revenue: string }[];
  monthlySales: { month: string; amount: number }[];
}

const TABS = [
  { href: '/gov', label: '대시보드' },
  { href: '/gov/cultivation', label: '재배 현황' },
  { href: '/gov/compare', label: '연도 비교' },
  { href: '/gov/sales', label: '판매 현황' },
  { href: '/gov/download', label: '데이터 다운로드' },
];

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

    if (userLoading || loading) return <div className={styles.page}><p>로딩 중...</p></div>;
  if (!user || user.role !== 'GOV') return <div className={styles.page}><p>지자체 관리자만 접근할 수 있습니다.</p></div>;
  // if (loading) return <div className={styles.page}><p>로딩 중...</p></div>;
  if (!data) return <div className={styles.page}><p>데이터를 불러올 수 없습니다.</p></div>;

  const { summary, topProducts, monthlySales } = data;

  const region = user?.region || "지자체";

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <p className={styles.breadcrumb}>홈 › 지자체 › <strong>판매 현황</strong></p>
        <h1 className={styles.pageTitle}>💰 판매 현황</h1>
      </div>

      <GovTabs />

      {/* <div className={styles.tabs}>
        {TABS.map(t => (
          <Link key={t.href} href={t.href} className={`${styles.tab} ${pathname === t.href ? styles.tabActive : ''}`}>{t.label}</Link>
        ))}
      </div> */}

      <div className={styles.kpiRow}>
        <div className={styles.kpi}><div className={styles.kpiLabel}>이번달 총 거래액</div><div className={styles.kpiValue}>{summary.totalAmount}</div></div>
        <div className={styles.kpi}><div className={styles.kpiLabel}>거래 건수</div><div className={styles.kpiValue}>{summary.txCount.toLocaleString()}</div></div>
        <div className={styles.kpi}><div className={styles.kpiLabel}>활성 판매자</div><div className={styles.kpiValue}>{summary.activeSellers}</div></div>
        <div className={styles.kpi}><div className={styles.kpiLabel}>전월 대비</div><div className={styles.kpiValue} style={{ color: 'var(--color-primary)' }}>{summary.momRate}</div></div>
      </div>

      <GovTabs />

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>월별 거래액 추이</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthlySales}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => `₩${Number(value).toLocaleString()}`} />
            <Line type="monotone" dataKey="amount" name="거래액" stroke="#2D6A4F" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <GovTabs />

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>인기 상품 TOP 5</h2>
        <div className={styles.tableWrap} style={{ marginBottom: 0 }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thCenter}>순위</th>
                <th>상품</th>
                <th>판매자</th>
                <th className={styles.thRight}>판매량</th>
                <th className={styles.thRight}>매출액</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 && <tr><td colSpan={5}>데이터가 없습니다.</td></tr>}
              {topProducts.map(p => (
                <tr key={p.rank}>
                  <td className={styles.tdCenter}>{p.rank}</td>
                  <td className={styles.tdBold}>{p.productName}</td>
                  <td>{p.seller}</td>
                  <td className={styles.tdRight}>{p.salesVolume.toLocaleString()}개</td>
                  <td className={styles.tdRight}>{p.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
