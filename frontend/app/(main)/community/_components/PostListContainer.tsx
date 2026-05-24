'use client';

import { useState, useEffect } from 'react';
import type { Post, CategoryResponse } from '../_lib/community.types';
import PostCard from './PostCard';
import styles from '../community.module.css';
import { getCategories, getPosts } from '../_lib/community.api';
import Pagination from '@/components/common/Pagination';
import { FilterBar, Dropdown, SearchInput } from '@/components';

interface PostListContainerProps {
  initialPosts: Post[];
  initialTotalPages: number;
  initialTotalCount: number;
}

export default function PostListContainer({
  initialPosts,
  initialTotalPages,
  initialTotalCount
}: PostListContainerProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'title' | 'content' | 'nickname'>('all');
  const [sortBy, setSortBy] = useState('createdAt,desc');
  const [loading, setLoading] = useState(false);

  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [totalCount, setTotalCount] = useState(initialTotalCount);

  // 카테고리 목록 로드
  useEffect(() => {
    const fetchCategories = async () => {
      const response = await getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    };
    fetchCategories();
  }, []);

  // 통합 검색/필터링 함수
  const fetchPosts = async (
    categoryId?: number | null,
    keyword?: string,
    sort?: string,
    page: number = 0
  ) => {
    setLoading(true);
    const response = await getPosts({
      categoryId: (categoryId !== undefined ? categoryId : selectedCategoryId) ? [(categoryId !== undefined ? categoryId : selectedCategoryId) as number] : undefined,
      keyword: keyword !== undefined ? keyword : searchKeyword,
      searchType: searchType,
      sort: sort !== undefined ? sort : sortBy,
      page: page,
      size: 10
    });

    if (response.success && response.data) {
      setPosts(response.data);
      if (response.meta) {
        setTotalPages(response.meta.totalPages || 1);
        setTotalCount(response.meta.total || 0);
        setCurrentPage(response.meta.page || 0);
      }
      // 페이지 변경 시 상단으로 스크롤
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setLoading(false);
  };

  // 카테고리 선택 핸들러
  const handleCategoryClick = (id: number | null) => {
    setSelectedCategoryId(id);
    fetchPosts(id);
  };

  // 검색 핸들러
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  // 정렬 핸들러
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    setSortBy(newSort);
    fetchPosts(undefined, undefined, newSort);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchPosts(undefined, undefined, undefined, newPage);
  };

  return (
    <div className={styles.listWrapper}>
      {/* ... (카테고리 탭 영역) */}
      <nav className={styles.categoryTabs}>
        <button
          className={`${styles.tab} ${selectedCategoryId === null ? styles.activeTab : ''}`}
          onClick={() => handleCategoryClick(null)}
        >
          전체
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            className={`${styles.tab} ${selectedCategoryId === category.id ? styles.activeTab : ''}`}
            onClick={() => handleCategoryClick(category.id)}
          >
            {category.name}
          </button>
        ))}
      </nav>

      <div className={styles.filterSection}>
        <FilterBar
          dropdowns={[
            <Dropdown
              key="searchType"
              options={[
                { value: 'all', label: '전체' },
                { value: 'title', label: '제목' },
                { value: 'content', label: '내용' },
              ]}
              value={searchType}
              onChange={(value) => setSearchType(value as any)}
              size="sm"
            />,
            <Dropdown
              key="sortBy"
              options={[
                { value: 'createdAt,desc', label: '최신순' },
                { value: 'viewCount,desc', label: '조회순' },
                { value: 'commentCount,desc', label: '댓글순' },
              ]}
              value={sortBy}
              onChange={(value) => {
                setSortBy(value);
                fetchPosts(undefined, undefined, value);
              }}
              size="sm"
            />,
          ]}
          search={
            <SearchInput
              placeholder="검색어를 입력하세요"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onSearch={() => fetchPosts()}
              size="sm"
            />
          }
        />
      </div>

      <div className={styles.listHeader}>
        <div className={styles.listMeta}>
          {loading ? '불러오는 중...' : <>총 <strong>{totalCount}</strong>개의 지혜가 쌓여있습니다. (페이지 {currentPage + 1} / {totalPages})</>}
        </div>
      </div>

      {posts.length > 0 ? (
        <>
          <div className={styles.list} data-guide="community-posts">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <div className={styles.empty}>
          <p>{loading ? '데이터를 불러오는 중입니다...' : '아직 등록된 게시글이 없습니다. 첫 번째 주인공이 되어보세요!'}</p>
        </div>
      )}
    </div>
  );
}
