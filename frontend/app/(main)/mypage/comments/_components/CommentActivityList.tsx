import Link from 'next/link';
import type { MyCommentActivity } from '../../_lib/community-activity.types';
import styles from '../page.module.css';

interface CommentActivityListProps {
  items: MyCommentActivity[];
}

export default function CommentActivityList({ items }: CommentActivityListProps) {
  return (
    <>
      {items.map(comment => (
        <div key={comment.commentId} className={styles.item}>
          <div className={styles.titleRow}>
            <Link href={`/community/${comment.postId}`} className={styles.title}>
              {comment.postTitle}
            </Link>
            {comment.accepted && <span className={styles.badge}>채택됨</span>}
          </div>
          <div className={styles.meta}>{comment.content}</div>
          <div className={styles.meta}>{new Date(comment.createdAt).toLocaleString('ko-KR')}</div>
        </div>
      ))}
    </>
  );
}
