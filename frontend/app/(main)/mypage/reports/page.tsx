'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/common/Card/Card';
import Button from '@/components/common/Button/Button';
import { getMyReports } from '../_lib/community-activity.api';
import type { MyReportActivity } from '../_lib/community-activity.types';
import ReportActivityList from './_components/ReportActivityList';
import { REPORTS_EMPTY_TEXT, REPORTS_ERROR_TEXT, REPORTS_PAGE_SIZE } from './_lib/constants';
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
        {loading && items.length === 0 && <div className={styles.loading}>불러오는 중...</div>}
        {error && <div className={styles.errorBanner}>{error}</div>}
        {!loading && !error && items.length === 0 && <div className={styles.empty}>{REPORTS_EMPTY_TEXT}</div>}

        <ReportActivityList items={items} />

        {totalPages > 1 && (
          <div className={styles.footer}>
            <div className={styles.pagination}>
              <Button
                variant="outline"
                onClick={() => load(page - 1)}
                disabled={loading || page <= 0}
              >
                이전
              </Button>
              <span className={styles.pageInfo}>
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => load(page + 1)}
                disabled={loading || page >= totalPages - 1}
              >
                다음
              </Button>
            </div>
          </div>
        )}
        {loading && items.length > 0 && (
          <div className={styles.footer}>
            <span className={styles.pageInfo}>불러오는 중...</span>
          </div>
        )}
      </div>
    </Card>
  );
}

