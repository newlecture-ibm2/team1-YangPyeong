'use client';

import { useRouter } from 'next/navigation';
import Card from '@/components/common/Card/Card';
import Button from '@/components/common/Button/Button';
import Spinner from '@/components/common/Spinner/Spinner';
import { useNotifications } from './useNotifications';
import Pagination from '@/components/common/Pagination';
import styles from './page.module.css';

const TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  BALANCE_WARN: { label: '수급 알림', icon: '🚨' },
  GUIDE: { label: '영농 가이드', icon: '💡' },
  ORDER: { label: '주문/배송', icon: '📦' },
  POLICY: { label: '정책/공지', icon: '📢' },
  SYSTEM: { label: '시스템', icon: '⚙️' },
};

export default function MypageNotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    isLoading,
    currentPage,
    totalPages,
    setPage,
    filterType,
    setFilterType,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const handleNotificationClick = (id: number, link: string, isRead: boolean) => {
    if (!isRead) {
      markAsRead(id); // 백그라운드 처리 (await 없이 즉시 이동)
    }
    if (link) {
      router.push(link);
    }
  };

  // 간단한 상대 시간 포맷터 (date-fns 대신 직접 구현하여 의존성 최소화)
  const timeAgo = (dateString: string) => {
    const diff = new Date().getTime() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}일 전`;
    if (hours > 0) return `${hours}시간 전`;
    if (minutes > 0) return `${minutes}분 전`;
    return '방금 전';
  };

  return (
    <Card>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>알림 내역</h2>
          <Button variant="ghost" size="sm" onClick={markAllAsRead}>
            모두 읽음 처리
          </Button>
        </div>

        {/* 필터 칩 — 공통 Button의 variant와 맞지 않으므로 도메인 전용 스타일 사용 */}
        <div className={styles.filters}>
          <button
            className={`${styles.filterChip} ${!filterType ? styles.filterChipActive : ''}`}
            onClick={() => setFilterType(undefined)}
          >
            전체
          </button>
          {Object.entries(TYPE_LABELS).map(([key, { label }]) => (
            <button
              key={key}
              className={`${styles.filterChip} ${filterType === key ? styles.filterChipActive : ''}`}
              onClick={() => setFilterType(key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={styles.notificationList}>
          {isLoading && notifications.length === 0 ? (
            <Spinner message="알림을 불러오는 중입니다..." />
          ) : notifications.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📭</div>
              새로운 알림이 없습니다.
            </div>
          ) : (
            <>
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={styles.notificationCard}
                  data-read={notif.isRead}
                  onClick={() => handleNotificationClick(notif.id, notif.link, notif.isRead)}
                >
                  <div className={`${styles.iconWrapper} ${styles[`icon_${notif.type}`]}`}>
                    {TYPE_LABELS[notif.type]?.icon || '🔔'}
                  </div>
                  <div className={styles.content}>
                    <div className={styles.topRow}>
                      <span className={styles.time}>{timeAgo(notif.createdAt)}</span>
                    </div>
                    <h3 className={styles.cardTitle}>{notif.title}</h3>
                    <p className={styles.message}>{notif.message}</p>
                  </div>
                  {!notif.isRead && <div className={styles.unreadDot} />}
                </div>
              ))}
              
              <div className={styles.paginationWrapper}>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
