'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from '../gov.module.css';
import { useGovUser, getTestHeaders } from '../useGovUser';
import GovTabs from '../_components/GovTabs';

interface CompareRow {
  crop: string; prevYearTon: number; currentYearTon: number; diffTon: number; diffRate: number;
}

const TABS = [
  { href: '/gov', label: '대시보드' },
  { href: '/gov/cultivation', label: '재배 현황' },
  { href: '/gov/compare', label: '연도 비교' },
  { href: '/gov/sales', label: '판매 현황' },
  { href: '/gov/download', label: '데이터 다운로드' },
];

export default function ComparePage() {
  const pathname = usePathname();
  const [data, setData] = useState<CompareRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: userLoading } = useGovUser();
  const [baseYear, setBaseYear] = useState('2025');
  const [compareYear, setCompareYear] = useState('2026');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/gov/compare?baseYear=${baseYear}&compareYear=${compareYear}`)
      .then(r => r.json())
      .then(res => { setData(res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [baseYear, compareYear]);

  const region = user?.regionName || "지자체";

  return (
    <div className={styles.page}>
      <div className={styles.headerWrapper}>
        <div className={styles.pageHeader}>
          <p className={styles.breadcrumb}>지자체 / 연도 비교</p>
          <h1 className={styles.pageTitle}>📊 연도 비교</h1>
        </div>
        <div>
          <GovTabs />
        </div>
      </div>

      {/* <div className={styles.tabs}>
        {TABS.map(t => (
          <Link key={t.href} href={t.href} className={`${styles.tab} ${pathname === t.href ? styles.tabActive : ''}`}>{t.label}</Link>
        ))}
      </div> */}

      <div className={styles.filterBar}>
        <select className={styles.formSelect} value={baseYear} onChange={e => setBaseYear(e.target.value)}>
          <option value="2024">기준: 2024</option>
          <option value="2025">기준: 2025</option>
        </select>
        <select className={styles.formSelect} value={compareYear} onChange={e => setCompareYear(e.target.value)}>
          <option value="2025">비교: 2025</option>
          <option value="2026">비교: 2026</option>
        </select>
      </div>

      <div className={styles.grid2}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>생산량 비교</h2>
          {loading ? <p>로딩 중...</p> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="crop" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="prevYearTon" name={`${baseYear}년`} fill="#52B788" radius={[4, 4, 0, 0]} />
                <Bar dataKey="currentYearTon" name={`${compareYear}년`} fill="#2D6A4F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>증감률</h2>
          {loading ? <p>로딩 중...</p> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="crop" />
                <YAxis unit="%" />
                <Tooltip formatter={(value: any) => typeof value === 'number' ? `${value.toFixed(2)}%` : `${value}%`} />
                <Bar dataKey="diffRate" name="증감률(%)" fill="#CCFF33" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table} style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th className={styles.colAuto}>작물</th>
              <th className={`${styles.numberCell} ${styles.col150}`}>{baseYear} 생산량</th>
              <th className={`${styles.numberCell} ${styles.col150}`}>{compareYear} 생산량</th>
              <th className={`${styles.numberCell} ${styles.col150}`}>증감</th>
              <th className={`${styles.numberCell} ${styles.col120}`}>증감률</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && <tr><td colSpan={5}>데이터가 없습니다.</td></tr>}
            {data.map((r, i) => (
              <tr key={i}>
                <td className={styles.tdBold}>{r.crop}</td>
                <td className={styles.numberCell}>{r.prevYearTon.toLocaleString()}kg</td>
                <td className={styles.numberCell}>{r.currentYearTon.toLocaleString()}kg</td>
                <td className={styles.numberCell} style={{ color: r.diffTon >= 0 ? 'var(--color-primary)' : 'var(--color-danger)' }}>
                  {r.diffTon >= 0 ? '+' : ''}{r.diffTon.toLocaleString()}kg
                </td>
                <td className={styles.numberCell}>
                  <span className={`${styles.badge} ${r.diffRate >= 0 ? styles.badgeGreen : styles.badgeRed}`}>
                    {r.diffRate >= 0 ? '+' : ''}{r.diffRate.toFixed(2)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
