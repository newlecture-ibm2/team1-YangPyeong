/**
 * 커뮤니티 카테고리 정보
 */
export interface PostCategory {
  id: number;
  name: string;
  description?: string;
  displayOrder: number;
}

/**
 * 커뮤니티 게시글 정보 (상세/목록 공용)
 */
export interface Post {
  id: number;
  categoryId: number;
  authorId: number;
  authorNickname?: string;
  title: string;
  content: string;
  viewCount: number;
  commentCount: number;
  hasAcceptedComment: boolean;
  categoryName: string;
  isNotice: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 커뮤니티 카테고리 응답 규격
 */
export interface CategoryResponse {
  id: number;
  name: string;
  description: string;
  displayOrder: number;
}

/**
 * 커뮤니티 댓글 정보
 */
export interface Comment {
  id: number;
  postId: number;
  authorId: number;
  authorNickname?: string;
  content: string;
  accepted: boolean;
  parentId?: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 게시글 작성 요청 규격
 */
export interface PostCreateRequest {
  categoryId: number;
  title: string;
  content: string;
  isNotice: boolean;
}

/**
 * 게시글 수정 요청 규격
 */
export interface PostUpdateRequest {
  categoryId: number;
  title: string;
  content: string;
  isNotice: boolean;
}

/**
 * 신고 요청 규격
 */
export interface ReportRequest {
  reason: string;
}

/**
 * 게시글 검색 쿼리 파라미터
 */
export interface CommunitySearchQuery {
  categoryId?: number[];
  keyword?: string;
  searchType?: 'all' | 'title' | 'content' | 'nickname';
  sort?: string; // 추가
  page?: number;
  size?: number;
}
