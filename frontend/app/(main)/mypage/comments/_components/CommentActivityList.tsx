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
          <div className={styles.titleRow} style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginRight: '8px' }}>
              Re: <Link href={`/community/${comment.postId}`} style={{ textDecoration: 'underline' }}>{comment.postTitle}</Link>
            </span>
            {comment.accepted && <span className={styles.badge} style={{ fontSize: '0.75rem', padding: '2px 6px' }}>채택됨</span>}
          </div>
          <div className={styles.titleRow} style={{ marginBottom: '4px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--color-primary)', backgroundColor: 'var(--color-bg-sub)', padding: '2px 6px', borderRadius: '4px', marginRight: '8px' }}>내가 작성한 댓글</span>
            <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-text)' }}>{comment.content}</span>
          </div>
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
