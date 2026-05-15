'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from '../gov.module.css';
import { useGovUser, getTestHeaders } from '../useGovUser';
import GovTabs from '../_components/GovTabs';
import Spinner from '@/components/common/Spinner/Spinner';

interface CultivationRow {
  region: string; farmCount: number; areaM2: number; mainCrop: string; expectedTon: number;
}



export default function CultivationPage() {
  const pathname = usePathname();
  const [data, setData] = useState<CultivationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: userLoading } = useGovUser();
  const [year, setYear] = useState('2026');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/gov/cultivation?year=${year}`)
      .then(r => r.json())
      .then(res => { setData(res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [year]);

  const region = user?.regionName || "지자체";

  return (
    <div className={styles.page}>
      <div className={styles.headerWrapper}>
        <div className={styles.pageHeader}>
          <p className={styles.breadcrumb}>지자체 / 재배 현황</p>
          <h1 className={styles.pageTitle}>🌾 재배 현황</h1>
          <div className={styles.tabsWrapper}>
            <GovTabs />
          </div>
        </div>
      </div>



      <div className={styles.filterBar}>
        <select className={styles.formSelect} value={year} onChange={e => setYear(e.target.value)}>
          <option value="2026">연도: 2026</option>
          <option value="2025">연도: 2025</option>
        </select>
      </div>

          <div className={styles.twoColumnGrid}>
            <div className={`${styles.card} ${styles.chartCard}`}>
              <div className={styles.cardHeaderRow}>
                <h2 className={styles.cardTitle}>읍면별 재배 면적</h2>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>단위: ㎡</span>
              </div>
              <div className={styles.chartContainer}>
                {loading ? <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><Spinner /></div> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="region" />
                      <YAxis width={60} />
                      <Tooltip formatter={(value) => `${Number(value).toLocaleString()}㎡`} />
                      <Bar dataKey="areaM2" name="재배 면적(㎡)" fill="#2D6A4F" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className={styles.card} style={{ marginBottom: 0 }}>
              <div className={styles.cardHeaderRow}>
                <h2 className={styles.cardTitle}>재배 상세 현황</h2>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>총 {data.length}건</span>
              </div>
              <div className={styles.tableWrap} style={{ marginBottom: 0 }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.col100}>읍면</th>
                      <th className={`${styles.numberCell} ${styles.col100}`}>농가 수</th>
                      <th className={`${styles.numberCell} ${styles.col120}`}>재배 면적</th>
                      <th className={styles.colAuto}>주요 작물</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px' }}>데이터가 없습니다.</td></tr>}
                    {data.map((r, i) => (
                      <tr key={i}>
                        <td className={styles.tdBold}>{r.region}</td>
                        <td className={styles.numberCell}>{r.farmCount.toLocaleString()}</td>
                        <td className={styles.numberCell}>{r.areaM2.toLocaleString()}㎡</td>
                        <td>{r.mainCrop}</td>
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
