'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '../gov.module.css';
import { useGovUser, getTestHeaders } from '../useGovUser';
import GovTabs from '../_components/GovTabs';
import ModalDialog from '@/components/common/Modal/ModalDialog';
import { useModalDialog } from '@/components/common/Modal/useModalDialog';

/**
 * 데이터 다운로드 (gov-download.html 설계서 기반)
 * DB 조회 데이터를 Excel/CSV 파일로 내보내기(export)하는 기능입니다.
 * 첨부파일 업로드/다운로드가 아닙니다.
 */

interface DownloadHistoryItem {
  type: string;
  format: string;
  startDate: string;
  endDate: string;
  town: string;
  createdAt: string;
}

const DATA_TYPE_OPTIONS = [
  { label: '재배 현황', value: 'CULTIVATION' },
  { label: '수급 현황', value: 'BALANCE' },
  { label: '판매 데이터', value: 'SALES' },
  { label: '농가 목록', value: 'FARM' },
];

const TYPE_LABEL_MAP: Record<string, string> = {
  CULTIVATION: '재배 현황',
  BALANCE: '수급 현황',
  SALES: '판매 데이터',
  FARM: '농가 목록',
};



const TABS = [
  { href: '/gov', label: '대시보드' },
  { href: '/gov/cultivation', label: '재배 현황' },
  { href: '/gov/compare', label: '연도 비교' },
  { href: '/gov/sales', label: '판매 현황' },
  { href: '/gov/download', label: '데이터 다운로드' },
];

export default function DownloadPage() {
  const { user, loading: userLoading } = useGovUser();
  const pathname = usePathname();
  const { dialog, showAlert, handleConfirm, handleClose } = useModalDialog();

  // 폼 상태
  const [dataType, setDataType] = useState('CULTIVATION');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [format, setFormat] = useState<'XLSX' | 'CSV'>('XLSX');
  const [town, setTown] = useState('');
  const [downloading, setDownloading] = useState(false);

  // 읍면 목록 API 조회 (하드코딩 제거)
  const [townOptions, setTownOptions] = useState<{code: string; name: string}[]>([]);

  // DB 이력
  const [history, setHistory] = useState<DownloadHistoryItem[]>([]);

  /** 이력 조회 */
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/gov/download/history', {
        headers: getTestHeaders()
      });
      const json = await res.json();
      if (json.data) setHistory(json.data);
    } catch (e) {
      console.error('[History]', e);
    }
  }, []);

  // 페이지 로드 시 이력 + 읍면 목록 조회
  useEffect(() => {
    fetchHistory();
    fetch('/api/gov/regions', { headers: getTestHeaders() })
      .then(r => r.json())
      .then(res => { if (res.data) setTownOptions(res.data); })
      .catch(console.error);
  }, [fetchHistory]);

  /** 다운로드 실행 */
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const townParam = town || 'ALL';
      const params = new URLSearchParams({
        type: dataType,
        format,
        startDate,
        endDate,
        town: townParam,
      });

      const res = await fetch(`/api/gov/download?${params.toString()}`, {
        headers: getTestHeaders()
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        const msg = errBody?.error?.message || '데이터 내보내기에 실패했습니다.';
        showAlert(msg, '다운로드 오류');
        return;
      }

      // Content-Disposition에서 파일명 추출
      const disposition = res.headers.get('Content-Disposition');
      let filename = `farmbalance_${dataType.toLowerCase()}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.${format.toLowerCase()}`;
      if (disposition) {
        const match = disposition.match(/filename[^;=\n]*=\s*["']?([^"';\n]+)/);
        if (match?.[1]) filename = match[1];
      }

      // Blob → 다운로드
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // 다운로드 성공 → 이력 최신화
      await fetchHistory();
    } catch (e) {
      console.error('[Download]', e);
      showAlert('네트워크 오류가 발생했습니다.', '다운로드 오류');
    } finally {
      setDownloading(false);
    }
  };

  /** 날짜 포맷 */
  const formatDate = (iso: string) => {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const region = user?.regionName || "지자체";

  return (
    <div className={styles.page}>
      <div className={styles.headerWrapper}>
        <div className={styles.pageHeader}>
          <p className={styles.breadcrumb}>지자체 / 데이터 다운로드</p>
          <h1 className={styles.pageTitle}>📥 데이터 다운로드</h1>
          <p className={styles.pageSub}>{region} 농업 데이터를 Excel/CSV 형식으로 다운로드할 수 있습니다.</p>
          <div className={styles.tabsWrapper}>
            <GovTabs />
          </div>
        </div>
      </div>

      {/* <div className={styles.tabs}>
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`${styles.tab} ${pathname === t.href ? styles.tabActive : ''}`}
          >
            {t.label}
          </Link>
        ))}
      </div> */}

      {/* ── Download Settings ── */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>다운로드 설정</h2>
        <div className={styles.downloadGrid}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>데이터 유형</label>
            <select
              className={styles.formSelect}
              style={{ width: '100%' }}
              value={dataType}
              onChange={e => setDataType(e.target.value)}
            >
              {DATA_TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>기간</label>
            <div className={styles.dateRange}>
              <input
                className={styles.formInput}
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
              <span>~</span>
              <input
                className={styles.formInput}
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>파일 형식</label>
            <div className={styles.fileFormatBtns}>
              <button
                className={format === 'XLSX' ? `${styles.btnPrimary} ${styles.btnSm}` : styles.btnOutline}
                onClick={() => setFormat('XLSX')}
              >
                Excel (.xlsx)
              </button>
              <button
                className={format === 'CSV' ? `${styles.btnPrimary} ${styles.btnSm}` : styles.btnOutline}
                onClick={() => setFormat('CSV')}
              >
                CSV (.csv)
              </button>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>읍면 필터</label>
            <select
              className={styles.formSelect}
              style={{ width: '100%' }}
              value={town}
              onChange={e => setTown(e.target.value)}
            >
              <option value="">전체</option>
              {townOptions.map(t => (
                <option key={t.code} value={t.code}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.downloadAction}>
          <button
            className={`${styles.btnPrimary} ${styles.btnLg}`}
            onClick={handleDownload}
            disabled={downloading}
            style={downloading ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
          >
            {downloading ? '⏳ 다운로드 중...' : '📥 데이터 다운로드'}
          </button>
        </div>
      </div>

      {/* ── Recent Downloads (DB 이력) ── */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>최근 다운로드 이력</h2>
        <div className={styles.tableWrap} style={{ marginBottom: 0 }}>
          <table className={styles.table} style={{ tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th className={`${styles.dateCell} ${styles.col200}`}>일시</th>
                <th className={styles.colAuto}>데이터 유형</th>
                <th className={`${styles.statusCell} ${styles.col150}`}>형식</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: '#6B7280' }}>
                    다운로드 이력이 없습니다.
                  </td>
                </tr>
              ) : (
                history.map((item, i) => (
                  <tr key={i}>
                    <td className={styles.dateCell}>{formatDate(item.createdAt)}</td>
                    <td>{TYPE_LABEL_MAP[item.type] || item.type}</td>
                    <td className={styles.statusCell}>{item.format === 'XLSX' ? 'Excel' : 'CSV'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ModalDialog
        {...dialog}
        onConfirm={handleConfirm}
        onClose={handleClose}
      />
    </div>
  );
}
