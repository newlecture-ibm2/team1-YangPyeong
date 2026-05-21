'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/common/Card/Card';
import Button from '@/components/common/Button/Button';
import { getMyPosts } from '../_lib/community-activity.api';
import type { MyPostActivity } from '../_lib/community-activity.types';
import PostActivityList from './_components/PostActivityList';
import { POSTS_EMPTY_TEXT, POSTS_ERROR_TEXT, POSTS_PAGE_SIZE } from './_lib/constants';
import styles from './page.module.css';

export default function MyPostsPage() {
  const [items, setItems] = useState<MyPostActivity[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('ALL');

  const load = async (nextPage: number, currentStatus = status) => {
    try {
      setLoading(true);
      const res = await getMyPosts(nextPage, POSTS_PAGE_SIZE, currentStatus);
      setItems(res.items);
      setPage(nextPage);
      const pages = Math.max(1, Math.ceil(res.total / res.size));
      setTotalPages(pages);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : POSTS_ERROR_TEXT);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(0, status);
  }, [status]);

  return (
    <Card>
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <select 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}
          >
            <option value="ALL">전체 상태</option>
            <option value="ACTIVE">활성</option>
            <option value="HIDDEN">숨김(격리)</option>
          </select>
        </div>
        {loading && items.length === 0 && <div className={styles.loading}>불러오는 중...</div>}
        {error && <div className={styles.errorBanner}>{error}</div>}
        {!loading && !error && items.length === 0 && <div className={styles.empty}>{POSTS_EMPTY_TEXT}</div>}

        <PostActivityList items={items} />

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

