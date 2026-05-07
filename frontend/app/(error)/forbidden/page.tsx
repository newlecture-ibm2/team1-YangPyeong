/* ════════════════════════════════════════════════════════
   403 Forbidden — 권한 없음 안내 페이지
   app/forbidden/page.tsx
   ════════════════════════════════════════════════════════ */

import ErrorPage from '@/components/common/ErrorPage/ErrorPage';

export const metadata = {
  title: '403 — 접근 권한이 없습니다 | FarmBalance',
};

export default function ForbiddenPage() {
  return <ErrorPage statusCode={403} />;
}
