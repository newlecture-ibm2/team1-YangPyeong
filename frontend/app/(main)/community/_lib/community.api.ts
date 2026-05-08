import type { 
  Post, 
  Comment, 
  PostCreateRequest, 
  PostUpdateRequest,
  CategoryResponse,
  ReportRequest,
  CommunitySearchQuery 
} from './community.types';
import { ApiResponse, BACKEND_URL } from '@/lib/constants';

/**
 * 전용 클라이언트 API 호출 함수
 * (공통 api-client의 next/headers 의존성 문제를 피하기 위해 직접 fetch 사용)
 */
async function localApiFetch<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    // 서버 사이드(SSR)일 경우 BACKEND_URL 사용, 클라이언트일 경우 프록시 사용
    const isServer = typeof window === 'undefined';
    const baseUrl = isServer ? BACKEND_URL : '';
    // 프록시 경로(/api/proxy)는 클라이언트에서만 유효함. 서버에서는 백엔드 직접 호출(/api/...)
    const finalUrl = isServer ? path.replace('/api/proxy', '/api') : path;

    const response = await fetch(`${baseUrl}${finalUrl}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    });
    return await response.json();
  } catch (error) {
    return {
      success: false,
      data: null,
      error: { code: 'FETCH_ERROR', message: '데이터 통신 중 오류가 발생했습니다.' }
    };
  }
}

/**
 * 게시글 목록 조회
 */
export async function getPosts(query: CommunitySearchQuery) {
  const params = new URLSearchParams();
  if (query.categoryId) query.categoryId.forEach(id => params.append('categoryId', id.toString()));
  if (query.keyword) params.append('keyword', query.keyword);
  if (query.searchType) params.append('searchType', query.searchType);
  if (query.sort) params.append('sort', query.sort); // 정렬 추가
  if (query.page !== undefined) params.append('page', query.page.toString());
  if (query.size !== undefined) params.append('size', query.size.toString());

  return localApiFetch<Post[]>(`/api/proxy/community/posts?${params.toString()}`);
}

/**
 * 게시글 상세 조회
 */
export async function getPostDetail(postId: number) {
  return localApiFetch<Post>(`/api/proxy/community/posts/${postId}`);
}

/**
 * 게시글 작성
 */
export async function createPost(request: PostCreateRequest) {
  return localApiFetch<Post>('/api/proxy/community/posts', {
    method: 'POST',
    body: JSON.stringify(request)
  });
}

/**
 * 게시글 수정
 */
export async function updatePost(postId: number, request: PostUpdateRequest) {
  return localApiFetch<Post>(`/api/proxy/community/posts/${postId}`, {
    method: 'PUT',
    body: JSON.stringify(request)
  });
}

/**
 * 게시글 삭제
 */
export async function deletePost(postId: number) {
  return localApiFetch<void>(`/api/proxy/community/posts/${postId}`, {
    method: 'DELETE'
  });
}

/**
 * 댓글 목록 조회
 */
export async function getComments(postId: number) {
  return localApiFetch<Comment[]>(`/api/proxy/community/posts/${postId}/comments`);
}

/**
 * 댓글 작성
 */
export async function createComment(postId: number, content: string) {
  return localApiFetch<Comment>(`/api/proxy/community/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content })
  });
}

/**
 * 댓글 수정
 */
export async function updateComment(commentId: number, content: string) {
  return localApiFetch<Comment>(`/api/proxy/community/comments/${commentId}`, {
    method: 'PUT',
    body: JSON.stringify({ content })
  });
}

/**
 * 댓글 삭제
 */
export async function deleteComment(commentId: number) {
  return localApiFetch<void>(`/api/proxy/community/comments/${commentId}`, {
    method: 'DELETE'
  });
}

/**
 * 댓글 채택 (Q&A 전용)
 */
export async function acceptComment(commentId: number) {
  return localApiFetch<void>(`/api/proxy/community/comments/${commentId}/accept`, {
    method: 'PUT'
  });
}

/**
 * 카테고리 목록 조회
 */
export async function getCategories() {
  return localApiFetch<CategoryResponse[]>('/api/proxy/community/categories');
}

/**
 * 게시글 신고
 */
/**
 * 게시글 신고
 */
export async function reportPost(postId: number, reason: string) {
  return localApiFetch<void>(`/api/proxy/community/posts/${postId}/report`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
}

/**
 * 댓글 신고
 */
export async function reportComment(commentId: number, reason: string) {
  return localApiFetch<void>(`/api/proxy/community/comments/${commentId}/report`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
}
