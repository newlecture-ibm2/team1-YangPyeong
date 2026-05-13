import { apiFetch } from '@/lib/api-fetch';
import type { MyCommentActivity, MyPostActivity, MyReportActivity } from './community-activity.types';

interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

async function getPaged<T>(path: string, page = 0, size = 10): Promise<PagedResult<T>> {
  const res = await apiFetch<T[]>(`${path}?page=${page}&size=${size}`);
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

export function getMyPosts(page = 0, size = 10) {
  return getPaged<MyPostActivity>('/api/proxy/community/me/posts', page, size);
}

export function getMyComments(page = 0, size = 10) {
  return getPaged<MyCommentActivity>('/api/proxy/community/me/comments', page, size);
}

export function getMyReports(page = 0, size = 10) {
  return getPaged<MyReportActivity>('/api/proxy/community/me/reports', page, size);
}

