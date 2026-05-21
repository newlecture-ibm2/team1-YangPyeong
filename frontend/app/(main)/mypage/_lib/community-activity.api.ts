import { apiFetch } from '@/lib/api-fetch';
import type { MyCommentActivity, MyPostActivity, MyReportActivity } from './community-activity.types';

interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

async function getPaged<T>(path: string, page = 0, size = 10): Promise<PagedResult<T>> {
  const url = path.includes('?') ? `${path}&page=${page}&size=${size}` : `${path}?page=${page}&size=${size}`;
  const res = await apiFetch<T[]>(url);
  if (!res.success) {
    throw new Error(res.error?.message || '데이터를 불러오지 못했습니다.');
  }
  return {
    items: res.data ?? [],
    total: res.meta?.total ?? 0,
    page: res.meta?.page ?? page,
    size: res.meta?.size ?? size,
  };
}

export function getMyPosts(page = 0, size = 10, status = 'ALL') {
  return getPaged<MyPostActivity>(`/api/proxy/community/me/posts?status=${status}`, page, size);
}

export function getMyComments(page = 0, size = 10, status = 'ALL') {
  return getPaged<MyCommentActivity>(`/api/proxy/community/me/comments?status=${status}`, page, size);
}

export function getMyReports(page = 0, size = 10) {
  return getPaged<MyReportActivity>('/api/proxy/community/me/reports', page, size);
}

