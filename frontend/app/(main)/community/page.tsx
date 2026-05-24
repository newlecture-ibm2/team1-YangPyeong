import PostListContainer from './_components/PostListContainer';
import CommunityWriteButton from './_components/CommunityWriteButton';
import { getPosts } from './_lib/community.api';
import styles from './community.module.css';

/**
 * 커뮤니티 메인 페이지 (Server Component)
 */
export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  
  // 초기 데이터 페칭 (서버 사이드)
  const query = {
    keyword: typeof resolvedParams.keyword === 'string' ? resolvedParams.keyword : undefined,
    searchType: (resolvedParams.searchType as 'all' | 'title' | 'content') || 'all',
    page: 0,
    size: 10,
  };

  const response = await getPosts(query);
  const initialPosts = response.success ? response.data || [] : [];
  const initialTotalPages = response.meta?.totalPages || 1;
  const initialTotalCount = response.meta?.total || 0;

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <span className={styles.tag}>홈 / 수다방</span>
          <h1 className="page-title">파머들의 <em>수다방</em></h1>
          <p>서로의 지혜를 나누고 함께 성장하는 FarmBalance 커뮤니티입니다.</p>
        </div>
        <div className={styles.headerButtons}>
          <CommunityWriteButton />
        </div>
      </header>

      <section className={styles.content}>
        <PostListContainer 
          initialPosts={initialPosts} 
          initialTotalPages={initialTotalPages}
          initialTotalCount={initialTotalCount}
        />
      </section>
    </main>
  );
}
