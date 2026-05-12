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
            <Link href={`/community/${post.postId}`} className={styles.title}>
              {post.title}
            </Link>
          </div>
          <div className={styles.meta}>
            {post.categoryName} · 댓글 {post.commentCount}개 · 조회 {post.viewCount} ·{' '}
            {new Date(post.createdAt).toLocaleString('ko-KR')}
          </div>
        </div>
      ))}
    </>
  );
}
