'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from '../gov.module.css';
import { useGovUser, getTestHeaders } from '../useGovUser';
import GovTabs from '../_components/GovTabs';
import { useGovChat } from '../_components/GovChatProvider';
import Spinner from '@/components/common/Spinner/Spinner';
import Dropdown from '@/components/common/Dropdown';

interface CompareRow {
  crop: string; prevYearTon: number | null; currentYearTon: number | null; diffTon: number; diffRate: number | null;
}



export default function ComparePage() {
  const pathname = usePathname();
  const [data, setData] = useState<CompareRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: userLoading } = useGovUser();
  const { setPageContext } = useGovChat();
  const [baseYear, setBaseYear] = useState('2025');
  const [compareYear, setCompareYear] = useState('2026');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/gov/compare?baseYear=${baseYear}&compareYear=${compareYear}`)
      .then(r => r.json())
      .then(res => { 
        const mappedData = (res.data || []).map((row: any) => {
          // kg → ton 변환
          if (row.prevYearTon != null) row.prevYearTon = Math.round(row.prevYearTon / 1000 * 100) / 100;
          if (row.currentYearTon != null) row.currentYearTon = Math.round(row.currentYearTon / 1000 * 100) / 100;
          if (row.prevYearTon === 0) row.prevYearTon = null;
          if (row.currentYearTon === 0) row.currentYearTon = null;
          if (row.prevYearTon == null) row.diffRate = null;
          // diffTon도 ton 단위로 재계산
          const prev = row.prevYearTon ?? 0;
          const curr = row.currentYearTon ?? 0;
          row.diffTon = Math.round((curr - prev) * 100) / 100;
          return row;
        });
        setData(mappedData); 
        setLoading(false); 
      })
      .catch(() => setLoading(false));
  }, [baseYear, compareYear]);

  // ── 화면 데이터를 챗봇 pageContext로 등록 ──
  useEffect(() => {
    if (data.length > 0) {
      setPageContext({
        pageType: 'compare',
        pageTitle: '연도 비교',
        baseYear,
        compareYear,
        compareSummary: data.map(d => ({
          crop: d.crop,
          prevYearTon: d.prevYearTon,
          currentYearTon: d.currentYearTon,
          diffTon: d.diffTon,
          diffRate: d.diffRate,
        })),
      });
    }
    return () => setPageContext(null);
  }, [data, baseYear, compareYear, setPageContext]);

  const region = user?.regionName || "지자체";

  return (
    <div className={styles.page}>
      <div className={styles.headerWrapper}>
        <div className={styles.pageHeader}>
          <p className={styles.breadcrumb}>지자체 / 연도 비교</p>
          <h1 className="page-title">📊 연도 <em>비교</em></h1>
          <div className={styles.tabsWrapper}>
            <GovTabs />
          </div>
        </div>
      </div>



      <div className={styles.filterBar}>
        <Dropdown
          options={[
            { label: '기준: 2024', value: '2024' },
            { label: '기준: 2025', value: '2025' }
          ]}
          value={baseYear}
          onChange={setBaseYear}
        />
        <Dropdown
          options={[
            { label: '비교: 2025', value: '2025' },
            { label: '비교: 2026', value: '2026' }
          ]}
          value={compareYear}
          onChange={setCompareYear}
        />
      </div>

      <div className={styles.compareGrid}>
        {/* 좌측: 생산량 및 증감률 차트 영역 (세로 배치) */}
        <div className={styles.compareCharts}>
          <div className={styles.card} style={{ marginBottom: 0 }}>
            <div className={styles.cardHeaderRow}>
              <h2 className={styles.cardTitle}>생산량 비교</h2>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>단위: ton</span>
            </div>
            {loading ? <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '380px' }}><Spinner /></div> : (
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="crop" interval={0} angle={-30} textAnchor="end" height={65} tick={{ fontSize: 12 }} />
                  <YAxis width={80} tickFormatter={(value) => value.toLocaleString()} />
                  <Tooltip formatter={(value) => `${Number(value).toLocaleString()}ton`} />
                  <Legend wrapperStyle={{ paddingTop: '8px' }} />
                  <Bar dataKey="prevYearTon" name={`${baseYear}년`} fill="#52B788" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="currentYearTon" name={`${compareYear}년`} fill="#2D6A4F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className={styles.card} style={{ marginBottom: 0 }}>
            <div className={styles.cardHeaderRow}>
              <h2 className={styles.cardTitle}>증감률</h2>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>단위: %</span>
            </div>
            {loading ? <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '380px' }}><Spinner /></div> : (
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="crop" interval={0} angle={-30} textAnchor="end" height={65} tick={{ fontSize: 12 }} />
                  <YAxis width={60} unit="%" tickFormatter={(value) => value.toLocaleString()} />
                  <Tooltip formatter={(value) => typeof value === 'number' ? `${value.toFixed(2)}%` : `계산 불가`} />
                  <Bar dataKey="diffRate" name="증감률(%)" fill="#2D6A4F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* 우측: 연도 비교 상세 테이블 카드 */}
        <div className={`${styles.card} ${styles.compactTableCard}`}>
          <div className={styles.cardHeaderRow}>
            <h2 className={styles.cardTitle}>연도 비교 상세 현황</h2>
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>총 {data.length}건</span>
          </div>
          <div className={styles.compareTableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.colAuto}>작물</th>
                  <th className={`${styles.numberCell} ${styles.col100}`}>{baseYear}년</th>
                  <th className={`${styles.numberCell} ${styles.col100}`}>{compareYear}년</th>
                  <th className={`${styles.numberCell} ${styles.col100}`}>증감</th>
                  <th className={`${styles.numberCell} ${styles.col100}`}>비율</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>데이터가 없습니다.</td></tr>}
                {data.map((r, i) => (
                  <tr key={i}>
                    <td className={styles.tdBold}>{r.crop}</td>
                    <td className={styles.numberCell}>{r.prevYearTon != null ? r.prevYearTon.toLocaleString() : '-'}</td>
                    <td className={styles.numberCell}>{r.currentYearTon != null ? r.currentYearTon.toLocaleString() : '-'}</td>
                    <td className={styles.numberCell} style={{ color: r.diffTon > 0 ? 'var(--color-primary)' : (r.diffTon < 0 ? 'var(--color-danger)' : 'var(--color-text)') }}>
                      {r.diffTon > 0 ? '+' : ''}{r.diffTon.toLocaleString()}
                    </td>
                    <td className={styles.numberCell}>
                      {r.diffRate == null ? (
                        <span className={`${styles.badge} ${styles.badgeGhost}`} style={{ minWidth: '48px', padding: '2px 8px' }}>
                          {r.diffTon > 0 ? '신규' : '-'}
                        </span>
                      ) : (
                        <span className={`${styles.badge} ${r.diffRate > 0 ? styles.badgeGreen : (r.diffRate < 0 ? styles.badgeRed : styles.badgeGhost)}`} style={{ minWidth: '48px', padding: '2px 8px' }}>
                          {r.diffRate > 0 ? '+' : ''}{r.diffRate.toFixed(1)}%
                        </span>
                      )}
                    </td>
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
