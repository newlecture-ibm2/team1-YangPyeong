'use client';

import { useEffect, useState } from 'react';
import Card from '@/components/common/Card/Card';
import Button from '@/components/common/Button/Button';
import { getMyPosts } from '../_lib/community-activity.api';
import type { MyPostActivity } from '../_lib/community-activity.types';
import PostActivityList from './_components/PostActivityList';
import { POSTS_EMPTY_TEXT, POSTS_ERROR_TEXT, POSTS_PAGE_SIZE } from './_lib/constants';
import Pagination from '@/components/common/Pagination';
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
        <div className={styles.header}>
          <h2 className={styles.title}>내 게시글</h2>
        </div>

        {/* 필터 칩 */}
        <div className={styles.filters}>
          <button
            className={`${styles.filterChip} ${status === 'ALL' ? styles.filterChipActive : ''}`}
            onClick={() => setStatus('ALL')}
          >
            전체
          </button>
          <button
            className={`${styles.filterChip} ${status === 'ACTIVE' ? styles.filterChipActive : ''}`}
            onClick={() => setStatus('ACTIVE')}
          >
            활성
          </button>
          <button
            className={`${styles.filterChip} ${status === 'HIDDEN' ? styles.filterChipActive : ''}`}
            onClick={() => setStatus('HIDDEN')}
          >
            숨김(격리)
          </button>
        </div>

        {loading && items.length === 0 ? (
          <div className={styles.loading}>불러오는 중...</div>
        ) : error ? (
          <div className={styles.errorBanner}>{error}</div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>{POSTS_EMPTY_TEXT}</div>
        ) : (
          <div className={styles.listContent}>
            <div className={styles.list}>
              <PostActivityList items={items} />
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

