'use client';

import type { Post } from '../_lib/community.types';
import styles from './PostCard.module.css';
import Card from '@/components/common/Card';
import Badge from '@/components/common/Badge';
import { useRouter } from 'next/navigation';
import { formatDate } from '../_lib/formatUtils';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/community/${post.id}`);
  };

  const isQA = post.categoryName.includes('Q&A');

  // 프론트엔드에서 본문 내용 기반 이미지 포함 여부 판단
  const contentLower = (post.content || '').toLowerCase();
  const hasImage = contentLower.includes('<img') || 
                   contentLower.includes('![](') || 
                   contentLower.includes('.jpg') || 
                   contentLower.includes('.png') || 
                   contentLower.includes('.gif') || 
                   contentLower.includes('.webp');

  return (
    <div className={styles.row} onClick={handleClick}>
      <div className={styles.meta}>
        <Badge variant={post.isNotice ? 'dark' : 'green'} className={styles.badge}>
          {post.categoryName}
        </Badge>
        {isQA && post.hasAcceptedComment && (
          <Badge variant="green" className={styles.badge}>✅ 채택완료</Badge>
        )}
      </div>
      
      <div className={styles.mainInfo}>
        <h3 className={styles.title}>
          {post.title}
          {hasImage && <span className={styles.imageIcon}>🖼️</span>}
        </h3>
        <div className={styles.details}>
          <span className={styles.nickname}>{post.authorNickname || '알 수 없음'}</span>
          <span className={styles.divider}>|</span>
          <span className={styles.date}>{formatDate(post.createdAt)}</span>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.statItem}>
          <span className={styles.label}>👁</span>
          <span>{post.viewCount}</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.label}>💬</span>
          <span>{post.commentCount}</span>
        </div>
      </div>
    </div>
  );
}
