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
          {comment.isHidden && (
            <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px' }}>
              <div style={{ color: '#B91C1C', fontWeight: 'bold', marginBottom: '4px' }}>
                🚨 관리자에 의해 숨김 처리된 댓글입니다. 사유: {comment.statusReason || '알 수 없음'}
              </div>
              <div style={{ color: '#7F1D1D', fontSize: '0.85rem' }}>
                {comment.hiddenMessage}
              </div>
            </div>
          )}
          <div className={styles.meta} style={{ marginTop: '8px' }}>{new Date(comment.createdAt).toLocaleString('ko-KR')}</div>
        </div>
      ))}
    </>
  );
}
