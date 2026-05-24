import Link from 'next/link';
import type { MyPostActivity } from '../../_lib/community-activity.types';
import styles from '../page.module.css';

interface PostActivityListProps {
  items: MyPostActivity[];
}

export default function PostActivityList({ items }: PostActivityListProps) {
  return (
    <>
      {items.map(post => (
        <div key={post.postId} className={styles.item}>
          <div className={styles.titleRow}>
            <Link href={`/community/${post.postId}`} className={styles.cardTitle}>
              {post.title}
            </Link>
          </div>
          {post.isHidden && (
            <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px' }}>
              <div style={{ color: '#B91C1C', fontWeight: 'bold', marginBottom: '4px' }}>
                🚨 관리자에 의해 숨김 처리된 게시글입니다. 사유: {post.statusReason || '알 수 없음'}
              </div>
              <div style={{ color: '#7F1D1D', fontSize: '0.85rem' }}>
                {post.hiddenMessage}
              </div>
            </div>
          )}
          <div className={styles.meta} style={{ marginTop: '8px' }}>
            {post.categoryName} · 댓글 {post.commentCount}개 · 조회 {post.viewCount} ·{' '}
            {new Date(post.createdAt).toLocaleString('ko-KR')}
          </div>
        </div>
      ))}
    </>
  );
}
