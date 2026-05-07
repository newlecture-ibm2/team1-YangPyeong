import { getPostDetail, getComments } from '../_lib/community.api';
import styles from './PostDetail.module.css';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CommentSection from '../_components/CommentSection';
import PostActions from '../_components/PostActions';
import { formatDate } from '../_lib/formatUtils';

/**
 * 게시글 상세 페이지 (Server Component)
 */
export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  
  // 데이터 병렬 페칭
  const [postRes, commentsRes] = await Promise.all([
    getPostDetail(Number(postId)),
    getComments(Number(postId))
  ]);

  if (!postRes.success || !postRes.data) {
    return notFound();
  }

  const post = postRes.data;
  const initialComments = commentsRes.success ? commentsRes.data || [] : [];

  return (
    <article className={styles.container}>
      <header className={styles.header}>
        <div className={styles.meta}>
          <Badge variant={post.isNotice ? 'dark' : 'green'}>
            {post.categoryName}
          </Badge>
          <span className={styles.date}>{formatDate(post.createdAt)}</span>
        </div>
        <h1 className={styles.title}>{post.title}</h1>
        <div className={styles.authorInfo}>
          <div className={styles.author}>
            <strong>{post.authorNickname || '알 수 없음'}</strong>
            <span>조회 {post.viewCount}</span>
          </div>
          <PostActions postId={post.id} authorId={post.authorId} />
        </div>
      </header>

      <section className={styles.content}>
        {post.content.split('\n').map((line, i) => {
          const imageMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
          if (imageMatch) {
            return (
              <div key={i} className={styles.imageWrapper}>
                <img src={imageMatch[2]} alt={imageMatch[1] || '이미지'} />
              </div>
            );
          }
          return <p key={i}>{line}</p>;
        })}
      </section>

      <footer className={styles.footer}>
        <Link href="/community">
          <Button variant="outline" size="md">목록으로</Button>
        </Link>
      </footer>

      {/* 댓글 섹션 추가 */}
      <CommentSection 
        postId={post.id} 
        initialComments={initialComments} 
        postAuthorId={post.authorId}
        categoryName={post.categoryName}
      />
    </article>
  );
}
