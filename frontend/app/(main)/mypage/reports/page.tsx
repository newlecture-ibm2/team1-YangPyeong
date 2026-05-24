'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/common/Card/Card';
import Button from '@/components/common/Button/Button';
import { getMyReports } from '../_lib/community-activity.api';
import type { MyReportActivity } from '../_lib/community-activity.types';
import ReportActivityList from './_components/ReportActivityList';
import { REPORTS_EMPTY_TEXT, REPORTS_ERROR_TEXT, REPORTS_PAGE_SIZE } from './_lib/constants';
import Pagination from '@/components/common/Pagination';
import styles from './page.module.css';

export default function MyReportsPage() {
  const [items, setItems] = useState<MyReportActivity[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async (nextPage: number) => {
    try {
      setLoading(true);
      const res = await getMyReports(nextPage, REPORTS_PAGE_SIZE);
      setItems(res.items);
      setPage(nextPage);
      const pages = Math.max(1, Math.ceil(res.total / res.size));
      setTotalPages(pages);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : REPORTS_ERROR_TEXT);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0);
  }, []);

  return (
    <Card>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>신고 내역</h2>
        </div>

        {loading && items.length === 0 ? (
          <div className={styles.loading}>불러오는 중...</div>
        ) : error ? (
          <div className={styles.errorBanner}>{error}</div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>{REPORTS_EMPTY_TEXT}</div>
        ) : (
          <div className={styles.listContent}>
            <div className={styles.list}>
              <ReportActivityList items={items} />
            </div>

            {totalPages > 1 && (
              <div className={styles.paginationWrapper}>
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={(nextPage) => load(nextPage)}
                />
              </div>
            )}
          </div>
        )}
        
        {loading && items.length > 0 && (
          <div className={styles.loadingWrapper}>
            <span className={styles.pageInfo}>불러오는 중...</span>
          </div>
        )}
      </div>
    </Card>
  );
}

