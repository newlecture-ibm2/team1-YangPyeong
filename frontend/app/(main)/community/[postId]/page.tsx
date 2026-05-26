import { backendFetch } from '@/lib/api-client';
import type { Post, Comment } from '../_lib/community.types';
import styles from './PostDetail.module.css';
import Badge from '@/components/common/Badge';
import Button from '@/components/common/Button';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CommentSection from '../_components/CommentSection';
import PostActions from '../_components/PostActions';
import { formatDate } from '../_lib/formatUtils';

const renderTitleWithEm = (text: string) => {
  if (!text) return '';
  const words = text.trim().split(' ');
  if (words.length <= 1) {
    return <em>{text}</em>;
  }
  const lastWord = words.pop();
  return (
    <>
      {words.join(' ')} <em>{lastWord}</em>
    </>
  );
};

/**
 * 게시글 상세 페이지 (Server Component)
 */
export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  
  // 데이터 병렬 페칭 (서버 컴포넌트이므로 backendFetch 사용 - withAuth로 인증 정보 포함)
  const [postRes, commentsRes] = await Promise.all([
    backendFetch<Post>(`/api/community/posts/${postId}`, { withAuth: true, revalidate: 0 }),
    backendFetch<Comment[]>(`/api/community/posts/${postId}/comments`, { withAuth: true, revalidate: 0 })
  ]);

  if (!postRes.success || !postRes.data) {
    return notFound();
  }

  const post = postRes.data;
  const initialComments = commentsRes.success ? commentsRes.data || [] : [];

  return (
    <article className={styles.container}>
      {post.isHidden && (
        <div style={{
          backgroundColor: '#fff1f0',
          border: '1px solid #ffa39e',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          color: '#cf1322',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>⚠️</span>
          <span>관리자에 의해 숨김 처리된 게시글입니다. (작성자 본인 및 관리자만 열람 가능)</span>
        </div>
      )}
      <nav className={styles.breadcrumb}>
        <Link href="/">홈</Link> / <Link href="/community">수다방</Link> / 상세보기
      </nav>
      <header className={styles.header}>
        <div className={styles.meta}>
          {post.isNotice && <Badge variant="dark">📢 공지</Badge>}
          <Badge variant="green">
            {post.categoryName}
          </Badge>
          <span className={styles.date}>{formatDate(post.createdAt)}</span>
        </div>
        <h1 className="page-title" style={{ marginBottom: '24px' }}>{renderTitleWithEm(post.title)}</h1>
        <div className={styles.authorInfo}>
          <div className={styles.author}>
            <strong style={post.authorStatus === 'WITHDRAWN' ? { color: 'var(--color-text-tertiary, #999)' } : undefined}>
              {post.authorStatus === 'WITHDRAWN' ? '(탈퇴한 사용자)' : (post.authorNickname || '알 수 없음')}
            </strong>
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
